/**
 * Cree ou remet a niveau la structure du Google Sheet.
 * Cette fonction doit etre lancee manuellement dans le bon projet Apps Script.
 */

function setupIaCafeClubSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Aucun Google Sheet actif. Lancez cette fonction depuis un projet Apps Script lie au Sheet cible.');
  }

  var summary = {
    ok: true,
    message: 'Structure IA Cafe Club verifiee sans suppression de donnees.',
    createdSheets: [],
    existingSheets: [],
    initializedWithDemoData: [],
    deletedData: false
  };

  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.CONFIG, getConfigHeaders_(), getConfigRows_(), summary);
  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.FRAMEWORK_IMMO, getFrameworkHeaders_(), getFrameworkRows_(), summary);
  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.IA_LOG, getIaLogHeaders_(), [], summary);
  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.TARIFS_IA, getTarifsIaHeaders_(), [], summary);
  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.CAS_TEST, getCasTestHeaders_(), getCasTestRows_(), summary);
  ensureSheetStructure_(spreadsheet, IA_CAFE_CONFIG.SHEETS.VISUELS_LOG, getVisuelsLogHeaders_(), [], summary);

  return summary;
}

function ensureSheetStructure_(spreadsheet, name, headers, rows, summary) {
  var sheet = spreadsheet.getSheetByName(name);
  var created = false;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    created = true;
    summary.createdSheets.push(name);
  } else {
    summary.existingSheets.push(name);
  }

  var hasAnyData = sheet.getLastRow() > 0 || sheet.getLastColumn() > 0;

  if (!hasAnyData) {
    writeHeaders_(sheet, headers);
    writeDemoRowsIfNeeded_(sheet, name, headers, rows, summary);
    formatHeader_(sheet, headers);
    return;
  }

  validateHeaders_(sheet, name, headers);

  if (created) {
    writeHeaders_(sheet, headers);
    writeDemoRowsIfNeeded_(sheet, name, headers, rows, summary);
  }

  if (sheet.getLastRow() === 1) {
    writeDemoRowsIfNeeded_(sheet, name, headers, rows, summary);
  }

  formatHeader_(sheet, headers);
}

function writeHeaders_(sheet, headers) {
  if (!headers.length) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function writeDemoRowsIfNeeded_(sheet, name, headers, rows, summary) {
  if (!rows || !rows.length || sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  summary.initializedWithDemoData.push(name);
}

function validateHeaders_(sheet, name, expectedHeaders) {
  var lastColumn = sheet.getLastColumn();
  var existingHeaders = lastColumn
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(value) {
      return String(value || '').trim();
    })
    : [];

  if (!headersAreStrictlyEqual_(existingHeaders, expectedHeaders)) {
    throw new Error(
      'Structure incompatible pour l onglet "' + name + '". ' +
      'En-tetes attendus, dans cet ordre exact : ' + expectedHeaders.join(' | ') + '. ' +
      'En-tetes trouves : ' + existingHeaders.join(' | ') + '. ' +
      'Aucune donnee n a ete supprimee.'
    );
  }
}

function headersAreStrictlyEqual_(existingHeaders, expectedHeaders) {
  if (existingHeaders.length !== expectedHeaders.length) return false;
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (existingHeaders[i] !== expectedHeaders[i]) return false;
  }
  return true;
}

function formatHeader_(sheet, headers) {
  if (!headers.length) return;
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#111419')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
}

function getConfigHeaders_() {
  return ['cle', 'valeur', 'description', 'modifiable'];
}

function getConfigRows_() {
  return [
    ['VERSION_FRAMEWORK', IA_CAFE_CONFIG.VERSION, 'Version du squelette backend et du referentiel metier.', 'non'],
    ['MODE_DEMO', IA_CAFE_CONFIG.MODE, 'Mode de fonctionnement actuel.', 'non'],
    ['TEMPERATURE', IA_CAFE_CONFIG.DEFAULTS.TEMPERATURE, 'Temperature cible pour les futurs appels IA.', 'oui'],
    ['MAX_OUTPUT_TOKENS', IA_CAFE_CONFIG.DEFAULTS.MAX_OUTPUT_TOKENS, 'Plafond indicatif de sortie pour les futurs appels IA.', 'oui'],
    ['OPENAI_MODEL', '', 'A renseigner plus tard apres validation officielle du modele.', 'oui']
  ];
}

function getFrameworkHeaders_() {
  return ['theme', 'livrable_attendu', 'sections_obligatoires', 'regles_metier'];
}

function getFrameworkRows_() {
  var schemas = getDeliverableSchemas_();
  return Object.keys(schemas).map(function(theme) {
    var schema = schemas[theme];
    return [
      theme,
      schema.description,
      schema.sections.join(' | '),
      schema.rules.join(' | ')
    ];
  });
}

function getIaLogHeaders_() {
  return [
    'date',
    'module',
    'theme',
    'defi_anonymise',
    'angle_selectionne',
    'modele',
    'tokens_entree',
    'tokens_sortie',
    'cout_estime',
    'duree_ms',
    'reponse',
    'statut_validation'
  ];
}

function getTarifsIaHeaders_() {
  return [
    'modele',
    'cout_entree_unitaire',
    'cout_sortie_unitaire',
    'unite',
    'devise',
    'source_officielle',
    'date_validation',
    'notes'
  ];
}

function getCasTestHeaders_() {
  return ['theme', 'angle', 'defi_fictif', 'resultat_attendu'];
}

function getCasTestRows_() {
  return [
    ['Estimation', 'Expliquer l ecart de prix', 'Un vendeur fictif veut afficher son appartement au-dessus des comparables connus.', 'Strategie RDV, trame orale, elements a preparer, suivi, vigilances.'],
    ['Prospection', 'Preparer la relance', 'Une agence fictive veut relancer des proprietaires non repondants apres une premiere prise de contact.', 'Sequence de relance et messages prets a copier.'],
    ['Visite', 'Faire ressortir les objections', 'Apres une visite fictive, un acquereur hesite sur la luminosite et le budget travaux.', 'Synthese, objections, relance adaptee, taches.'],
    ['Acquereur', 'Clarifier la recherche', 'Un acquereur fictif donne des criteres tres larges et change souvent de priorite.', 'Questions manquantes, priorites, prochaines actions.'],
    ['Communication', 'Creer un contenu', 'Une equipe fictive veut annoncer une journee portes ouvertes sans promettre de resultat.', 'Contenu exploitable, variantes, CTA, vigilances.'],
    ['Organisation', 'Creer un plan d action', 'Un negociateur fictif doit organiser sa semaine entre relances, estimations et visites.', 'Checklist, priorites, plan d action.'],
    ['Visuel', 'Preparer un brief visuel', 'Une photo fictive de salon doit servir a preparer une projection de home staging plus tard.', 'Brief structure sans generation image.']
  ];
}

function getVisuelsLogHeaders_() {
  return [
    'date',
    'module',
    'defi_anonymise',
    'projet',
    'style',
    'angle',
    'lumiere',
    'elements_a_preserver',
    'brief',
    'statut_validation'
  ];
}
