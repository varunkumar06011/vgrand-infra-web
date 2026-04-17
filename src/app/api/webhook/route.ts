import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'vgrand_bot_verify_2024';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook Verified Successfully');
      return new Response(challenge, { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return new Response('Not Found', { status: 404 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();

    // Check if it's a message event
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message) {
        const phone = message.from;
        const text = message.text?.body?.trim() || '';
        console.log(`[Webhook] Message from ${phone}: "${text}"`);

        // Check for config
        if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
          console.error('[Webhook] CRITICAL: WhatsApp environment variables are missing in Vercel!');
        }

        // 1. Get current session
        const { data: session, error: sessionError } = await supabase
          .from('whatsapp_sessions')
          .select('*')
          .eq('phone_number', phone)
          .single();

        let currentStep = session?.step || 'START';

        // 2. State Machine Logic
        switch (currentStep) {
          case 'START':
            // Restart if user says "Hi" even if they were in middle? 
            // Better to just start from name request.
            await supabase
              .from('whatsapp_sessions')
              .upsert({ phone_number: phone, step: 'NAME' });
            
            await sendWhatsAppMessage(phone, "Hi! Welcome to V Grand Infra. Can I know your name?");
            break;

          case 'NAME':
            await supabase
              .from('whatsapp_sessions')
              .update({ name: text, step: 'BUDGET' })
              .eq('phone_number', phone);
            
            await sendWhatsAppMessage(phone, `Nice to meet you, ${text}! What is your budget?`);
            break;

          case 'BUDGET':
            await supabase
              .from('whatsapp_sessions')
              .update({ budget: text, step: 'LOCATION' })
              .eq('phone_number', phone);
            
            await sendWhatsAppMessage(phone, "Got it. What is your preferred location?");
            break;

          case 'LOCATION':
            // All info collected!
            const { name, budget } = session;
            const location = text;

            // Check for existing lead with same phone to avoid duplicates
            const { data: existingLead } = await supabase
              .from('leads')
              .select('id')
              .eq('phone', phone)
              .single();

            if (!existingLead) {
              // 3. Save as a New Lead
              await supabase.from('leads').insert([{
                name: name,
                phone: phone,
                budget: budget,
                location: location,
                source: 'WhatsApp',
                status: 'New',
                project: 'General Inquiry'
              }]);
            } else {
              console.log(`Lead with phone ${phone} already exists. Skipping insertion.`);
            }

            // 4. Update session to COMPLETE (or delete it to allow restart)
            await supabase
              .from('whatsapp_sessions')
              .delete()
              .eq('phone_number', phone);

            await sendWhatsAppMessage(phone, "Thank you! Our client will reach out in 1 hour.");
            break;

          default:
            // Fallback: reset if something went wrong
            await supabase
              .from('whatsapp_sessions')
              .upsert({ phone_number: phone, step: 'START' });
            break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Catch-all error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
