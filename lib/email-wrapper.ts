/**
 * Standard Email Wrapper
 * Provides a professional, responsive layout for all emails.
 * Separated from email.ts to allow client-side preview without nodemailer dependency.
 */
export function getEmailWrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ultramaxo AI</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #0c0c0e; color: #e4e4e7; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0c0c0e; }
        .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid #27272a; }
        .content { padding: 40px 20px; background-color: #18181b; border-radius: 12px; margin: 20px; border: 1px solid #27272a; }
        .footer { padding: 40px 20px; text-align: center; color: #71717a; font-size: 12px; }
        h1, h2, h3 { color: #ffffff; margin-top: 0; }
        p { line-height: 1.6; color: #a1a1aa; margin-bottom: 1.5em; }
        strong { color: #fff; }
        ul { padding-left: 20px; margin-bottom: 1.5em; color: #a1a1aa; }
        li { margin-bottom: 0.5em; }
        a { color: #8b5cf6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: #ffffff !important;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3); }
        .divider { border: none; border-top: 1px solid #27272a; margin: 32px 0; }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #fff; text-transform: uppercase; }
        .logo span { color: #8b5cf6; }
        @media only screen and (max-width: 600px) {
          .content { margin: 10px; padding: 20px; }
          .header { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Ultramaxo<span>AI</span></div>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p style="margin-bottom: 10px;">&copy; ${new Date().getFullYear()} Ultramaxo AI. All rights reserved.</p>
          <p>
            Email otomatis, mohon tidak membalas email ini.<br>
            <a href="https://ultramaxo.tech/privacy" style="color: #52525b;">Privacy Policy</a> &bull; <a href="https://ultramaxo.tech/terms" style="color: #52525b;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
