/**
 * Service OpenAI cote serveur Apps Script.
 * Premiere version: les appels reels sont desactives par defaut et aucune fonction
 * ne permet de saisir ou stocker une cle API dans le code.
 */

function callOpenAI(messages, options) {
  var startedAt = Date.now();
  var config = options || {};
  var model = config.model || getConfiguredOpenAiModel_();

  if (!areOpenAiCallsEnabled_()) {
    return buildOpenAiServiceResult_({
      status: 'disabled',
      model: model,
      durationMs: Date.now() - startedAt,
      text: '',
      error: 'Appels OpenAI desactives pendant la validation backend.'
    });
  }

  var apiKey = getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_API_KEY);
  if (!apiKey) {
    return buildOpenAiServiceResult_({
      status: 'missing_api_key',
      model: model,
      durationMs: Date.now() - startedAt,
      text: '',
      error: 'Cle OpenAI absente des proprietes Apps Script.'
    });
  }

  if (!model) {
    return buildOpenAiServiceResult_({
      status: 'missing_model',
      model: '',
      durationMs: Date.now() - startedAt,
      text: '',
      error: 'Modele OpenAI non configure dans les proprietes Apps Script.'
    });
  }

  var requestPayload = {
    model: model,
    input: messages,
    store: false,
    temperature: config.temperature || IA_CAFE_CONFIG.DEFAULTS.TEMPERATURE,
    max_output_tokens: config.maxOutputTokens || IA_CAFE_CONFIG.DEFAULTS.MAX_OUTPUT_TOKENS
  };

  try {
    var response = UrlFetchApp.fetch(getConfiguredOpenAiApiUrl_(), {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + apiKey
      },
      payload: JSON.stringify(requestPayload),
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    var body = response.getContentText();
    var parsed = safeJsonParse_(body);

    if (statusCode < 200 || statusCode >= 300) {
      return buildOpenAiServiceResult_({
        status: 'http_error',
        model: model,
        durationMs: Date.now() - startedAt,
        text: '',
        error: 'Erreur HTTP OpenAI: ' + statusCode
      });
    }

    return buildOpenAiServiceResult_({
      status: 'ok',
      model: model,
      durationMs: Date.now() - startedAt,
      text: extractOpenAiText_(parsed),
      inputTokens: extractInputTokens_(parsed),
      outputTokens: extractOutputTokens_(parsed)
    });
  } catch (error) {
    return buildOpenAiServiceResult_({
      status: 'exception',
      model: model,
      durationMs: Date.now() - startedAt,
      text: '',
      error: error && error.message ? error.message : String(error)
    });
  }
}

function callOpenAIVisualProjection(entry) {
  var startedAt = Date.now();
  var model = getConfiguredOpenAiImageModel_();

  if (!areOpenAiCallsEnabled_()) {
    return buildOpenAiImageServiceResult_({
      status: 'disabled',
      model: model,
      durationMs: Date.now() - startedAt,
      error: 'Appels OpenAI desactives pendant la validation backend.'
    });
  }

  var apiKey = getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_API_KEY);
  if (!apiKey) {
    return buildOpenAiImageServiceResult_({
      status: 'missing_api_key',
      model: model,
      durationMs: Date.now() - startedAt,
      error: 'Cle OpenAI absente des proprietes Apps Script.'
    });
  }

  var prompt = buildVisualProjectionPrompt_(entry);
  var editResult = entry && entry.photoDataUrl
    ? requestOpenAiImageEdit_(apiKey, model, prompt, entry.photoDataUrl, startedAt)
    : null;

  if (editResult && editResult.status === 'ok' && editResult.imageDataUrl) {
    return editResult;
  }

  var generationResult = requestOpenAiImageGeneration_(apiKey, model, prompt, startedAt);
  if (generationResult.status === 'ok') return generationResult;

  if (editResult && editResult.status !== 'ok') {
    generationResult.error = generationResult.error || editResult.error;
  }
  return generationResult;
}

