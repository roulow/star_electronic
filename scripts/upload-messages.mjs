// Uploads the local messages/*.json files to Cloudinary (overwrites the
// texts edited in the dashboard). Usage: node scripts/upload-messages.mjs
import fs from 'fs';
import path from 'path';
import nextEnv from '@next/env';
import { getCloudinaryConfig, writeRawJson } from '../lib/cloudinary.mjs';

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const cfg = getCloudinaryConfig(process.env);
  if (!cfg) throw new Error('Cloudinary credentials are missing');

  const messagesDir = path.join(process.cwd(), 'messages');
  const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(messagesDir, file), 'utf8')
    );
    console.info(`Uploading ${file}...`);
    await writeRawJson(cfg, `data/messages/${file}`, content);
  }
  console.info('Done');
}

main().catch(console.error);
