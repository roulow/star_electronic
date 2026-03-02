/** @format */
import { cookies } from 'next/headers';

export async function requireKey(req) {
  const c = (await cookies()).get('dashboard');
  if (!c || c.value !== 'ok') {
    throw new Error('Unauthorized');
  }
}
