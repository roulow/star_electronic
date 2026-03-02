import { readSettings, writeSettings } from '@/lib/storage';

export async function GET() {
  const settings = await readSettings();
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const body = await req.json();
  await writeSettings(body);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
