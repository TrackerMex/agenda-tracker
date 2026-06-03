import nodemailer from 'nodemailer';

const EMAIL_ENABLED = process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@capacitaciones.local';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Plataforma Capacitaciones';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

let transporter = null;

function getTransporter() {
  if (transporter !== null) return transporter;

  if (!SMTP_HOST) {
    transporter = false;
    return false;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  return transporter;
}

function isEnabled() {
  if (!EMAIL_ENABLED) {
    return { enabled: false, reason: 'feature flag ENABLE_EMAIL_NOTIFICATIONS=false' };
  }
  const t = getTransporter();
  if (!t) {
    return { enabled: false, reason: 'SMTP_HOST no configurado (auto-degrade activo)' };
  }
  return { enabled: true };
}

function buildInscripcionEmail({ usuario, capacitacion }) {
  const fecha = new Date(capacitacion.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const hora = String(capacitacion.hora_inicio).slice(0, 5);
  const link = `${FRONTEND_URL}/capacitaciones/${capacitacion.id}`;

  const subject = `Confirmacion de inscripcion: ${capacitacion.nombre}`;
  const text = [
    `Hola ${usuario.nombre},`,
    '',
    `Te inscribiste correctamente a la capacitacion "${capacitacion.nombre}".`,
    '',
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    `Duracion: ${capacitacion.duracion_minutos} minutos`,
    `Plataforma: ${capacitacion.plataforma}`,
    '',
    `Ver detalle: ${link}`,
    '',
    'Plataforma de Capacitaciones',
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Hola ${usuario.nombre},</h2>
      <p>Te inscribiste correctamente a la capacitacion <strong>${capacitacion.nombre}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Fecha</td><td style="padding: 6px 0;"><strong>${fecha}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Hora</td><td style="padding: 6px 0;"><strong>${hora}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Duracion</td><td style="padding: 6px 0;">${capacitacion.duracion_minutos} minutos</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Plataforma</td><td style="padding: 6px 0;">${capacitacion.plataforma}</td></tr>
      </table>
      <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Ver detalle</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Plataforma de Capacitaciones</p>
    </div>
  `;

  return { subject, text, html };
}

function buildCancelacionEmail({ usuario, capacitacion }) {
  const fecha = new Date(capacitacion.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const link = `${FRONTEND_URL}/capacitaciones`;

  const subject = `Capacitacion cancelada: ${capacitacion.nombre}`;
  const text = [
    `Hola ${usuario.nombre},`,
    '',
    `La capacitacion "${capacitacion.nombre}" programada para ${fecha} fue cancelada.`,
    '',
    `Ver otras capacitaciones: ${link}`,
    '',
    'Plataforma de Capacitaciones',
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Hola ${usuario.nombre},</h2>
      <p>Te informamos que la capacitacion <strong>${capacitacion.nombre}</strong> fue cancelada.</p>
      <p>Fecha original: <strong>${fecha}</strong></p>
      <p><a href="${link}" style="background:#6b7280;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Ver otras capacitaciones</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Plataforma de Capacitaciones</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  return t.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendInscripcionNotification({ usuario, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(
      `[email.service] SKIP sendInscripcionNotification to=${usuario.email} reason="${status.reason}"`,
    );
    return { sent: false, reason: status.reason };
  }

  const { subject, text, html } = buildInscripcionEmail({ usuario, capacitacion });
  try {
    const info = await sendMail({ to: usuario.email, subject, text, html });
    console.log(`[email.service] Sent inscripcion email to=${usuario.email} messageId=${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email.service] Error sending inscripcion email to=${usuario.email}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export async function sendCancelacionNotification({ usuario, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(
      `[email.service] SKIP sendCancelacionNotification to=${usuario.email} reason="${status.reason}"`,
    );
    return { sent: false, reason: status.reason };
  }

  const { subject, text, html } = buildCancelacionEmail({ usuario, capacitacion });
  try {
    const info = await sendMail({ to: usuario.email, subject, text, html });
    console.log(`[email.service] Sent cancelacion email to=${usuario.email} messageId=${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email.service] Error sending cancelacion email to=${usuario.email}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export function getEmailStatus() {
  return isEnabled();
}
