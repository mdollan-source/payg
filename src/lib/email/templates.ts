/**
 * Email templates for PAYGSite
 */

interface TemplateData {
  businessName?: string;
  dashboardUrl?: string;
  siteUrl?: string;
  magicLink?: string;
  [key: string]: unknown;
}

/**
 * Base email wrapper with consistent styling
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAYGSite</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">PAYGSite</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; font-size: 12px; color: #71717a;">
              <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} PAYGSite. All rights reserved.</p>
              <p style="margin: 0;">Pay-As-You-Go websites for UK small businesses</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Site ready email - sent when AI generation completes
 */
export function siteReadyEmail(data: TemplateData): { subject: string; html: string; text: string } {
  const subject = `Your website is ready! - ${data.businessName}`;

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Great news! Your website is live 🎉</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Hi there,
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Your website for <strong>${data.businessName}</strong> has been created and is now live!
    </p>
    <p style="margin: 0 0 24px 0; color: #3f3f46; line-height: 1.6;">
      You can view your site at:
    </p>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.siteUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Your Website
      </a>
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      To make changes to your site, access your dashboard:
    </p>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.dashboardUrl}" style="color: #2563eb; text-decoration: underline;">
        ${data.dashboardUrl}
      </a>
    </p>
    <p style="margin: 0; color: #3f3f46; line-height: 1.6;">
      If you have any questions, just reply to this email.
    </p>
  `);

  const text = `
Great news! Your website is live!

Your website for ${data.businessName} has been created and is now live.

View your site: ${data.siteUrl}

To make changes, access your dashboard: ${data.dashboardUrl}

If you have any questions, just reply to this email.

- The PAYGSite Team
`;

  return { subject, html, text };
}

/**
 * Magic link email - for passwordless authentication
 */
export function magicLinkEmail(data: TemplateData): { subject: string; html: string; text: string } {
  const subject = "Sign in to PAYGSite";

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Sign in to your dashboard</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Click the button below to sign in to your PAYGSite dashboard. This link will expire in 24 hours.
    </p>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.magicLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Sign In
      </a>
    </p>
    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
      If you didn't request this email, you can safely ignore it.
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:<br>
      <span style="word-break: break-all;">${data.magicLink}</span>
    </p>
  `);

  const text = `
Sign in to PAYGSite

Click the link below to sign in to your dashboard. This link will expire in 24 hours.

${data.magicLink}

If you didn't request this email, you can safely ignore it.

- The PAYGSite Team
`;

  return { subject, html, text };
}

/**
 * Payment failed email
 */
export function paymentFailedEmail(data: TemplateData): { subject: string; html: string; text: string } {
  const subject = `Action required: Payment failed - ${data.businessName}`;

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Payment failed</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      We were unable to process your payment for <strong>${data.businessName}</strong>.
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      To keep your website active, please update your payment method:
    </p>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.dashboardUrl}/billing" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Update Payment Method
      </a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
      If you have any questions, please reply to this email.
    </p>
  `);

  const text = `
Payment failed

We were unable to process your payment for ${data.businessName}.

To keep your website active, please update your payment method:
${data.dashboardUrl}/billing

If you have any questions, please reply to this email.

- The PAYGSite Team
`;

  return { subject, html, text };
}

/**
 * Subscription cancelled email
 */
export function subscriptionCancelledEmail(data: TemplateData): { subject: string; html: string; text: string } {
  const subject = `Subscription cancelled - ${data.businessName}`;

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Your subscription has been cancelled</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Your subscription for <strong>${data.businessName}</strong> has been cancelled.
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Your website will remain accessible until the end of your current billing period.
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      If you'd like to reactivate your subscription, you can do so from your dashboard:
    </p>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.dashboardUrl}/billing" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Reactivate Subscription
      </a>
    </p>
    <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
      We're sorry to see you go. If there's anything we could have done better, please let us know.
    </p>
  `);

  const text = `
Your subscription has been cancelled

Your subscription for ${data.businessName} has been cancelled.

Your website will remain accessible until the end of your current billing period.

If you'd like to reactivate your subscription:
${data.dashboardUrl}/billing

We're sorry to see you go. If there's anything we could have done better, please let us know.

- The PAYGSite Team
`;

  return { subject, html, text };
}

/**
 * Contact form submission email - sent to tenant owner
 */
export function contactFormEmail(data: TemplateData & {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = `New contact form submission - ${data.businessName}`;

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">New message from your website</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      You've received a new message through your website contact form:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a; width: 100px;">Name:</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #18181b;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Email:</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #18181b;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
      </tr>
      ${data.phone ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Phone:</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #18181b;"><a href="tel:${data.phone.replace(/\s/g, '')}" style="color: #2563eb;">${data.phone}</a></td>
      </tr>
      ` : ''}
    </table>
    <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin: 0 0 24px 0;">
      <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Message:</p>
      <p style="margin: 0; color: #18181b; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
    </div>
    <p style="margin: 0;">
      <a href="mailto:${data.email}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Reply to ${data.name}
      </a>
    </p>
  `);

  const text = `
New message from your website

You've received a new message through your website contact form:

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}

Message:
${data.message}

Reply directly to: ${data.email}

- PAYGSite
`;

  return { subject, html, text };
}

/**
 * Welcome email - sent after successful payment
 */
export function welcomeEmail(data: TemplateData): { subject: string; html: string; text: string } {
  const subject = `Welcome to PAYGSite! - ${data.businessName}`;

  const html = emailWrapper(`
    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px;">Welcome to PAYGSite! 🎉</h2>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Hi there,
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      Thank you for signing up! Your account for <strong>${data.businessName}</strong> is ready.
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      We're building your website now. You'll receive another email once it's ready for you to review.
    </p>
    <p style="margin: 0 0 16px 0; color: #3f3f46; line-height: 1.6;">
      In the meantime, you can access your dashboard to:
    </p>
    <ul style="margin: 0 0 24px 0; color: #3f3f46; line-height: 1.8; padding-left: 20px;">
      <li>View your account details</li>
      <li>Submit change requests</li>
      <li>Manage your billing</li>
    </ul>
    <p style="margin: 0 0 24px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Access Your Dashboard
      </a>
    </p>
    <p style="margin: 0; color: #3f3f46; line-height: 1.6;">
      If you have any questions, just reply to this email.
    </p>
  `);

  const text = `
Welcome to PAYGSite!

Thank you for signing up! Your account for ${data.businessName} is ready.

We're building your website now. You'll receive another email once it's ready for you to review.

In the meantime, you can access your dashboard:
${data.dashboardUrl}

If you have any questions, just reply to this email.

- The PAYGSite Team
`;

  return { subject, html, text };
}

/**
 * Get template by name
 */
export function getTemplate(
  templateName: string,
  data: TemplateData
): { subject: string; html: string; text: string } | null {
  switch (templateName) {
    case "welcome":
      return welcomeEmail(data);
    case "site_ready":
      return siteReadyEmail(data);
    case "magic_link":
      return magicLinkEmail(data);
    case "payment_failed":
      return paymentFailedEmail(data);
    case "subscription_cancelled":
      return subscriptionCancelledEmail(data);
    case "contact_form":
      return contactFormEmail(data as TemplateData & { name: string; email: string; message: string });
    default:
      console.warn(`Unknown email template: ${templateName}`);
      return null;
  }
}
