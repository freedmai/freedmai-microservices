#!/bin/bash

# Complete GitHub Runner Setup for FreedmAI
echo "🏃 Completing GitHub Runner Setup..."

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Please provide the registration token from GitHub"
    echo "1. Go to: https://github.com/freedmai/freedmai-microservices/settings/actions/runners/new"
    echo "2. Copy the registration token"
    echo "3. Run: ./complete-runner-setup.sh YOUR_TOKEN"
    exit 1
fi

REGISTRATION_TOKEN=$1
RUNNER_DIR="/opt/github-runner"

echo "⚙️ Configuring runner with token..."
cd $RUNNER_DIR
sudo -u github-runner ./config.sh \
    --url https://github.com/freedmai/freedmai-microservices \
    --token $REGISTRATION_TOKEN \
    --name freedmai-uat-runner \
    --labels uat,docker,linux,x64 \
    --work _work \
    --replace

echo "🔧 Creating systemd service..."
sudo ./svc.sh install

echo "🚀 Starting runner service..."
sudo ./svc.sh start

echo "✅ Runner setup completed!"
echo ""
echo "📊 Runner Status:"
sudo ./svc.sh status

echo ""
echo "🎉 GitHub Runner is now ready!"
echo "🌐 Check at: https://github.com/freedmai/freedmai-microservices/settings/actions/runners"
