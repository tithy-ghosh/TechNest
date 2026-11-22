require('dotenv').config();

process.env.NODE_ENV = 'test';

// Never fall back to the production DATABASE_URL here. Tests delete data.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/technest_test?schema=public';

process.env.CLIENT_URL = 'http://localhost:3000';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.SMTP_HOST = 'smtp-relay.brevo.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'smtp-test@example.com';
process.env.SMTP_PASS = 'smtp-test-password';
process.env.EMAIL_FROM = 'TechNest <test@example.com>';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
