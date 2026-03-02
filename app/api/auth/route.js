/** @format */
import { cookies } from 'next/headers';

export async function POST(req) {
  const { key } = await req.json();
  const expected = process.env.DASHBOARD_KEY || 'changeme';
  if (!key || key !== expected) {
    return new Response(JSON.stringify({ error: 'Invalid key' }), {
      status: 401,
    });
  }
  (await cookies()).set('dashboard', 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return Response.json({ ok: true });
}
