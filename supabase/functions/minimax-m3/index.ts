import { serve } from "https://deno.land/std/http/server.ts";

const ALLOWED_FIELDS = [
  "model",
  "messages",
  "thinking",
  "reasoning_split",
  "max_completion_tokens",
  "temperature",
  "top_p",
  "tools",
  "tool_choice",
  "response_format",
] as const;

serve(async (req: Request): Promise<Response> => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      throw new Error("Missing or empty messages");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Support stream
  const isStream = body.stream === true;
  const payload = {
    ...body,
    model: body.model ?? "MiniMax-M3",
    stream: isStream,
  };
  
  if (isStream) {
      payload.stream_options = { include_usage: true, ...(body.stream_options as object | undefined) }
  }


  const upstream = await fetch(
    "https://app-cbtwcxqs3xfl-api-rLobPAn0n7m9-gateway.appmiaoda.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    return new Response(errorText || JSON.stringify({ error: "Upstream error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (isStream) {
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } else {
     const text = await upstream.text();
     return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
  }
});
