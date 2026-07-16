import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'
import { generateQRCodeBase64 } from '@/lib/qrcode'
import { sendClientEmail } from '@/lib/email'
import { sanitizeText } from '@/lib/sanitize'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const FORFAIT_SEANCES: Record<string, number> = {
  essentiel: 5,
  regulier: 10,
  intensif: 15,
  grossesse: 5,
  perinatalite: 8,
  cadeau: 1,
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const paymentId = session.id

  // Idempotence
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('stripe_payment_id', paymentId)
    .maybeSingle()

  if (existing) return NextResponse.json({ received: true })

  const meta = session.metadata ?? {}
  const typeForfait = sanitizeText(meta.type_forfait ?? 'essentiel')
  const nom = sanitizeText(session.customer_details?.name ?? 'Client')
  const email = sanitizeText(session.customer_details?.email ?? '')
  const montantCadeau = typeForfait === 'cadeau' ? Math.round((session.amount_total ?? 0) / 100) : null
  const seancesTotales = FORFAIT_SEANCES[typeForfait] ?? 5

  const expiresAt = typeForfait === 'cadeau'
    ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const qrToken = randomUUID()

  const { error } = await supabase.from('clients').insert({
    nom,
    email,
    type_forfait: typeForfait,
    seances_totales: seancesTotales,
    seances_restantes: seancesTotales,
    qr_token: qrToken,
    stripe_payment_id: paymentId,
    expires_at: expiresAt,
    actif: true,
  })

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const qrBase64 = await generateQRCodeBase64(qrToken)

  await sendClientEmail({
    to: email,
    nom,
    typeForfait,
    seancesTotales,
    qrCodeBase64: qrBase64,
    expiresAt,
    montantCadeau,
  })

  return NextResponse.json({ received: true })
}
