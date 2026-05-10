/**
 * 📧 EMAIL TEMPLATES
 *
 * Templates HTML inline para emails transaccionales.
 * Diseño black + gold acorde a brand Operator AI.
 */

import 'server-only';

const BRAND_COLORS = {
  bg: '#0A0A0A',
  surface: '#141414',
  border: '#2A2A2A',
  text: '#F5F5F5',
  textMuted: '#A0A0A0',
  textSubtle: '#707070',
  gold: '#C9A863',
  goldLight: '#E0C285',
};

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: ${BRAND_COLORS.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${BRAND_COLORS.text}; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
  .header { text-align: center; margin-bottom: 40px; }
  .logo { font-size: 18px; font-weight: 600; letter-spacing: 0.04em; color: ${BRAND_COLORS.text}; }
  .logo-gold { color: ${BRAND_COLORS.gold}; }
  .card { background: ${BRAND_COLORS.surface}; border: 1px solid ${BRAND_COLORS.border}; border-radius: 12px; padding: 32px; margin-bottom: 20px; }
  h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: ${BRAND_COLORS.text}; line-height: 1.3; }
  h2 { font-size: 16px; font-weight: 600; margin: 24px 0 12px 0; color: ${BRAND_COLORS.gold}; text-transform: uppercase; letter-spacing: 0.12em; }
  p { font-size: 15px; line-height: 1.6; color: ${BRAND_COLORS.textMuted}; margin: 0 0 16px 0; }
  .cta { display: inline-block; padding: 12px 24px; background: ${BRAND_COLORS.gold}; color: ${BRAND_COLORS.bg} !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0; }
  .footer { text-align: center; padding: 24px 0 0 0; font-size: 12px; color: ${BRAND_COLORS.textSubtle}; border-top: 1px solid ${BRAND_COLORS.border}; margin-top: 32px; }
  .footer a { color: ${BRAND_COLORS.textMuted}; text-decoration: none; }
  ul { padding-left: 20px; color: ${BRAND_COLORS.textMuted}; line-height: 1.8; }
  li { margin-bottom: 8px; }
  .divider { border-top: 1px solid ${BRAND_COLORS.border}; margin: 24px 0; }
`;

function wrap(content: string, preview?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Operator AI</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;">${preview}</div>` : ''}
  <div class="container">
    <div class="header">
      <div class="logo">Operator <span class="logo-gold">AI</span></div>
    </div>
    ${content}
    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        Operator AI · Built for what's next.
      </p>
      <p style="margin: 0;">
        <a href="https://operatoraiapp.com">operatoraiapp.com</a> ·
        <a href="https://operatoraiapp.com/settings/profile">Settings</a> ·
        <a href="https://operatoraiapp.com/support">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── WELCOME EMAIL ──────────────────────────────────────────────
export interface WelcomeEmailParams {
  userName: string;
  appUrl?: string;
}

export function welcomeEmail(params: WelcomeEmailParams): { subject: string; html: string; text: string } {
  const appUrl = params.appUrl || 'https://operatoraiapp.com';
  const firstName = params.userName.split(' ')[0] || params.userName;

  const subject = `Bienvenido a Operator AI, ${firstName}`;

  const html = wrap(
    `
    <div class="card">
      <h1>Bienvenido, ${firstName}.</h1>
      <p>
        Tu trial de 14 días está activo. Operator AI es tu equipo creativo
        completo: estratega, diseñador, copywriter y ejecutor — todo en uno.
      </p>

      <h2>Por dónde empezar</h2>
      <ul>
        <li><strong>Marca</strong> — Conecta tu sitio web y extraemos tu identidad visual automáticamente.</li>
        <li><strong>Conocimiento</strong> — Sube tus briefs, contratos, brand guidelines.</li>
        <li><strong>Integraciones</strong> — Conecta Gmail, Calendar, Drive, Slack para que el agente pueda actuar por ti.</li>
        <li><strong>Crea</strong> — Pide tu primera campaña, anuncio o video.</li>
      </ul>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${appUrl}/chat" class="cta">Empezar ahora →</a>
      </div>
    </div>

    <div class="card">
      <h2>Necesitas ayuda</h2>
      <p style="margin-bottom: 0;">
        Estamos en <a href="mailto:hi@operatoraiapp.com" style="color: ${BRAND_COLORS.gold};">hi@operatoraiapp.com</a> —
        respondemos en menos de 24h.
      </p>
    </div>
    `,
    `Tu trial de 14 días en Operator AI está activo. Empieza creando tu primera campaña.`,
  );

  const text = `Bienvenido a Operator AI, ${firstName}.

Tu trial de 14 días está activo. Operator AI es tu equipo creativo completo: estratega, diseñador, copywriter y ejecutor.

Empieza aquí: ${appUrl}/chat

Por dónde empezar:
- Marca: conecta tu sitio web y extraemos tu identidad
- Conocimiento: sube briefs, contratos, brand guidelines
- Integraciones: conecta Gmail/Calendar/Drive/Slack
- Crea: pide tu primera campaña

Soporte: hi@operatoraiapp.com

— Operator AI`;

  return { subject, html, text };
}

