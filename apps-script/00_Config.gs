/**
 * Configuration centrale du backend Apps Script.
 * Aucune cle API ni donnee sensible ne doit etre stockee dans ce fichier.
 */

const IA_CAFE_CONFIG = {
  VERSION: '0.1.0-backend-skeleton',
  MODE: 'demo_backend_validation',
  SHEETS: {
    CONFIG: 'CONFIG',
    FRAMEWORK_IMMO: 'FRAMEWORK_IMMO',
    IA_LOG: 'IA_LOG',
    TARIFS_IA: 'TARIFS_IA',
    CAS_TEST: 'CAS_TEST',
    VISUELS_LOG: 'VISUELS_LOG'
  },
  SCRIPT_PROPERTIES: {
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    OPENAI_MODEL: 'OPENAI_MODEL',
    OPENAI_API_URL: 'OPENAI_API_URL',
    OPENAI_IMAGE_MODEL: 'OPENAI_IMAGE_MODEL',
    OPENAI_IMAGE_API_URL: 'OPENAI_IMAGE_API_URL',
    OPENAI_IMAGE_EDIT_API_URL: 'OPENAI_IMAGE_EDIT_API_URL',
    ENABLE_OPENAI_CALLS: 'ENABLE_OPENAI_CALLS'
  },
  DEFAULTS: {
    OPENAI_API_URL: 'https://api.openai.com/v1/responses',
    OPENAI_IMAGE_API_URL: 'https://api.openai.com/v1/images/generations',
    OPENAI_IMAGE_EDIT_API_URL: 'https://api.openai.com/v1/images/edits',
    OPENAI_IMAGE_MODEL: 'gpt-image-2',
    OPENAI_IMAGE_SIZE: '1024x1024',
    OPENAI_IMAGE_QUALITY: 'low',
    OPENAI_IMAGE_OUTPUT_FORMAT: 'jpeg',
    TEMPERATURE: 0.4,
    MAX_OUTPUT_TOKENS: 1800,
    ENABLE_OPENAI_CALLS: false
  },
  ROUTES: {
    ANALYZE_CHALLENGE: 'analyzeChallenge',
    GENERATE_DELIVERABLE: 'generateDeliverable',
    PREPARE_VISUAL_BRIEF: 'prepareVisualBrief',
    GENERATE_VISUAL_PROJECTION: 'generateVisualProjection',
    LOG_EVENT: 'logEvent'
  },
  VALIDATION_STATUSES: {
    DRAFT: 'brouillon',
    TO_VALIDATE: 'a valider',
    VALIDATED_DEMO: 'valide demo',
    REJECTED: 'rejete',
    ERROR: 'erreur'
  },
  SAFETY_RULES: [
    'Ne jamais traiter ou conserver de donnee client reelle ou identifiable.',
    'Ne jamais inventer de donnee juridique, reglementaire, de marche ou de prix.',
    'Ne jamais presenter une projection visuelle comme une photo reelle.',
    'Toujours signaler les informations manquantes et les points a valider par un professionnel.',
    'Toujours produire un livrable metier exploitable, pas une reponse vague de chatbot.'
  ]
};

function getIaCafeConfig_() {
  return IA_CAFE_CONFIG;
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function getConfiguredOpenAiApiUrl_() {
  return getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_API_URL) ||
    IA_CAFE_CONFIG.DEFAULTS.OPENAI_API_URL;
}

function getConfiguredOpenAiModel_() {
  return getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_MODEL) || '';
}

function getConfiguredOpenAiImageModel_() {
  return getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_IMAGE_MODEL) ||
    IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_MODEL;
}

function getConfiguredOpenAiImageApiUrl_() {
  return getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_IMAGE_API_URL) ||
    IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_API_URL;
}

function getConfiguredOpenAiImageEditApiUrl_() {
  return getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.OPENAI_IMAGE_EDIT_API_URL) ||
    IA_CAFE_CONFIG.DEFAULTS.OPENAI_IMAGE_EDIT_API_URL;
}

function areOpenAiCallsEnabled_() {
  return String(getScriptProperty_(IA_CAFE_CONFIG.SCRIPT_PROPERTIES.ENABLE_OPENAI_CALLS)).toLowerCase() === 'true';
}

function nowIso_() {
  return new Date().toISOString();
}

function normalizeText_(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function anonymizeChallenge_(text) {
  var output = normalizeText_(text);
  if (!output) return '';

  output = output
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:\+?\d[\s.-]?){8,}/g, '[telephone]')
    .replace(/\b\d{1,5}\s+(?:rue|avenue|av\.|boulevard|bd|chemin|impasse|place|route)\b[^,.]*/gi, '[adresse]')
    .replace(/\b(?:madame|mme|monsieur|m\.|mr)\s+[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'-]+/g, '[personne]');

  if (output.length > 1800) output = output.slice(0, 1800) + '...';
  return output;
}

function buildJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildError_(route, message, details) {
  return {
    ok: false,
    route: route || '',
    data: null,
    usage: null,
    error: {
      message: message || 'Erreur inconnue',
      details: details || null
    }
  };
}

function buildSuccess_(route, data, usage) {
  return {
    ok: true,
    route: route,
    data: data || {},
    usage: usage || null,
    error: null
  };
}
