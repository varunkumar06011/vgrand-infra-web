// ============================================================
// V Grand Group — WhatsApp Bot Webhook
// Meta Cloud API · Next.js App Router
// ============================================================
// Flow:
//  1. User clicks WhatsApp button → opens chat with greeting
//  2. Bot asks: Location → Budget → Property Type → Name+Phone
//  3. Lead saved to Supabase
//  4. Agent gets instant WhatsApp alert
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WHATSAPP_TOKEN   = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN     = process.env.WHATSAPP_VERIFY_TOKEN; // you set this yourself
const AGENT_PHONE      = process.env.AGENT_WHATSAPP_NUMBER; // e.g. "919876543210"
const API_URL          = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

// ─── In-memory session store ──────────────────────────────
// For production scale, replace with Supabase/Redis
const sessions = new Map();

// ─── Bot conversation steps ───────────────────────────────
const STEPS = {
  START:    'start',
  LOCATION: 'location',
  BUDGET:   'budget',
  TYPE:     'type',
  CONTACT:  'contact',
  DONE:     'done',
};

// ─── GET: Webhook verification by Meta ───────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ─── POST: Incoming messages ──────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    // Ignore status updates (delivered, read receipts)
    if (!value?.messages) {
      return new Response('OK', { status: 200 });
    }

    const message  = value.messages[0];
    const from     = message.from; // user's phone number
    const msgType  = message.type;

    let userText = '';
    if (msgType === 'text') {
      userText = message.text.body.trim();
    } else if (msgType === 'interactive') {
      // Button or list reply
      userText =
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        '';
    }

    await handleConversation(from, userText);

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Error', { status: 500 });
  }
}

// ─── Conversation state machine ───────────────────────────
async function handleConversation(phone, userText) {
  let session = sessions.get(phone) || { step: STEPS.START, data: {} };

  // Allow restart anytime
  const lower = userText.toLowerCase();
  if (['hi', 'hello', 'hey', 'start', 'restart', 'namaste'].includes(lower)) {
    session = { step: STEPS.START, data: {} };
  }

  switch (session.step) {
    case STEPS.START:
      await sendWelcome(phone);
      session.step = STEPS.LOCATION;
      break;

    case STEPS.LOCATION:
      if (!userText) { await sendWelcome(phone); break; }
      session.data.location = userText;
      await sendBudgetQuestion(phone);
      session.step = STEPS.BUDGET;
      break;

    case STEPS.BUDGET:
      if (!userText) { await sendBudgetQuestion(phone); break; }
      session.data.budget = labelBudget(userText);
      await sendTypeQuestion(phone);
      session.step = STEPS.TYPE;
      break;

    case STEPS.TYPE:
      if (!userText) { await sendTypeQuestion(phone); break; }
      session.data.propertyType = labelType(userText);
      await sendContactQuestion(phone);
      session.step = STEPS.CONTACT;
      break;

    case STEPS.CONTACT:
      if (!userText) { await sendContactQuestion(phone); break; }
      // Expect "Name, Phone" or just free text
      const parsed = parseContact(userText, phone);
      session.data.name  = parsed.name;
      session.data.phone = parsed.phone;
      session.step = STEPS.DONE;

      // Save lead & notify agent
      const leadId = await saveLead(phone, session.data);
      await sendConfirmation(phone, session.data.name);
      await notifyAgent(session.data, leadId);
      break;

    case STEPS.DONE:
      await sendAlreadyDone(phone);
      break;

    default:
      session = { step: STEPS.START, data: {} };
      await sendWelcome(phone);
      session.step = STEPS.LOCATION;
  }

  sessions.set(phone, session);
}

// ─── Message senders ──────────────────────────────────────

async function sendWelcome(phone) {
  await sendInteractiveButtons(phone, {
    body: `🏡 *Welcome to V Grand Infra!*\n\nWe have 40+ premium residential projects across Andhra Pradesh.\n\nWhich location are you interested in?`,
    buttons: [
      { id: 'loc_ongole',  title: 'Ongole' },
      { id: 'loc_koppolu', title: 'Koppolu' },
      { id: 'loc_other',   title: 'Other Location' },
    ],
  });
}

