const nodemailer = require('nodemailer');

const provider = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const resendConfigured = Boolean(process.env.RESEND_API_KEY);

// EMAIL_PROVIDER wins when set; otherwise prefer SMTP when credentials exist.
const useSmtp = provider === 'smtp' || (!provider && smtpConfigured);
const useResend =
  provider === 'resend' || (!provider && !smtpConfigured && resendConfigured);

const FROM =
  process.env.EMAIL_FROM ||
  (useSmtp
    ? `TechNest <${process.env.SMTP_USER}>`
    : 'TechNest <onboarding@resend.dev>');

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
  process.env.SMTP_SECURE != null
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

async function sendViaResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || `Resend API responded with ${response.status}`;
    throw new Error(message);
  }

  console.log('[EmailService] Sent via Resend:', subject, '→', to, '| id:', payload?.id);
  return { id: payload?.id };
}

async function sendEmail({ to, subject, html }) {
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-email-skipped' };
  }

  if (useSmtp) {
    try {
      const info = await transporter.sendMail({ from: FROM, to, subject, html });
      console.log('[EmailService] Sent via SMTP:', subject, '→', to, '| id:', info.messageId);
      return { id: info.messageId };
    } catch (err) {
      console.error('[EmailService] SMTP error:', err.message);
      throw err;
    }
  }

  if (useResend) {
    try {
      return await sendViaResend({ to, subject, html });
    } catch (err) {
      console.error('[EmailService] Resend error:', err.message);
      throw err;
    }
  }

  throw new Error(
    'Email service is not configured. Set SMTP_USER and SMTP_PASS (Brevo/Gmail) or RESEND_API_KEY in the environment.'
  );
}

const wrap = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;padding:24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:22px;font-weight:bold;color:#f59e0b;">⚡ TechNest</span>
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
    <p style="color:#aaa;font-size:12px;text-align:center;">
      © ${new Date().getFullYear()} TechNest. All rights reserved.
    </p>
  </div>`;

const btn = (url, label) =>
  `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#fff;
   text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">${label}</a>`;

async function sendVerificationEmail(user, verifyUrl) {
  return sendEmail({
    to: user.email,
    subject: 'Verify your TechNest email',
    html: wrap(`
      <h2 style="margin-bottom:8px;">Welcome, ${user.name}!</h2>
      <p>Thanks for signing up. Please verify your email address to activate your account.</p>
      <p style="margin:32px 0;">${btn(verifyUrl, 'Verify Email')}</p>
      <p style="color:#999;font-size:13px;">
        This link expires in <strong>24 hours</strong>.<br/>
        If you didn't create an account, you can safely ignore this email.
      </p>
    `),
  });
}

async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: 'Your TechNest account is ready',
    html: wrap(`
      <h2>You're all set, ${user.name}!</h2>
      <p>Your email has been verified. Start exploring the best tech deals on TechNest.</p>
      <p style="margin:32px 0;">${btn(process.env.CLIENT_URL + '/products', 'Shop Now')}</p>
    `),
  });
}

async function sendPasswordResetEmail(user, resetUrl) {
  return sendEmail({
    to: user.email,
    subject: 'Reset your TechNest password',
    html: wrap(`
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name}, we received a request to reset your password.</p>
      <p style="margin:32px 0;">${btn(resetUrl, 'Reset Password')}</p>
      <p style="color:#999;font-size:13px;">
        This link expires in <strong>1 hour</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    `),
  });
}

const orderRef = (order) => order.id || order._id || '';
const money = (value) => Number(value || 0).toFixed(2);

