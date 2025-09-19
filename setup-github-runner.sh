#!/bin/bash

# GitHub Self-Hosted Runner Setup
set -e

echo "🏃 Setting up GitHub Self-Hosted Runner for FreedmAI..."

# Configuration
GITHUB_ORG="freedmai"
REPO_NAME="freedmai-microservices"
RUNNER_NAME="freedmai-uat-runner"
RUNNER_LABELS="uat,docker,linux,x64"

# Create runner directory
RUNNER_DIR="/opt/github-runner"
sudo mkdir -p $RUNNER_DIR
cd $RUNNER_DIR

# Download GitHub Actions Runner
echo "📥 Downloading GitHub Actions Runner..."
RUNNER_VERSION="2.311.0"
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# Verify download
echo "🔍 Verifying download..."
echo "29fc8cf2dab4c195bb147384e7e2c94cfd4d4022c793b346a6175435265aa278  actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" | shasum -a 256 -c

# Extract runner
echo "📦 Extracting runner..."
tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# Create runner user
echo "👤 Creating runner user..."
sudo useradd -m -s /bin/bash github-runner || true
sudo usermod -aG docker github-runner
sudo chown -R github-runner:github-runner $RUNNER_DIR

# Get registration token
echo "🔑 Getting registration token..."
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first."
    exit 1
fi

# Generate registration token
REGISTRATION_TOKEN=$(gh api repos/$GITHUB_ORG/$REPO_NAME/actions/runners/registration-token --jq .token)

# Configure runner as github-runner user
echo "⚙️ Configuring runner..."
sudo -u github-runner ./config.sh \
    --url https://github.com/$GITHUB_ORG/$REPO_NAME \
    --token $REGISTRATION_TOKEN \
    --name $RUNNER_NAME \
    --labels $RUNNER_LABELS \
    --work _work \
    --replace

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/github-runner.service > /dev/null << EOF
[Unit]
Description=GitHub Actions Runner
After=network.target

[Service]
Type=simple
User=github-runner
Group=github-runner
WorkingDirectory=$RUNNER_DIR
ExecStart=$RUNNER_DIR/run.sh
Restart=always
RestartSec=5
KillMode=process
KillSignal=SIGTERM
TimeoutStopSec=5min

# Environment variables
Environment=DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
Environment=RUNNER_ALLOW_RUNASROOT=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🚀 Starting GitHub runner service..."
sudo systemctl daemon-reload
sudo systemctl enable github-runner
sudo systemctl start github-runner

# Create runner management script
echo "📝 Creating runner management script..."
sudo tee /usr/local/bin/github-runner-manage << 'EOF'
#!/bin/bash

RUNNER_DIR="/opt/github-runner"
SERVICE_NAME="github-runner"

case "$1" in
    start)
        echo "Starting GitHub runner..."
        sudo systemctl start $SERVICE_NAME
        ;;
    stop)
        echo "Stopping GitHub runner..."
        sudo systemctl stop $SERVICE_NAME
        ;;
    restart)
        echo "Restarting GitHub runner..."
        sudo systemctl restart $SERVICE_NAME
        ;;
    status)
        echo "GitHub runner status:"
        sudo systemctl status $SERVICE_NAME
        ;;
    logs)
        echo "GitHub runner logs:"
        sudo journalctl -u $SERVICE_NAME -f
        ;;
    update)
        echo "Updating GitHub runner..."
        sudo systemctl stop $SERVICE_NAME
        cd $RUNNER_DIR
        sudo -u github-runner ./config.sh remove --token $2
        # Download and install new version
        # Reconfigure with new token
        sudo systemctl start $SERVICE_NAME
        ;;
    remove)
        echo "Removing GitHub runner..."
        sudo systemctl stop $SERVICE_NAME
        sudo systemctl disable $SERVICE_NAME
        cd $RUNNER_DIR
        sudo -u github-runner ./config.sh remove --token $2
        sudo rm /etc/systemd/system/github-runner.service
        sudo systemctl daemon-reload
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|update|remove}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the GitHub runner service"
        echo "  stop    - Stop the GitHub runner service"
        echo "  restart - Restart the GitHub runner service"
        echo "  status  - Show runner service status"
        echo "  logs    - Show runner logs (follow mode)"
        echo "  update  - Update runner (requires token)"
        echo "  remove  - Remove runner (requires token)"
        exit 1
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/github-runner-manage

# Create runner health check script
echo "🏥 Creating health check script..."
sudo tee /usr/local/bin/github-runner-health << 'EOF'
#!/bin/bash

