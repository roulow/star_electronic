import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Load env
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function writeJson(filename, content) {
  const buffer = Buffer.from(JSON.stringify(content, null, 2));
  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: `data/${filename}`,
        resource_type: 'raw',
        invalidate: true,
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  const messagesDir = path.join(process.cwd(), 'messages');
  const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(messagesDir, file), 'utf8')
    );
    console.log(`Uploading ${file}...`);
    await writeJson(`messages/${file}`, content);
  }
  console.log('Done');
}

main().catch(console.error);