async function sendBudgetQuestion(phone) {
  await sendInteractiveButtons(phone, {
    body: `💰 *What is your budget?*`,
    buttons: [
      { id: 'budget_low',  title: 'Under ₹40 Lakhs' },
      { id: 'budget_mid',  title: '₹40L – ₹80L' },
      { id: 'budget_high', title: '₹80 Lakhs+' },
    ],
  });
}

async function sendTypeQuestion(phone) {
  await sendInteractiveButtons(phone, {
    body: `🏘️ *What type of property?*`,
    buttons: [
      { id: 'type_2bhk',    title: '2 BHK' },
      { id: 'type_3bhk',    title: '3 BHK' },
      { id: 'type_villa',   title: 'Villa / Plot' },
    ],
  });
}

async function sendContactQuestion(phone) {
  await sendTextMessage(
    phone,
    `👤 *Almost done!*\n\nPlease reply with your *name and phone number*.\n\nExample:\n_Ravi Kumar, 9876543210_`
  );
}

async function sendConfirmation(phone, name) {
  const firstName = name?.split(' ')[0] || 'there';
  await sendTextMessage(
    phone,
    `✅ *Thank you, ${firstName}!*\n\nOur team will call you within *2 hours* with the best projects matching your needs.\n\n📞 You can also reach us directly:\n*+91-XXXXX-XXXXX*\n\n🌐 vgrandgroup.com`
  );
}

async function sendAlreadyDone(phone) {
  await sendTextMessage(
    phone,
    `👋 We already have your details and our team will contact you shortly!\n\nTo start over, type *Hi*.`
  );
}

// ─── Lead persistence ─────────────────────────────────────

async function saveLead(whatsappPhone, data) {
  const { data: lead, error } = await supabase
    .from('leads')
    .insert([{
      name:         data.name     || 'Unknown',
      phone:        data.phone    || whatsappPhone,
      whatsapp:     whatsappPhone,
      location:     data.location || '',
      budget:       data.budget   || '',
      property_type: data.propertyType || '',
      source:       'whatsapp',
      status:       'new',
      created_at:   new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase lead save error:', error);
    return null;
  }
  console.log('✅ Lead saved:', lead.id);
  return lead.id;
}

// ─── Agent notification ───────────────────────────────────

async function notifyAgent(data, leadId) {
  if (!AGENT_PHONE) return;

  const msg =
    `🔔 *New WhatsApp Lead!*\n\n` +
    `👤 Name: ${data.name || 'N/A'}\n` +
    `📞 Phone: ${data.phone || 'N/A'}\n` +
    `📍 Location: ${data.location || 'N/A'}\n` +
    `💰 Budget: ${data.budget || 'N/A'}\n` +
    `🏠 Type: ${data.propertyType || 'N/A'}\n` +
    `🆔 Lead ID: ${leadId || 'N/A'}\n\n` +
    `📊 View in admin: https://vgrandgroup.com/admin/leads`;

  await sendTextMessage(AGENT_PHONE, msg);
}

// ─── Meta Cloud API helpers ───────────────────────────────

async function sendTextMessage(to, text) {
  return callAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text, preview_url: false },
  });
}

async function sendInteractiveButtons(to, { body, buttons }) {
  return callAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

async function callAPI(payload) {
  const res = await fetch(API_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Meta API error:', err);
  }
  return res;
}

// ─── Helpers ──────────────────────────────────────────────

function labelBudget(id) {
  const map = {
    budget_low:  'Under ₹40 Lakhs',
    budget_mid:  '₹40L – ₹80L',
    budget_high: '₹80 Lakhs+',
  };
  return map[id] || id;
}

function labelType(id) {
  const map = {
    type_2bhk:  '2 BHK',
    type_3bhk:  '3 BHK',
    type_villa: 'Villa / Plot',
  };
  return map[id] || id;
}

function parseContact(text, fallbackPhone) {
  // Accept "Name, Phone" or "Name Phone" or just a name
  const parts = text.split(/[,\s]+/);
  const phonePattern = /^[6-9]\d{9}$/;

  let name  = '';
  let phone = fallbackPhone;

  for (const part of parts) {
    if (phonePattern.test(part)) {
      phone = `91${part}`;
    } else if (part.length > 1) {
      name += (name ? ' ' : '') + part;
    }
  }

  return { name: name || 'Unknown', phone };
}
