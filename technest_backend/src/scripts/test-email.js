require('dotenv').config({ path: '.env' });
const { sendEmail } = require('../services/email.service');

const to = process.argv[2];
const mask = (value) =>
  value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '(not set)';

(async () => {
  if (!to) {
    throw new Error('Usage: npm run email:test -- recipient@example.com');
  }

  console.log('Email configuration:');
  console.log(`  EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || '(auto)'}`);
  console.log(`  EMAIL_FROM:     ${process.env.EMAIL_FROM || '(not set)'}`);
  console.log(`  SMTP_HOST:      ${process.env.SMTP_HOST || '(not set)'}`);
  console.log(`  SMTP_USER:      ${mask(process.env.SMTP_USER)}`);
  console.log(`  SMTP_PASS:      ${process.env.SMTP_PASS ? '(set)' : '(not set)'}`);
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '(set)' : '(not set)'}`);
  console.log('');

  const result = await sendEmail({
    to,
    subject: 'TechNest email test',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="color:#5c7a0a;">TechNest email test</h2>
        <p>If you can read this, TechNest can deliver email to <strong>${to}</strong>.</p>
        <p style="color:#999;font-size:12px;">Sent at ${new Date().toISOString()}</p>
      </div>`,
  });

  console.log(`Test email accepted for ${to} (id: ${result.id})`);
})().catch((err) => {
  console.error(`Email test failed: ${err.message}`);
  process.exitCode = 1;
});
