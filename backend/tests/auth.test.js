import request from 'supertest';
import app from '../src/app.js';

describe('Auth API', () => {
  it('should reject login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });
    
    expect(res.statusCode).toBe(401);
  });
  
  it('should require email and password fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    
    expect(res.statusCode).toBe(400); // Bad Request from Joi Validation
  });
});
