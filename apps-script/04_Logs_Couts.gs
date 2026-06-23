/**
 * Journalisation des usages et preparation du suivi cout.
 * Les couts restent vides tant que l onglet TARIFS_IA n est pas renseigne avec
 * une source officielle validee.
 */

function logIaUsage(entry) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(IA_CAFE_CONFIG.SHEETS.IA_LOG);
  if (!sheet) throw new Error('Onglet IA_LOG introuvable. Lancez setupIaCafeClubSheet().');

  var inputTokens = Number(entry.tokensInput || 0);
  var outputTokens = Number(entry.tokensOutput || 0);
  var estimatedCost = estimateIaCost(entry.model, inputTokens, outputTokens);

  sheet.appendRow([
    nowIso_(),
    entry.module || '',
    resolveTheme_(entry.theme),
    anonymizeChallenge_(entry.challenge),
    normalizeText_(entry.angle),
    entry.model || '',
    inputTokens,
    outputTokens,
    estimatedCost === null ? '' : estimatedCost,
    Number(entry.durationMs || 0),
    '',
    entry.validationStatus || IA_CAFE_CONFIG.VALIDATION_STATUSES.TO_VALIDATE
  ]);

  return {
    ok: true,
    estimatedCost: estimatedCost
  };
}

function estimateIaCost(model, inputTokens, outputTokens) {
  var normalizedModel = normalizeText_(model);
  if (!normalizedModel) return null;

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(IA_CAFE_CONFIG.SHEETS.TARIFS_IA);
  if (!sheet || sheet.getLastRow() < 2) return null;

  var values = sheet.getDataRange().getValues();
  var headers = values.shift();
  var idx = buildHeaderIndex_(headers);

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (normalizeText_(row[idx.modele]) !== normalizedModel) continue;

    var inputRate = Number(row[idx.cout_entree_unitaire]);
    var outputRate = Number(row[idx.cout_sortie_unitaire]);
    var unit = normalizeText_(row[idx.unite]);
    var source = normalizeText_(row[idx.source_officielle]);
    var validationDate = normalizeText_(row[idx.date_validation]);

    if (!inputRate || !outputRate || !unit || !source || !validationDate) return null;

    var divisor = unit === '1M tokens' ? 1000000 : unit === '1000 tokens' ? 1000 : null;
    if (!divisor) return null;

    return ((inputTokens / divisor) * inputRate) + ((outputTokens / divisor) * outputRate);
  }

  return null;
}

function logVisualRequest(entry) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(IA_CAFE_CONFIG.SHEETS.VISUELS_LOG);
  if (!sheet) throw new Error('Onglet VISUELS_LOG introuvable. Lancez setupIaCafeClubSheet().');

  var visualContext = entry.visualContext || {};
  var keep = visualContext.keep || visualContext.elementsToKeep || [];
  if (!Array.isArray(keep)) keep = [keep];

  sheet.appendRow([
    nowIso_(),
    entry.module || 'visual_brief',
    anonymizeChallenge_(entry.challenge),
    normalizeText_(visualContext.objective || visualContext.project),
    normalizeText_(visualContext.style),
    normalizeText_(visualContext.room || visualContext.angle),
    normalizeText_(visualContext.ambiance || visualContext.light),
    normalizeText_(keep.join(', ')),
    '',
    entry.validationStatus || IA_CAFE_CONFIG.VALIDATION_STATUSES.TO_VALIDATE
  ]);

  return { ok: true };
}

function buildHeaderIndex_(headers) {
  var index = {};
  headers.forEach(function(header, position) {
    index[String(header)] = position;
  });
  return index;
}
