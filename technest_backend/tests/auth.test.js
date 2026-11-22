const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

beforeAll(async () => {
  await prisma.$connect();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: ['test@test.com', 'login@test.com'] } } });
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: ['test@test.com', 'login@test.com'] } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should resend verification for an unverified duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
  });

  it('should return 400 for a duplicate email once verified', async () => {
    await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { isVerified: true },
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login and return accessToken', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Login Test', email: 'login@test.com', password: 'password123' });

    // Registration requires email verification; simulate the verified state.
    await prisma.user.update({
      where: { email: 'login@test.com' },
      data: { isVerified: true },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
