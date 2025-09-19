const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock user authentication (in production, use proper auth)
const users = {
  'admin': { role: 'admin', permissions: ['deploy', 'rollback', 'view'] },
  'developer': { role: 'developer', permissions: ['deploy', 'view'] },
  'qa': { role: 'qa', permissions: ['view'] }
};

// Available services
const services = [
  { name: 'api-gateway', port: 3000, status: 'running' },
  { name: 'auth-service', port: 3001, status: 'running' },
  { name: 'billing-service', port: 3002, status: 'running' },
  { name: 'payment-service', port: 3003, status: 'running' },
  { name: 'user-service', port: 3004, status: 'running' },
  { name: 'notification-service', port: 3005, status: 'running' }
];

// Deployment history
let deploymentHistory = [];

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', { 
    services, 
    deploymentHistory: deploymentHistory.slice(-10),
    user: { name: 'admin', role: 'admin' }
  });
});

app.get('/api/services/status', async (req, res) => {
  try {
    const statusPromises = services.map(async (service) => {
      return new Promise((resolve) => {
        exec(`curl -f -s http://localhost:${service.port}/health`, (error, stdout) => {
          const isHealthy = !error && stdout.includes('healthy');
          resolve({
            ...service,
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date().toISOString()
          });
        });
      });
    });
    
    const serviceStatuses = await Promise.all(statusPromises);
    res.json(serviceStatuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check service status' });
  }
});

app.post('/api/deploy', (req, res) => {
  const { services: selectedServices, imageTag, environment } = req.body;
  
  if (!selectedServices || selectedServices.length === 0) {
    return res.status(400).json({ error: 'No services selected' });
  }

  const deploymentId = Date.now().toString();
  const deployment = {
    id: deploymentId,
    services: selectedServices,
    imageTag: imageTag || 'latest',
    environment: environment || 'uat',
    status: 'in-progress',
    startTime: new Date().toISOString(),
    logs: []
  };

  deploymentHistory.unshift(deployment);

  // Emit deployment started
  io.emit('deploymentStarted', deployment);

  // Simulate deployment process
  const deployCommand = `cd /var/Freedm/project && sudo docker-compose -f docker-compose-complete.yml restart ${selectedServices.join(' ')}`;
  
  exec(deployCommand, (error, stdout, stderr) => {
    const endTime = new Date().toISOString();
    const success = !error;
    
    deployment.status = success ? 'success' : 'failed';
    deployment.endTime = endTime;
    deployment.logs = [
      `Deployment started at ${deployment.startTime}`,
      `Services: ${selectedServices.join(', ')}`,
      `Image tag: ${deployment.imageTag}`,
      stdout || '',
      stderr || '',
      `Deployment ${success ? 'completed successfully' : 'failed'} at ${endTime}`
    ];

    // Emit deployment completed
    io.emit('deploymentCompleted', deployment);
  });

  res.json({ deploymentId, message: 'Deployment started' });
});

app.post('/api/rollback', (req, res) => {
  const { deploymentId } = req.body;
  
  const deployment = deploymentHistory.find(d => d.id === deploymentId);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  // Simulate rollback
  const rollbackId = Date.now().toString();
  const rollback = {
    id: rollbackId,
    type: 'rollback',
    originalDeployment: deploymentId,
    services: deployment.services,
    status: 'in-progress',
    startTime: new Date().toISOString(),
    logs: [`Rolling back deployment ${deploymentId}...`]
  };

  deploymentHistory.unshift(rollback);
  io.emit('rollbackStarted', rollback);

  // Simulate rollback process
  setTimeout(() => {
    rollback.status = 'success';
    rollback.endTime = new Date().toISOString();
    rollback.logs.push('Rollback completed successfully');
    
    io.emit('rollbackCompleted', rollback);
  }, 3000);

  res.json({ rollbackId, message: 'Rollback started' });
});

app.get('/api/deployments', (req, res) => {
  res.json(deploymentHistory.slice(0, 20));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Deployment UI running on http://localhost:${PORT}`);
});
