import QRCode from 'qrcode'

export async function generateQRCodeBase64(token: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/client?token=${token}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1A2820', light: '#FFFFFF' },
  })
}
