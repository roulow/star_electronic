import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    if (!locale) {
        return Response.json({ error: 'Locale is required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const messages = JSON.parse(fileContent);
        return Response.json({ messages });
    } catch (error) {
        return Response.json({ error: 'File not found or invalid' }, { status: 404 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { locale, content } = body;

    if (!locale || !content) {
        return Response.json({ error: 'Locale and content are required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);

    try {
        // Ensure formatting is pretty for git diffs
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: 'Failed to write file' }, { status: 500 });
    }
}
