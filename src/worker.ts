import nodemailer from 'nodemailer';

export interface Env {
  SMTP_PASSWORD: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Handle the contact form submission
    if (url.pathname === '/api/send' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { name: string; email: string; message: string };
        const { name, email, message } = body;

        if (!name || !email || !message) {
          return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const transporter = nodemailer.createTransport({
          host: 'mail.platour.net',
          port: 587,
          secure: false, // true for 465, false for other ports (587 uses StartTLS)
          auth: {
            user: 'noreply@platour.net',
            pass: env.SMTP_PASSWORD,
          },
          tls: {
            // Some SMTP servers require this for StartTLS in Cloudflare environment
            rejectUnauthorized: false 
          }
        });

        await transporter.sendMail({
          from: '"Portfolio Contact" <noreply@platour.net>',
          to: 'info@platour.net',
          subject: `Portfolio: Message from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
          replyTo: email,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Email sending failed:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle OPTIONS for CORS (if needed)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Default: Serve frontend assets
    return env.ASSETS.fetch(request);
  },
};