RUNNER_DIR="/opt/github-runner"
SERVICE_NAME="github-runner"

echo "🏃 GitHub Runner Health Check"
echo "=============================="

# Check service status
echo "Service Status:"
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "  ✅ Service is running"
else
    echo "  ❌ Service is not running"
fi

# Check runner registration
echo ""
echo "Runner Registration:"
if [ -f "$RUNNER_DIR/.runner" ]; then
    echo "  ✅ Runner is registered"
    cat $RUNNER_DIR/.runner | jq -r '"  Runner: " + .agentName + " (ID: " + (.agentId|tostring) + ")"'
else
    echo "  ❌ Runner is not registered"
fi

# Check Docker access
echo ""
echo "Docker Access:"
if sudo -u github-runner docker ps > /dev/null 2>&1; then
    echo "  ✅ Docker access working"
else
    echo "  ❌ Docker access failed"
fi

# Check disk space
echo ""
echo "Disk Space:"
DISK_USAGE=$(df $RUNNER_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "  ✅ Disk usage: ${DISK_USAGE}%"
else
    echo "  ⚠️  Disk usage: ${DISK_USAGE}% (High)"
fi

# Check recent logs
echo ""
echo "Recent Activity:"
sudo journalctl -u $SERVICE_NAME --since "5 minutes ago" --no-pager -q | tail -5 | while read line; do
    echo "  $line"
done

echo ""
echo "Health check completed at $(date)"
EOF

sudo chmod +x /usr/local/bin/github-runner-health

# Create monitoring script
echo "📊 Creating monitoring script..."
sudo tee /usr/local/bin/github-runner-monitor << 'EOF'
#!/bin/bash

# GitHub Runner Monitoring Script
RUNNER_DIR="/opt/github-runner"
SERVICE_NAME="github-runner"
LOG_FILE="/var/log/github-runner-monitor.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a $LOG_FILE
}

# Check if service is running
if ! sudo systemctl is-active --quiet $SERVICE_NAME; then
    log_message "WARNING: GitHub runner service is not running. Attempting to start..."
    sudo systemctl start $SERVICE_NAME
    sleep 10
    
    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        log_message "SUCCESS: GitHub runner service started successfully"
    else
        log_message "ERROR: Failed to start GitHub runner service"
    fi
fi

# Check disk space
DISK_USAGE=$(df $RUNNER_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log_message "WARNING: High disk usage: ${DISK_USAGE}%"
    
    # Cleanup old workflow runs
    find $RUNNER_DIR/_work -type d -name "*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    log_message "INFO: Cleaned up old workflow runs"
fi

# Check for errors in logs
ERROR_COUNT=$(sudo journalctl -u $SERVICE_NAME --since "1 hour ago" --no-pager -q | grep -i error | wc -l)
if [ $ERROR_COUNT -gt 5 ]; then
    log_message "WARNING: High error count in logs: $ERROR_COUNT errors in last hour"
fi

log_message "INFO: Monitoring check completed"
EOF

sudo chmod +x /usr/local/bin/github-runner-monitor

# Setup monitoring cron job
echo "⏰ Setting up monitoring cron job..."
(sudo crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/github-runner-monitor") | sudo crontab -

# Create runner configuration backup
echo "💾 Creating configuration backup..."
sudo mkdir -p /opt/github-runner-backup
sudo cp -r $RUNNER_DIR/.runner /opt/github-runner-backup/ 2>/dev/null || true
sudo cp -r $RUNNER_DIR/.credentials* /opt/github-runner-backup/ 2>/dev/null || true

# Test runner
echo "🧪 Testing runner setup..."
sleep 5
github-runner-health

echo ""
echo "🎉 GitHub Self-Hosted Runner setup complete!"
echo ""
echo "📋 Runner Details:"
echo "  Name: $RUNNER_NAME"
echo "  Labels: $RUNNER_LABELS"
echo "  Directory: $RUNNER_DIR"
echo "  Service: $SERVICE_NAME"
echo ""
echo "🔧 Management Commands:"
echo "  github-runner-manage status   # Check runner status"
echo "  github-runner-manage logs     # View runner logs"
echo "  github-runner-manage restart  # Restart runner"
echo "  github-runner-health          # Run health check"
echo ""
echo "📊 Monitoring:"
echo "  Log file: /var/log/github-runner-monitor.log"
echo "  Cron job: Every 5 minutes"
echo ""
echo "🌐 GitHub Repository:"
echo "  https://github.com/$GITHUB_ORG/$REPO_NAME/settings/actions/runners"
echo ""
echo "✅ Runner is ready to accept jobs!"
