/**
 * Routes Web App Apps Script.
 * Les routes sont preparees pour validation backend; les appels IA reels restent
 * desactives tant que la propriete ENABLE_OPENAI_CALLS n est pas explicitement
 * configuree a true dans Apps Script.
 */

function doPost(e) {
  var route = '';

  try {
    var payload = parsePostPayload_(e);
    route = normalizeText_(payload.route);

    if (!validateBackendToken_(payload)) {
      return buildJsonResponse_(buildError_('', 'Requete non autorisee.', null));
    }

    switch (route) {
      case IA_CAFE_CONFIG.ROUTES.ANALYZE_CHALLENGE:
        return buildJsonResponse_(handleAnalyzeChallenge_(payload));
      case IA_CAFE_CONFIG.ROUTES.GENERATE_DELIVERABLE:
        return buildJsonResponse_(handleGenerateDeliverable_(payload));
      case IA_CAFE_CONFIG.ROUTES.PREPARE_VISUAL_BRIEF:
        return buildJsonResponse_(handlePrepareVisualBrief_(payload));
      case IA_CAFE_CONFIG.ROUTES.GENERATE_VISUAL_PROJECTION:
        return buildJsonResponse_(handleGenerateVisualProjection_(payload));
      case IA_CAFE_CONFIG.ROUTES.LOG_EVENT:
        return buildJsonResponse_(handleLogEvent_(payload));
      default:
        return buildJsonResponse_(buildError_(route, 'Route inconnue ou absente.', null));
    }
  } catch (error) {
    return buildJsonResponse_(buildError_(route, error.message || String(error), null));
  }
}

function doGet() {
  return buildJsonResponse_(buildSuccess_('health', {
    service: 'IA Cafe Club backend',
    ok: true
  }, null));
}

function handleAnalyzeChallenge_(payload) {
  var prompt = buildAnalysisPrompt(payload);
  var openAiResult = callOpenAI(prompt.messages);
  var data = openAiResult.status === 'ok' && openAiResult.text
    ? parseAiJsonOrWrap_(openAiResult.text)
    : buildLocalAnalysisFallback_(payload);
  var scenarioId = data.scenario_id || detectScenarioId_(payload);
  data.scenario_id = scenarioId;

  return buildSuccess_(IA_CAFE_CONFIG.ROUTES.ANALYZE_CHALLENGE, {
    analysis: data,
    scenario_id: scenarioId,
    schema: prompt.schema,
    engineStatus: openAiResult.status
  }, buildUsage_(openAiResult));
}

function handleGenerateDeliverable_(payload) {
  var prompt = buildDeliverablePrompt(payload);
  var openAiResult = callOpenAI(prompt.messages);
  var usesOpenAi = openAiResult.status === 'ok' && openAiResult.text;
  var data = usesOpenAi
    ? parseAiJsonOrWrap_(openAiResult.text)
    : buildLocalDeliverableFallback_(payload);
  var scenarioId = data.scenario_id || detectScenarioId_(payload);
  var fallbackType = usesOpenAi ? 'openai' : (data.fallback_type || 'generic');
  if (!usesOpenAi) data.fallback_type = fallbackType;
  data.scenario_id = scenarioId;

  return buildSuccess_(IA_CAFE_CONFIG.ROUTES.GENERATE_DELIVERABLE, {
    deliverable: data,
    scenario_id: scenarioId,
    fallback_type: fallbackType,
    schema: prompt.schema,
    engineStatus: openAiResult.status
  }, buildUsage_(openAiResult));
}

