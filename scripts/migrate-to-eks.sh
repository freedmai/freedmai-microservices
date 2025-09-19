#!/bin/bash

# FreedmAI Migration Script: Docker Compose → EKS
# This script migrates your existing deployment to EKS with zero downtime

set -e

echo "🚀 FreedmAI EKS Migration Script"
echo "================================"

# Configuration
CLUSTER_NAME="freedm-ai-cluster"
REGION="us-east-1"
NODE_GROUP_NAME="freedm-ai-nodes"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl not found. Installing kubectl..."
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
    
    # Check eksctl
    if ! command -v eksctl &> /dev/null; then
        echo "❌ eksctl not found. Installing eksctl..."
        curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
        sudo mv /tmp/eksctl /usr/local/bin
    fi
    
    echo "✅ Prerequisites check completed"
}

# Create EKS cluster
create_eks_cluster() {
    echo "🏗️ Creating EKS cluster..."
    
    cat > cluster-config.yaml << EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${CLUSTER_NAME}
  region: ${REGION}

nodeGroups:
  - name: ${NODE_GROUP_NAME}
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 4
    volumeSize: 20
    ssh:
      allow: true
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        certManager: true
        efs: true
        ebs: true
        albIngress: true
        cloudWatch: true

addons:
  - name: vpc-cni
  - name: coredns
  - name: kube-proxy
  - name: aws-ebs-csi-driver
EOF

    eksctl create cluster -f cluster-config.yaml
    
    echo "✅ EKS cluster created successfully"
}

# Convert Docker Compose to Kubernetes manifests
convert_to_kubernetes() {
    echo "🔄 Converting Docker Compose to Kubernetes manifests..."
    
    # Install kompose if not available
    if ! command -v kompose &> /dev/null; then
        curl -L https://github.com/kubernetes/kompose/releases/latest/download/kompose-linux-amd64 -o kompose
        chmod +x kompose
        sudo mv kompose /usr/local/bin
    fi
    
    # Create k8s directory
    mkdir -p k8s-manifests
    
    # Convert production compose file
    kompose convert -f prod-docker-compose.yml -o k8s-manifests/
    
    # Create namespace
    cat > k8s-manifests/namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: freedm-ai
EOF

    # Create ConfigMap
    cat > k8s-manifests/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: freedm-ai-config
  namespace: freedm-ai
data:
  NODE_ENV: "production"
  DB_HOST: "${DB_HOST}"
  DB_NAME: "${DB_NAME}"
  USER_SERVICE_URL: "http://user-service:3001"
  OTP_SERVICE_URL: "http://otp-service:3007"
  NOTIFICATION_SERVICE_URL: "http://notification-service:3006"
EOF

    # Create Secrets
    cat > k8s-manifests/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: freedm-ai-secrets
  namespace: freedm-ai
type: Opaque
data:
  DB_USER: $(echo -n "${DB_USER}" | base64)
  DB_PASSWORD: $(echo -n "${DB_PASSWORD}" | base64)
  JWT_SECRET: $(echo -n "${JWT_SECRET}" | base64)
  SMS_API_KEY: $(echo -n "${SMS_API_KEY}" | base64)
  EMAIL_API_KEY: $(echo -n "${EMAIL_API_KEY}" | base64)
EOF

    echo "✅ Kubernetes manifests created"
}

# Setup AWS Load Balancer Controller
setup_alb_controller() {
    echo "🔧 Setting up AWS Load Balancer Controller..."
    
    # Create IAM policy
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.4.4/docs/install/iam_policy.json
    
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json || true
    
    # Create service account
    eksctl create iamserviceaccount \
        --cluster=${CLUSTER_NAME} \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --role-name "AmazonEKSLoadBalancerControllerRole" \
        --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
        --approve
    
    # Install ALB controller
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName=${CLUSTER_NAME} \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    echo "✅ AWS Load Balancer Controller installed"
}

# Deploy applications to EKS
deploy_to_eks() {
    echo "🚀 Deploying applications to EKS..."
    
    # Update kubeconfig
    aws eks update-kubeconfig --region ${REGION} --name ${CLUSTER_NAME}
    
    # Apply manifests
    kubectl apply -f k8s-manifests/namespace.yaml
    kubectl apply -f k8s-manifests/configmap.yaml
    kubectl apply -f k8s-manifests/secrets.yaml
    kubectl apply -f k8s-manifests/
    
    # Create Ingress
    cat > k8s-manifests/ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: freedm-ai-ingress
  namespace: freedm-ai
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
  - host: api.freedmai.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
EOF

    kubectl apply -f k8s-manifests/ingress.yaml
    
    echo "✅ Applications deployed to EKS"
}

# Setup monitoring
setup_monitoring() {
    echo "📊 Setting up monitoring..."
    
    # Enable Container Insights
    curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml | sed "s/{{cluster_name}}/${CLUSTER_NAME}/;s/{{region_name}}/${REGION}/" | kubectl apply -f -
    
    echo "✅ Monitoring setup completed"
}

# Migrate traffic gradually
migrate_traffic() {
    echo "🔄 Starting traffic migration..."
    
    # Get ALB DNS name
    ALB_DNS=$(kubectl get ingress freedm-ai-ingress -n freedm-ai -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    echo "📋 Migration Steps:"
    echo "1. Update your DNS to point to: ${ALB_DNS}"
    echo "2. Test the new EKS deployment thoroughly"
    echo "3. Monitor for 24-48 hours"
    echo "4. Once stable, run: ./cleanup-old-infrastructure.sh"
    
    echo "✅ EKS deployment ready for traffic"
}

# Cleanup function
cleanup_on_error() {
    echo "❌ Migration failed. Cleaning up..."
    eksctl delete cluster --name ${CLUSTER_NAME} --region ${REGION} || true
    rm -rf k8s-manifests/ cluster-config.yaml iam_policy.json
}

# Main migration process
main() {
    echo "Starting FreedmAI EKS migration..."
    
    # Set error handler
    trap cleanup_on_error ERR
    
    # Migration steps
    check_prerequisites
    create_eks_cluster
    convert_to_kubernetes
    setup_alb_controller
    deploy_to_eks
    setup_monitoring
    migrate_traffic
    
    echo "🎉 EKS migration completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test your application at: ${ALB_DNS}"
    echo "2. Update DNS records to point to the new ALB"
    echo "3. Monitor the deployment for 24-48 hours"
    echo "4. Run cleanup script to remove old infrastructure"
    echo ""
    echo "💰 New monthly cost: ~$150 (vs $18 previously)"
    echo "🚀 You now have enterprise-grade Kubernetes deployment!"
}

# Run migration
main "$@"
