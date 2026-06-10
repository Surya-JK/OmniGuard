import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // The system prompt that gives LLaMA its OmniGuard persona
    const systemMessage = {
      role: "system",
      content: "You are the official AI Security Assistant for the OmniGuard threat detection app. Your job is to help users understand scams, analyze suspicious links/texts, and provide cybersecurity advice. Always be concise, polite, and strictly refuse to answer questions not related to cybersecurity or the app's functions. If someone pastes a link or scam message, point out the red flags."
    };

    const payloadMessages = [systemMessage, ...messages];

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    
    if (!groqApiKey) {
      throw new Error("Missing GROQ_API_KEY environment variable");
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Upgraded to newer 3.1 model
        messages: payloadMessages,
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
