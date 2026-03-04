import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.gmail.user,
    pass: config.gmail.appPassword,
  },
});

const baseHtml = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f5ede6; margin: 0; padding: 20px; }
    .card { background: #fff; max-width: 480px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: #6B3A2A; padding: 28px 32px; text-align: center; }
    .header h1 { color: #FAF5EE; margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { color: #d6b896; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .body p { color: #5a3a1a; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: block; background: #6B3A2A; color: #fff !important; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: bold; margin: 24px 0; }
    .footer { text-align: center; padding: 16px 32px 24px; color: #a0856b; font-size: 12px; }
    .code { background: #f5ede6; border-radius: 8px; padding: 12px 20px; font-size: 13px; color: #6B3A2A; word-break: break-all; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>☕ M&M Café</h1>
      <p>Sistema POS</p>
    </div>
    <div class="body">
      <p style="font-size:18px;font-weight:bold;color:#3d1f0f;margin-bottom:8px;">${title}</p>
      ${body}
    </div>
    <div class="footer">
      Si no solicitaste esto, ignorá este correo.<br/>
      &copy; ${new Date().getFullYear()} M&M Café — Sistema POS
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (to: string, name: string, token: string) => {
  const url = `${config.appUrl}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"M&M Café" <${config.gmail.user}>`,
    to,
    subject: '✅ Verificá tu correo — M&M Café',
    html: baseHtml(
      `Hola ${name}, verificá tu correo`,
      `
      <p>Tu cuenta en el sistema POS de M&M Café está casi lista. Solo necesitás verificar tu correo electrónico haciendo clic en el botón de abajo.</p>
      <p>Este enlace es válido por <strong>24 horas</strong>.</p>
      <a href="${url}" class="btn">✅ Verificar mi correo</a>
      <p style="font-size:13px;color:#a0856b;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
      <div class="code">${url}</div>
      `
    ),
  });
};

export const sendResetPasswordEmail = async (to: string, name: string, token: string) => {
  const url = `${config.appUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"M&M Café" <${config.gmail.user}>`,
    to,
    subject: '🔑 Recuperar contraseña — M&M Café',
    html: baseHtml(
      `Hola ${name}, recuperá tu contraseña`,
      `
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en M&M Café POS.</p>
      <p>Hacé clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.</p>
      <a href="${url}" class="btn">🔑 Restablecer contraseña</a>
      <p style="font-size:13px;color:#a0856b;">Si no solicitaste esto, podés ignorar este correo. Tu contraseña actual no cambiará.</p>
      <div class="code">${url}</div>
      `
    ),
  });
};
