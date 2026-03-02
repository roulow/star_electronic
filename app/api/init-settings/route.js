import { writeSettings } from '@/lib/storage';

export async function GET() {
  try {
    // Default templates
    const userTemplate = {
      counters: { u_column: 1, u_row: 1, u_content_text: 1 },
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: 'text',
                    values: {
                      text: '<p style="font-size: 16px; line-height: 140%;"><strong>Thank you for contacting Star Electronic!</strong><br><br>Hi {{name}},<br>We have received your message regarding "{{subject}}".<br>Our team will get back to you shortly.<br><br>Best regards,<br>Star Electronic Team</p>',
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: '#ffffff',
          contentWidth: '500px',
        },
      },
    };

    const ownerTemplate = {
      counters: { u_column: 1, u_row: 1, u_content_text: 1 },
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: 'text',
                    values: {
                      text: '<p style="font-size: 16px; line-height: 140%;"><strong>New Inquiry Received</strong><br><br><strong>From:</strong> {{name}}<br><strong>Email:</strong> {{email}}<br><strong>Phone:</strong> {{phone}}<br><strong>Company:</strong> {{company}}<br><strong>Subject:</strong> {{subject}}<br><br><strong>Message:</strong><br>{{message}}</p>',
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: '#ffffff',
          contentWidth: '500px',
        },
      },
    };

    const settings = {
      emails: {
        ownerEnabled: true,
        userEnabled: true,
        userSubject: 'Thank you for contacting Star Electronic',
        ownerSubject: 'New Inquiry: {{subject}}',
        userTemplateJson: userTemplate,
        ownerTemplateJson: ownerTemplate,
        userTemplateHtml: '', // Will be generated on save
        ownerTemplateHtml: '', // Will be generated on save
      },
      theme: {
        light: {},
        dark: {},
      },
    };

    await writeSettings(settings);
    return Response.json({ success: true, message: 'Settings initialized' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
