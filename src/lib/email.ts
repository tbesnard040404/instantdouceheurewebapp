import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendClientEmailParams {
  to: string
  nom: string
  typeForfait: string
  seancesTotales: number
  qrCodeBase64: string
  expiresAt?: string | null
  montantCadeau?: number | null
}

const FORFAIT_LABELS: Record<string, string> = {
  essentiel: 'Forfait Essentiel (5 séances)',
  regulier: 'Forfait Régulier (10 séances)',
  intensif: 'Forfait Intensif (15 séances)',
  grossesse: 'Forfait Grossesse (5 séances)',
  perinatalite: 'Forfait Périnatalité (8 séances)',
  cadeau: 'Carte Cadeau',
}

export async function sendClientEmail(params: SendClientEmailParams) {
  const { to, nom, typeForfait, seancesTotales, qrCodeBase64, expiresAt, montantCadeau } = params
  const label = FORFAIT_LABELS[typeForfait] ?? typeForfait
  const isGift = typeForfait === 'cadeau'

  const expiryLine = expiresAt
    ? `<p style="color:#B8966A;font-size:14px;">⏳ Valable jusqu'au <strong>${new Date(expiresAt).toLocaleDateString('fr-FR')}</strong></p>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#3D6255;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,.7);font-size:12px;letter-spacing:.12em;text-transform:uppercase;">Instant Douce'Heure</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:400;font-family:Georgia,serif;">
            ${isGift ? '🎁 Votre carte cadeau' : 'Votre forfait bien-être'}
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#1A2820;font-size:16px;margin:0 0 24px;">Bonjour <strong>${nom}</strong>,</p>

          ${isGift ? `
          <div style="background:#F5EFE4;border:1px solid #B8966A;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 4px;color:#B8966A;font-size:12px;letter-spacing:.1em;text-transform:uppercase;">Carte cadeau</p>
            <p style="margin:0;color:#3D6255;font-size:36px;font-weight:700;">${montantCadeau} €</p>
            ${expiryLine}
          </div>
          ` : `
          <div style="background:#EBF2EF;border-radius:8px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#5A6E68;font-size:12px;letter-spacing:.1em;text-transform:uppercase;">Votre forfait</p>
            <p style="margin:0;color:#3D6255;font-size:20px;font-weight:700;">${label}</p>
            <p style="margin:8px 0 0;color:#1A2820;font-size:15px;">${seancesTotales} séances incluses</p>
          </div>
          `}

          <p style="color:#1A2820;font-size:15px;margin:0 0 8px;">Présentez ce QR code à chaque séance :</p>
          <div style="text-align:center;margin:20px 0;">
            <img src="${qrCodeBase64}" alt="QR code forfait" width="200" height="200" style="border-radius:8px;border:4px solid #3D6255;">
          </div>
          <p style="color:#5A6E68;font-size:13px;text-align:center;margin:0 0 32px;">Conservez cet email précieusement — il est votre sésame.</p>

          <hr style="border:none;border-top:1px solid #E6E2D9;margin:0 0 24px;">
          <p style="color:#8AA098;font-size:13px;margin:0;">Des questions ? Contactez Océane à <a href="mailto:contact@instantdouceheure.com" style="color:#3D6255;">contact@instantdouceheure.com</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F0EDE6;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#8AA098;font-size:12px;">Instant Douce'Heure · instantdouceheure.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: 'Instant Douce\'Heure <noreply@instantdouceheure.com>',
    to,
    subject: isGift ? `🎁 Votre carte cadeau Instant Douce'Heure` : `Votre forfait bien-être — Instant Douce'Heure`,
    html,
  })
}
