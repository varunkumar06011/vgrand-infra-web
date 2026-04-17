import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage, sendWhatsAppButtons } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'vgrand_bot_verify_2024';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook Verified Successfully');
    return new Response(challenge, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }

  return new Response('Not Found', { status: 404 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();

    // DIAGNOSTIC LOG: See exactly what Meta is sending
    console.log('[Webhook] Raw Payload:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message) {
        const phone = message.from;
        let text = '';
        
        if (message.type === 'text') {
          text = message.text?.body?.trim() || '';
        } else if (message.type === 'interactive') {
          text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
        }

        const lowerText = text.toLowerCase();
        console.log(`[Webhook] Message from ${phone}: "${text}"`);

        // 0. DIAGNOSTIC ECHO: Send "Check" to see if sending works at all
        if (lowerText === 'check') {
          console.log('[Webhook] Diagnostic check triggered');
          const result = await sendWhatsAppMessage(phone, "🚀 *Bot response test successful!*\n\nI am connected to Meta and can send messages. If the regular 'Hi' flow isn't working, the issue is likely with the Supabase database connection.");
          console.log('[Webhook] Send result:', JSON.stringify(result, null, 2));
          return NextResponse.json({ success: true, diagnostic: 'echo_sent' });
        }

        // 1. Get current session
        const { data: session, error: sessError } = await supabase
          .from('whatsapp_sessions')
          .select('*')
          .eq('phone_number', phone)
          .single();

        if (sessError && sessError.code !== 'PGRST116') {
          console.error('[Webhook] Supabase Session Error:', sessError);
        }

        // Allow restart
        if (['hi', 'hello', 'hey', 'start', 'restart'].includes(lowerText)) {
          await startFlow(phone, supabase);
          return NextResponse.json({ success: true });
        }

        // 2. State Machine Logic
        switch (currentStep) {
          case 'START':
            await startFlow(phone, supabase);
            break;

          case 'LOCATION':
            await supabase.from('whatsapp_sessions').update({ location: text, step: 'BUDGET' }).eq('phone_number', phone);
            await sendWhatsAppButtons(phone, "💰 *What is your budget?*", [
              { id: 'b1', title: 'Under ₹40 Lakhs' },
              { id: 'b2', title: '₹40L – ₹80L' },
              { id: 'b3', title: '₹80 Lakhs+' }
            ]);
            break;

          case 'BUDGET':
            await supabase.from('whatsapp_sessions').update({ budget: text, step: 'TYPE' }).eq('phone_number', phone);
            await sendWhatsAppButtons(phone, "🏘️ *What type of property are you looking for?*", [
              { id: 't1', title: '2 BHK' },
              { id: 't2', title: '3 BHK' },
              { id: 't3', title: 'Villa / Plot' }
            ]);
            break;

          case 'TYPE':
            await supabase.from('whatsapp_sessions').update({ property_type: text, step: 'NAME' }).eq('phone_number', phone);
            await sendWhatsAppMessage(phone, "👤 *Almost done!*\n\nPlease tell us your *name* so our team can assist you better.");
            break;

          case 'NAME':
            // Finalize Lead
            const leadData = {
              name: text,
              phone: phone,
              whatsapp: phone,
              location: session.location,
              budget: session.budget,
              property_type: session.property_type,
              source: 'WhatsApp',
              status: 'new'
            };

            const { data: newLead } = await supabase.from('leads').insert([leadData]).select().single();
            
            // Notify Agent if configured
            const agentPhone = process.env.AGENT_WHATSAPP_NUMBER;
            if (agentPhone) {
              const agentMsg = `🔔 *New WhatsApp Lead!*\n\n👤 Name: ${text}\n📞 Phone: ${phone}\n📍 Location: ${session.location}\n💰 Budget: ${session.budget}\n🏠 Type: ${session.property_type}\n\n📊 View: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads`;
              await sendWhatsAppMessage(agentPhone, agentMsg);
            }

            await sendWhatsAppMessage(phone, `✅ *Thank you, ${text.split(' ')[0]}!*\n\nOur team will contact you within 2 hours with the best projects in ${session.location}.`);
            
            // Clear session
            await supabase.from('whatsapp_sessions').delete().eq('phone_number', phone);
            break;

          default:
            await startFlow(phone, supabase);
            break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

async function startFlow(phone: string, supabase: any) {
  await supabase.from('whatsapp_sessions').upsert({ phone_number: phone, step: 'LOCATION' });
  await sendWhatsAppButtons(phone, "🏡 *Welcome to V Grand Infra!*\n\nWhich location are you interested in?", [
    { id: 'l1', title: 'Ongole' },
    { id: 'l2', title: 'Koppolu' },
    { id: 'l3', title: 'Other' }
  ]);
}