async function sendOrderConfirmationEmail(user, order) {
  // order.items: [{ name, price, quantity }]
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>`).join('');

  const addr = order.shippingAddress;
  const addrLine = addr
    ? `${addr.line1}, ${addr.city}${addr.state ? ', ' + addr.state : ''}`
    : 'N/A';

  return sendEmail({
    to: user.email,
    subject: `Order confirmed — #${orderRef(order)}`,
    html: wrap(`
      <h2>Your order is confirmed!</h2>
      <p>Hi ${user.name}, thanks for your purchase. Here's your summary:</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 8px;text-align:left;font-size:13px;color:#555;">Item</th>
            <th style="padding:10px 8px;text-align:center;font-size:13px;color:#555;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:13px;color:#555;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          ${order.discount > 0 ? `
          <tr>
            <td colspan="2" style="padding:8px;text-align:right;color:#16a34a;">Discount</td>
            <td style="padding:8px;text-align:right;color:#16a34a;">-$${money(order.discount)}</td>
          </tr>` : ''}
          ${order.tax ? `
          <tr>
            <td colspan="2" style="padding:8px;text-align:right;color:#555;">Tax</td>
            <td style="padding:8px;text-align:right;color:#555;">$${money(order.tax)}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total</td>
            <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:16px;">
              $${money(order.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:4px 0;"><strong>Shipping to:</strong> ${addrLine}</p>
      <p style="margin:4px 0;"><strong>Method:</strong> ${order.shippingMethod || 'Standard'}</p>
      <p style="color:#999;font-size:12px;margin-top:16px;">Order ID: ${orderRef(order)}</p>
    `),
  });
}


async function sendOrderShippedEmail(user, order) {
  const trackingInfo = order.trackingNumber
    ? `<p><strong>Tracking #:</strong> ${order.trackingNumber}${order.carrier ? ' (' + order.carrier + ')' : ''}</p>`
    : '';

  return sendEmail({
    to: user.email,
    subject: `Your order #${orderRef(order)} has shipped! 🚚`,
    html: wrap(`
      <h2>It's on the way!</h2>
      <p>Hi ${user.name}, your TechNest order has been shipped.</p>
      ${trackingInfo}
      <p style="color:#999;font-size:12px;margin-top:24px;">Order ID: ${orderRef(order)}</p>
    `),
  });
}


async function sendOrderCancelledEmail(user, order) {
  return sendEmail({
    to: user.email,
    subject: `Order #${orderRef(order)} cancelled`,
    html: wrap(`
      <h2>Order Cancelled</h2>
      <p>Hi ${user.name}, your order <strong>#${orderRef(order)}</strong> has been cancelled.</p>
      <p>If a payment was collected, a refund will be processed within 5–7 business days.</p>
      <p>Questions? Reply to this email or contact our support team.</p>
    `),
  });
}

async function sendOrderDeliveredEmail(user, order) {
  return sendEmail({
    to: user.email,
    subject: `Your order has been delivered!`,
    html: wrap(`
      <h2>Delivered!</h2>
      <p>Hi ${user.name}, your order <strong>#${orderRef(order)}</strong> has been delivered.</p>
      <p>We hope you love your purchase. If anything's wrong, please reach out within 7 days.</p>
      <p style="margin:32px 0;">${btn(process.env.CLIENT_URL + '/orders/' + orderRef(order), 'View Order')}</p>
    `),
  });
}

async function sendSubscriptionConfirmEmail(email, name, confirmUrl) {
  return sendEmail({
    to: email,
    subject: 'Confirm your TechNest subscription',
    html: wrap(`
      <h2>Almost there${name ? ', ' + name : ''}! 🎉</h2>
      <p>Thanks for subscribing to TechNest deals and updates.</p>
      <p>Click the button below to confirm your subscription:</p>
      <p style="margin:32px 0;">${btn(confirmUrl, 'Confirm Subscription')}</p>
      <p style="color:#999;font-size:13px;">
        If you didn't subscribe, you can safely ignore this email.<br/>
        You won't receive any emails until you confirm.
      </p>
    `),
  });
}

async function sendSubscriptionWelcomeEmail(email, name) {
  return sendEmail({
    to: email,
    subject: 'Welcome to TechNest newsletter! 🛍️',
    html: wrap(`
      <h2>You're in${name ? ', ' + name : ''}!</h2>
      <p>You've successfully subscribed to TechNest. Expect the best deals, new arrivals, and exclusive offers straight to your inbox.</p>
      <p style="margin:32px 0;">${btn(process.env.CLIENT_URL + '/products', 'Shop Latest Deals')}</p>
      <p style="color:#999;font-size:13px;">
        You can unsubscribe anytime by clicking the unsubscribe link in any email.
      </p>
    `),
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
   sendSubscriptionConfirmEmail,   
  sendSubscriptionWelcomeEmail, 
};