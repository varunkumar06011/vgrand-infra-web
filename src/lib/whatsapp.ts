/**
 * WhatsApp Utility for Meta Graph API
 */

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = 'v19.0';

export async function sendWhatsAppMessage(to: string, message: string) {
  return callWhatsAppAPI({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      body: message,
    },
  });
}

export async function sendWhatsAppButtons(to: string, bodyText: string, buttons: { id: string, title: string }[]) {
  return callWhatsAppAPI({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

async function callWhatsAppAPI(payload: any) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp configuration missing in environment variables');
    return { success: false, error: 'Configuration missing' };
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API error:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('WhatsApp network error:', error);
    return { success: false, error };
  }
}
