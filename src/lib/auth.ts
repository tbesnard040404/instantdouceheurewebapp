import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + process.env.ADMIN_TOKEN_SECRET!)
    .digest('hex')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  return token === hashPassword(process.env.ADMIN_PASSWORD!)
}
