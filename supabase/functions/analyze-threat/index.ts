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
    const { text } = await req.json();

    if (!text) {
      throw new Error("Missing 'text' payload");
    }

    const systemMessage = {
      role: "system",
      content: "You are an expert fraud detection AI for OmniGuard. Analyze the provided payload (which could be OCR text from a receipt, a raw SMS message, or a decoded QR payment URI). Determine if it is a scam, phishing attempt, forgery, or safe. You MUST return a strict JSON object with exactly two string fields: 'threat_level' (must be exactly 'SAFE' or 'DANGER') and 'reason' (a short 1-sentence explanation of why it is dangerous or safe. If safe, provide a reassuring sentence). Do not return any other text, markdown formatting, or code blocks outside of the valid JSON object."
    };

    const userMessage = {
      role: "user",
      content: text
    };

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
        model: 'llama-3.1-8b-instant',
        messages: [systemMessage, userMessage],
        temperature: 0.1, // Low temperature for deterministic analysis
        max_tokens: 256,
        response_format: { type: "json_object" } // Force JSON mode
      }),
    });

    const data = await response.json();
    
    // Parse the JSON string returned by LLaMA inside the content
    let parsedContent;
    try {
        parsedContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
        // Fallback if the AI returns malformed JSON despite the response_format directive
        parsedContent = { 
            threat_level: "SAFE", 
            reason: "AI Analysis unavailable or malformed. Proceed with caution." 
        };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
