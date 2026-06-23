const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders
  });
}

export default async function iaCafeBackend(req) {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const appsScriptUrl = Netlify.env.get("APPS_SCRIPT_URL");
  const backendToken = Netlify.env.get("IA_CAFE_BACKEND_TOKEN");

  if (!appsScriptUrl || !backendToken) {
    return jsonResponse({
      ok: false,
      error: "Configuration Netlify manquante."
    }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    return jsonResponse({ ok: false, error: "Payload JSON invalide." }, 400);
  }

  try {
    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        backend_token: backendToken
      })
    });

    const text = await upstreamResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return jsonResponse({
        ok: false,
        error: "Reponse Apps Script non JSON."
      }, 502);
    }

    return jsonResponse(data, upstreamResponse.status);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: "Erreur de communication avec Apps Script."
    }, 502);
  }
}
