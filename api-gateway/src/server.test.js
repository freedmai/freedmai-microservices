const request = require('supertest');
const app = require('./server');

describe('API Gateway', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
  });

  test('404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);
    
    expect(response.body.error).toBe('Route not found');
  });
});
