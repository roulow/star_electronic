import { readSettings, writeSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = await readSettings();
    // Return the theme object, or empty defaults if not set
    return Response.json({
      variables: settings.theme || { light: {}, dark: {} },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const settings = await readSettings();

    // Update theme in settings
    // body.variables should be { light: {...}, dark: {...} }
    // We merge with existing to preserve keys not sent (though usually full object is sent)
    const currentTheme = settings.theme || { light: {}, dark: {} };

    settings.theme = {
      light: { ...currentTheme.light, ...(body.light || {}) },
      dark: { ...currentTheme.dark, ...(body.dark || {}) },
    };

    await writeSettings(settings);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