// ─── TRIAL ENDING EMAIL ─────────────────────────────────────────
export interface TrialEndingEmailParams {
  userName: string;
  daysLeft: number;
  appUrl?: string;
}

export function trialEndingEmail(params: TrialEndingEmailParams): { subject: string; html: string; text: string } {
  const appUrl = params.appUrl || 'https://operatoraiapp.com';
  const firstName = params.userName.split(' ')[0] || params.userName;

  const subject = `${firstName}, tu trial termina en ${params.daysLeft} ${params.daysLeft === 1 ? 'día' : 'días'}`;

  const html = wrap(
    `
    <div class="card">
      <h1>Tu trial termina en ${params.daysLeft} ${params.daysLeft === 1 ? 'día' : 'días'}.</h1>
      <p>
        Has estado usando Operator AI durante el trial. Para seguir creando
        sin interrupciones, activa tu suscripción ahora.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${appUrl}/billing" class="cta">Ver planes →</a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 13px; color: ${BRAND_COLORS.textSubtle};">
        ¿Preguntas o necesitas un plan custom? Escríbenos a
        <a href="mailto:hi@operatoraiapp.com" style="color: ${BRAND_COLORS.gold};">hi@operatoraiapp.com</a>
      </p>
    </div>
    `,
    `Tu trial de Operator AI termina en ${params.daysLeft} días. Activa tu suscripción.`,
  );

  const text = `${firstName}, tu trial de Operator AI termina en ${params.daysLeft} días.

Activa tu suscripción para seguir creando: ${appUrl}/billing

¿Preguntas? hi@operatoraiapp.com

— Operator AI`;

  return { subject, html, text };
}

// ─── PAYMENT SUCCESS EMAIL ──────────────────────────────────────
export interface PaymentSuccessEmailParams {
  userName: string;
  planName: string;
  amount: string;
  invoiceUrl?: string;
}

export function paymentSuccessEmail(params: PaymentSuccessEmailParams): { subject: string; html: string; text: string } {
  const firstName = params.userName.split(' ')[0] || params.userName;

  const subject = `Pago confirmado — Plan ${params.planName}`;

  const html = wrap(
    `
    <div class="card">
      <h1>Pago confirmado.</h1>
      <p>Gracias ${firstName}. Tu suscripción al plan <strong style="color: ${BRAND_COLORS.gold};">${params.planName}</strong> está activa.</p>

      <div class="divider"></div>

      <p style="font-size: 14px;">
        <strong>Plan:</strong> ${params.planName}<br>
        <strong>Importe:</strong> ${params.amount}<br>
        <strong>Próxima factura:</strong> en 30 días
      </p>

      ${params.invoiceUrl ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${params.invoiceUrl}" class="cta">Ver factura →</a>
      </div>
      ` : ''}
    </div>
    `,
    `Pago confirmado. Plan ${params.planName} activo.`,
  );

  const text = `Pago confirmado.

Gracias ${firstName}. Tu suscripción al plan ${params.planName} está activa.
Importe: ${params.amount}
Próxima factura: en 30 días

${params.invoiceUrl ? `Factura: ${params.invoiceUrl}` : ''}

— Operator AI`;

  return { subject, html, text };
}