function handlePrepareVisualBrief_(payload) {
  var prompt = buildVisualBriefPrompt(payload);
  var openAiResult = callOpenAI(prompt.messages);
  var usesOpenAi = openAiResult.status === 'ok' && openAiResult.text;
  var data = usesOpenAi
    ? parseAiJsonOrWrap_(openAiResult.text)
    : buildLocalDeliverableFallback_({
      scenario_id: payload.scenario_id,
      theme: 'Visuel',
      angle: payload.angle,
      challenge: payload.challenge,
      visualContext: payload.visualContext
    });
  var scenarioId = data.scenario_id || detectScenarioId_(payload);
  var fallbackType = usesOpenAi ? 'openai' : (data.fallback_type || 'generic');
  if (!usesOpenAi) data.fallback_type = fallbackType;
  data.scenario_id = scenarioId;

  return buildSuccess_(IA_CAFE_CONFIG.ROUTES.PREPARE_VISUAL_BRIEF, {
    visualBrief: data,
    scenario_id: scenarioId,
    fallback_type: fallbackType,
    schema: prompt.schema,
    engineStatus: openAiResult.status
  }, buildUsage_(openAiResult));
}

function handleGenerateVisualProjection_(payload) {
  var visualContext = payload.visualContext || {};
  var openAiResult = callOpenAIVisualProjection({
    challenge: payload.challenge,
    visualContext: visualContext,
    photoDataUrl: payload.photoDataUrl
  });

  if (openAiResult.status !== 'ok' || !openAiResult.imageDataUrl) {
    return buildError_(
      IA_CAFE_CONFIG.ROUTES.GENERATE_VISUAL_PROJECTION,
      openAiResult.error || 'Projection visuelle indisponible.',
      {
        engineStatus: openAiResult.status,
        model: openAiResult.model || ''
      }
    );
  }

  var logStatus = 'not_logged';
  try {
    var logResult = logVisualRequest({
      module: 'visual_projection',
      challenge: payload.challenge,
      visualContext: visualContext,
      validationStatus: IA_CAFE_CONFIG.VALIDATION_STATUSES.TO_VALIDATE
    });
    logStatus = logResult.ok ? 'logged' : 'not_logged';
  } catch (logError) {
    logStatus = 'log_error';
  }

  return buildSuccess_(IA_CAFE_CONFIG.ROUTES.GENERATE_VISUAL_PROJECTION, {
    projection: {
      imageDataUrl: openAiResult.imageDataUrl,
      legalMention: 'Projection visuelle non contractuelle',
      visualContext: visualContext
    },
    engineStatus: openAiResult.status,
    generationMode: openAiResult.mode,
    logStatus: logStatus
  }, buildUsage_(openAiResult));
}

function handleLogEvent_(payload) {
  var moduleName = normalizeText_(payload.module);
  var result;

  if (moduleName === 'visual_brief') {
    result = logVisualRequest(payload);
  } else {
    result = logIaUsage({
      module: moduleName || 'manual_event',
      theme: payload.theme,
      challenge: payload.challenge,
      angle: payload.angle,
      model: payload.model,
      tokensInput: payload.tokensInput,
      tokensOutput: payload.tokensOutput,
      durationMs: payload.durationMs,
      response: payload.response,
      validationStatus: payload.validationStatus
    });
  }

  return buildSuccess_(IA_CAFE_CONFIG.ROUTES.LOG_EVENT, {
    logged: result.ok,
    estimatedCost: result.estimatedCost === undefined ? null : result.estimatedCost
  }, null);
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  var parsed = safeJsonParse_(e.postData.contents);
  if (!parsed) throw new Error('Payload JSON invalide.');
  return parsed;
}

function validateBackendToken_(payload) {
  var expectedToken = getScriptProperty_('IA_CAFE_BACKEND_TOKEN');
  var receivedToken = payload && payload.backend_token;
  return Boolean(expectedToken) && receivedToken === expectedToken;
}

function parseAiJsonOrWrap_(text) {
  var parsed = safeJsonParse_(text);
  return parsed || { texte: text };
}

function buildUsage_(openAiResult) {
  return {
    model: openAiResult.model || '',
    tokensInput: openAiResult.tokensInput || 0,
    tokensOutput: openAiResult.tokensOutput || 0,
    durationMs: openAiResult.durationMs || 0,
    status: openAiResult.status,
    error: openAiResult.error
  };
}