function requestOpenAiImageEdit_(apiKey, model, prompt, photoDataUrl, startedAt) {
  try {
    var sourceBlob = dataUrlToImageBlob_(photoDataUrl, 'source-image.jpg');
    var response = UrlFetchApp.fetch(getConfiguredOpenAiImageEditApiUrl_(), {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + apiKey
      },
      payload: {
        model: model,
        prompt: prompt,
        image: sourceBlob,
        size: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_SIZE,
        quality: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_QUALITY,
        output_format: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_OUTPUT_FORMAT
      },
      muteHttpExceptions: true
    });

    return parseOpenAiImageResponse_(response, model, Date.now() - startedAt, 'image_edit');
  } catch (error) {
    return buildOpenAiImageServiceResult_({
      status: 'image_edit_exception',
      model: model,
      durationMs: Date.now() - startedAt,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function requestOpenAiImageGeneration_(apiKey, model, prompt, startedAt) {
  try {
    var response = UrlFetchApp.fetch(getConfiguredOpenAiImageApiUrl_(), {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: model,
        prompt: prompt,
        n: 1,
        size: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_SIZE,
        quality: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_QUALITY,
        output_format: IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_OUTPUT_FORMAT
      }),
      muteHttpExceptions: true
    });

    return parseOpenAiImageResponse_(response, model, Date.now() - startedAt, 'image_generation');
  } catch (error) {
    return buildOpenAiImageServiceResult_({
      status: 'image_generation_exception',
      model: model,
      durationMs: Date.now() - startedAt,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function parseOpenAiImageResponse_(response, model, durationMs, mode) {
  var statusCode = response.getResponseCode();
  var parsed = safeJsonParse_(response.getContentText());

  if (statusCode < 200 || statusCode >= 300) {
    return buildOpenAiImageServiceResult_({
      status: mode + '_http_error',
      model: model,
      durationMs: durationMs,
      error: 'Erreur HTTP OpenAI Images: ' + statusCode
    });
  }

  var imageBase64 = extractOpenAiImageBase64_(parsed);
  if (!imageBase64) {
    return buildOpenAiImageServiceResult_({
      status: mode + '_missing_image',
      model: model,
      durationMs: durationMs,
      error: 'OpenAI Images n a retourne aucune image exploitable.'
    });
  }

  return buildOpenAiImageServiceResult_({
    status: 'ok',
    model: model,
    durationMs: durationMs,
    mode: mode,
    imageDataUrl: 'data:image/' + IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_OUTPUT_FORMAT + ';base64,' + imageBase64,
    inputTokens: extractInputTokens_(parsed),
    outputTokens: extractOutputTokens_(parsed)
  });
}

function buildVisualProjectionPrompt_(entry) {
  var context = entry && entry.visualContext ? entry.visualContext : {};
  var keep = Array.isArray(context.keep)
    ? context.keep.join(', ')
    : normalizeText_(context.keep);

  return [
    'Creer une projection visuelle immobiliere photorealiste, credible pour une demonstration client.',
    'Objectif: ' + normalizeText_(context.objective || context.project || 'home staging'),
    'Piece ou espace: ' + normalizeText_(context.room || context.angle || 'salon'),
    'Style: ' + normalizeText_(context.style || 'contemporain chaleureux'),
    'Ambiance et lumiere: ' + normalizeText_(context.ambiance || context.light || 'jour, lumiere naturelle'),
    'Elements a conserver autant que possible: ' + normalizeText_(keep || 'volumes, ouvertures, structure principale'),
    'Consignes: rendu avant/apres immobilier, propre, lumineux, realiste, sans texte, sans logo, sans filigrane, sans personne identifiable.',
    'Ne pas promettre un resultat contractuel; produire une image d intention commerciale haut de gamme.'
  ].join('\n');
}

function dataUrlToImageBlob_(dataUrl, fileName) {
  var match = String(dataUrl || '').match(/^data:(image\/[A-Za-z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Image source invalide ou absente.');
  var bytes = Utilities.base64Decode(match[2]);
  return Utilities.newBlob(bytes, match[1], fileName || 'source-image.jpg');
}

function extractOpenAiImageBase64_(response) {
  if (!response || !response.data || !response.data.length) return '';
  return response.data[0].b64_json || '';
}

function buildOpenAiImageServiceResult_(entry) {
  return {
    imageDataUrl: entry.imageDataUrl || '',
    model: entry.model || '',
    mode: entry.mode || '',
    tokensInput: Number(entry.inputTokens || 0),
    tokensOutput: Number(entry.outputTokens || 0),
    durationMs: Number(entry.durationMs || 0),
    status: entry.status || 'unknown',
    error: entry.error || null
  };
}

function buildOpenAiServiceResult_(entry) {
  return {
    text: entry.text || '',
    model: entry.model || '',
    tokensInput: Number(entry.inputTokens || 0),
    tokensOutput: Number(entry.outputTokens || 0),
    durationMs: Number(entry.durationMs || 0),
    status: entry.status || 'unknown',
    error: entry.error || null
  };
}

function safeJsonParse_(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function extractOpenAiText_(response) {
  if (!response) return '';
  if (response.output_text) return response.output_text;

  var chunks = [];
  var output = response.output || [];
  output.forEach(function(item) {
    (item.content || []).forEach(function(content) {
      if (content.text) chunks.push(content.text);
    });
  });
  return chunks.join('\n').trim();
}

function extractInputTokens_(response) {
  if (!response || !response.usage) return 0;
  return response.usage.input_tokens || response.usage.prompt_tokens || 0;
}

function extractOutputTokens_(response) {
  if (!response || !response.usage) return 0;
  return response.usage.output_tokens || response.usage.completion_tokens || 0;
}
