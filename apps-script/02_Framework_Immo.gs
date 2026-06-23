/**
 * Referentiel metier immobilier et schemas de livrables.
 * Objectif : transformer un defi en livrable exploitable, jamais en reponse vague.
 */

function getDeliverableSchemas_() {
  return {
    Estimation: {
      description: 'Preparer un rendez-vous vendeur ou une discussion de prix sans inventer de valeur de marche.',
      sections: [
        'strategie_de_rendez_vous',
        'trame_orale',
        'elements_a_preparer',
        'message_de_suivi',
        'vigilances'
      ],
      rules: [
        'Ne jamais inventer de prix, comparable, delai de vente ou statistique marche.',
        'S appuyer uniquement sur les informations fournies et lister ce qui manque.',
        'Proposer une posture relationnelle claire et verifiable.'
      ]
    },
    Prospection: {
      description: 'Construire une approche de prospection utile et actionnable.',
      sections: [
        'angle_d_approche',
        'sequence_de_relance',
        'messages_prets_a_copier',
        'prochaine_action',
        'vigilances'
      ],
      rules: [
        'Ne pas promettre de mandat, de vente ou de resultat.',
        'Eviter toute pression excessive ou formulation trompeuse.',
        'Prevoir une prochaine action concrete et mesurable.'
      ]
    },
    Visite: {
      description: 'Transformer une visite ou un retour visite en suivi commercial structure.',
      sections: [
        'synthese',
        'objections_identifiees',
        'relance_adaptee',
        'taches_a_suivre',
        'vigilances'
      ],
      rules: [
        'Distinguer les faits fournis, les hypotheses et les questions a poser.',
        'Ne pas minimiser une objection technique, juridique ou financiere.',
        'Proposer une relance respectueuse et utile.'
      ]
    },
    Acquereur: {
      description: 'Qualifier une recherche acquereur et clarifier les prochaines actions.',
      sections: [
        'qualification',
        'questions_manquantes',
        'priorites',
        'prochaines_actions',
        'vigilances'
      ],
      rules: [
        'Ne pas supposer le budget, le financement ou la capacite d achat.',
        'Identifier les criteres bloquants et les criteres negociables.',
        'Faire emerger les informations necessaires avant de recommander.'
      ]
    },
    Communication: {
      description: 'Produire un contenu immobilier exploitable et prudent.',
      sections: [
        'contenu_exploitable',
        'variantes',
        'cta',
        'points_de_vigilance'
      ],
      rules: [
        'Ne pas inventer de caracteristique du bien ou de performance.',
        'Eviter les formulations juridiquement sensibles ou discriminantes.',
        'Adapter le ton au canal si le canal est precise.'
      ]
    },
    Organisation: {
      description: 'Transformer une situation de travail en priorites et plan d action.',
      sections: [
        'checklist',
        'priorites',
        'plan_d_action',
        'points_de_controle'
      ],
      rules: [
        'Classer les actions par impact et urgence lorsque possible.',
        'Produire des etapes realistes et directement executables.',
        'Faire apparaitre les dependances et les informations manquantes.'
      ]
    },
    Visuel: {
      description: 'Preparer un brief visuel structure avant toute generation future.',
      sections: [
        'objectif_du_visuel',
        'description_source',
        'intention_de_transformation',
        'style',
        'angle_et_lumiere',
        'elements_a_preserver',
        'mentions_de_prudence'
      ],
      rules: [
        'Ne generer aucune image a ce stade.',
        'Ne jamais presenter une projection comme une photo reelle.',
        'Lister les elements a preserver avant toute future generation.'
      ]
    },
    Autre: {
      description: 'Clarifier le besoin et produire un livrable metier adapte.',
      sections: [
        'reformulation_operationnelle',
        'informations_manquantes',
        'livrable_propose',
        'prochaines_actions',
        'vigilances'
      ],
      rules: [
        'Ne pas rester generique.',
        'Choisir un livrable concret si le theme est ambigu.',
        'Signaler les limites et les validations necessaires.'
      ]
    }
  };
}

function getKnownThemes_() {
  return Object.keys(getDeliverableSchemas_());
}

function resolveTheme_(theme) {
  var normalized = normalizeText_(theme);
  var aliases = {
    'Bien & estimation': 'Estimation',
    'Bien et estimation': 'Estimation',
    'Recherche acquereur': 'Acquereur',
    'Recherche acquéreur': 'Acquereur',
    'Visite & suivi': 'Visite',
    'Defi visuel': 'Visuel',
    'Défi visuel': 'Visuel'
  };
  if (aliases[normalized]) return aliases[normalized];

  var schemas = getDeliverableSchemas_();
  return schemas[normalized] ? normalized : 'Autre';
}

function getDeliverableSchema(theme, angle) {
  var resolvedTheme = resolveTheme_(theme);
  var schemas = getDeliverableSchemas_();
  var schema = schemas[resolvedTheme] || schemas.Autre;

  return {
    theme: resolvedTheme,
    angle: normalizeText_(angle),
    description: schema.description,
    sections: schema.sections.slice(),
    rules: schema.rules.slice()
  };
}

function buildSystemInstruction_() {
  return [
    'Tu es un assistant metier pour professionnels de l immobilier.',
    'Tu transformes un defi en livrable exploitable, structure et actionnable.',
    'Tu ne fournis jamais une reponse vague de chatbot.',
    'Tu ne traites aucune donnee client reelle ou identifiable.',
    'Tu n inventes jamais de donnee juridique, reglementaire, de marche, de prix, de rendement ou de delai.',
    'Si une information manque, tu le dis explicitement et tu proposes comment l obtenir.',
    'Tu distingues les faits fournis, les hypotheses prudentes et les points a valider.',
    'Tu termines toujours par des vigilances professionnelles.'
  ].join('\n');
}

function buildAnalysisPrompt(payload) {
  var challenge = anonymizeChallenge_(payload && payload.challenge);
  var theme = resolveTheme_(payload && payload.theme);
  var schema = getDeliverableSchema(theme, '');
  var scenarioId = detectScenarioId_({
    theme: theme,
    angle: payload && payload.angle,
    challenge: challenge,
    scenario_id: payload && payload.scenario_id
  });

  return {
    messages: [
      {
        role: 'system',
        content: buildSystemInstruction_()
      },
      {
        role: 'user',
        content: [
          'Analyse ce defi immobilier anonymise.',
          'Theme pressenti: ' + theme,
          'Defi: ' + challenge,
          '',
          'Retourne uniquement un JSON valide avec:',
          '- reformulation_operationnelle',
          '- theme_recommande',
          '- scenario_id: un identifiant parmi seller_price_gap, buyer_post_visit_followup, estimation_offer_content, home_staging_visual_brief, generic',
          '- angles_recommandes: 3 angles maximum',
          '- informations_manquantes',
          '- risques_de_reponse_vague_a_eviter',
          '',
          'Scenario detecte localement avant appel IA: ' + scenarioId,
          'Le futur livrable devra respecter ces sections: ' + schema.sections.join(', ')
        ].join('\n')
      }
    ],
    schema: schema
  };
}

function buildDeliverablePrompt(payload) {
  var challenge = anonymizeChallenge_(payload && payload.challenge);
  var theme = resolveTheme_(payload && payload.theme);
  var angle = normalizeText_(payload && payload.angle);
  var schema = getDeliverableSchema(theme, angle);

  return {
    messages: [
      {
        role: 'system',
        content: buildSystemInstruction_()
      },
      {
        role: 'user',
        content: [
          'Produis un livrable metier immobilier exploitable.',
          'Theme: ' + schema.theme,
          'Angle selectionne: ' + (schema.angle || 'Non precise'),
          'Defi anonymise: ' + challenge,
          '',
          'Sections obligatoires:',
          schema.sections.map(function(section) { return '- ' + section; }).join('\n'),
          '',
          'Regles metier obligatoires:',
          schema.rules.map(function(rule) { return '- ' + rule; }).join('\n'),
          '',
          'Format attendu: JSON valide, avec une cle par section obligatoire.',
          'Chaque section doit contenir des elements actionnables, prets a utiliser ou a adapter.'
        ].join('\n')
      }
    ],
    schema: schema
  };
}

function buildVisualBriefPrompt(payload) {
  var challenge = anonymizeChallenge_(payload && payload.challenge);
  var schema = getDeliverableSchema('Visuel', payload && payload.angle);
  var visualContext = payload && payload.visualContext ? payload.visualContext : {};

  return {
    messages: [
      {
        role: 'system',
        content: buildSystemInstruction_() + '\nAucune generation d image ne doit etre lancee.'
      },
      {
        role: 'user',
        content: [
          'Prepare un brief visuel structure pour une future projection image.',
          'Ne genere aucune image.',
          'Defi anonymise: ' + challenge,
          'Projet: ' + normalizeText_(visualContext.project),
          'Style: ' + normalizeText_(visualContext.style),
          'Angle: ' + normalizeText_(visualContext.angle),
          'Lumiere: ' + normalizeText_(visualContext.light),
          'Elements a preserver: ' + normalizeText_((visualContext.keep || []).join(', ')),
          '',
          'Sections obligatoires:',
          schema.sections.map(function(section) { return '- ' + section; }).join('\n'),
          '',
          'Format attendu: JSON valide, sans prompt de generation definitive.'
        ].join('\n')
      }
    ],
    schema: schema
  };
}

function buildLocalAnalysisFallback_(payload) {
  var theme = resolveTheme_(payload && payload.theme);
  var challenge = anonymizeChallenge_(payload && payload.challenge);
  var schema = getDeliverableSchema(theme, '');
  var scenarioId = detectScenarioId_({
    theme: theme,
    angle: payload && payload.angle,
    challenge: challenge,
    scenario_id: payload && payload.scenario_id
  });

  return {
    reformulation_operationnelle: challenge || 'Defi non renseigne.',
    theme_recommande: schema.theme,
    scenario_id: scenarioId,
    angles_recommandes: getDefaultAnglesForTheme_(schema.theme),
    informations_manquantes: [
      'Contexte exact du dossier',
      'Objectif commercial prioritaire',
      'Contraintes ou limites a respecter'
    ],
    risques_de_reponse_vague_a_eviter: [
      'Conseils generiques sans livrable',
      'Invention de chiffres ou de donnees marche',
      'Absence de prochaine action'
    ]
  };
}

function buildLocalDeliverableFallback_(payload) {
  var schema = getDeliverableSchema(payload && payload.theme, payload && payload.angle);
  var challenge = anonymizeChallenge_(payload && payload.challenge);
  var scenarioId = detectScenarioId_({
    theme: schema.theme,
    angle: schema.angle,
    challenge: challenge,
    scenario_id: payload && payload.scenario_id
  });
  var specialized = getSpecializedLocalDeliverableFallback_(scenarioId, schema, challenge, payload || {});
  if (specialized) return specialized;

  var result = {
    fallback_type: 'generic',
    scenario_id: scenarioId,
    contexte: challenge || 'Defi non renseigne.',
    theme: schema.theme,
    angle: schema.angle || 'Non precise'
  };

  schema.sections.forEach(function(section) {
    result[section] = buildUsefulGenericSection_(schema.theme, section, challenge);
  });

  return result;
}

function getSpecializedLocalDeliverableFallback_(scenarioId, schema, challenge, payload) {
  var theme = schema.theme;
  var angle = normalizeText_(schema.angle).toLowerCase();

  if (scenarioId === 'seller_price_gap') {
    return buildEstimationVendeurTropHautFallback_(schema, challenge, scenarioId);
  }

  if (scenarioId === 'buyer_post_visit_followup') {
    return buildVisiteAcquereurHesitantFallback_(schema, challenge, scenarioId);
  }

  if (scenarioId === 'estimation_offer_content') {
    return buildCommunicationEstimationOfferteFallback_(schema, challenge, scenarioId);
  }

  if (scenarioId === 'home_staging_visual_brief') {
    return buildVisualHomeStagingFallback_(schema, challenge, payload.visualContext || {}, scenarioId);
  }

  if (theme === 'Estimation' && containsAny_(angle, ['ecart de prix', 'écart de prix', 'vendeur trop haut'])) {
    return buildEstimationVendeurTropHautFallback_(schema, challenge, 'seller_price_gap');
  }

  if (theme === 'Visite' && containsAny_(angle, ['relance adaptee', 'relance adaptée', 'acquereur hesitant', 'acquéreur hésitant'])) {
    return buildVisiteAcquereurHesitantFallback_(schema, challenge, 'buyer_post_visit_followup');
  }

  if (theme === 'Communication' && containsAny_(angle, ['contenu exploitable', 'estimation offerte'])) {
    return buildCommunicationEstimationOfferteFallback_(schema, challenge, 'estimation_offer_content');
  }

  if (theme === 'Visuel' && containsAny_(angle, ['brief avant apres', 'brief avant / apres', 'brief avant / après', 'brief avant après', 'home staging'])) {
    return buildVisualHomeStagingFallback_(schema, challenge, payload.visualContext || {}, 'home_staging_visual_brief');
  }

  return null;
}

function buildEstimationVendeurTropHautFallback_(schema, challenge, scenarioId) {
  return {
    fallback_type: 'specialized',
    scenario_id: scenarioId || 'seller_price_gap',
    contexte: challenge || 'Vendeur attache a un prix superieur aux elements disponibles.',
    theme: schema.theme,
    angle: schema.angle || 'Expliquer l ecart de prix',
    strategie_de_rendez_vous: [
      'Ouvrir le rendez-vous en validant l objectif du vendeur : vendre dans de bonnes conditions, sans le mettre en accusation sur son prix souhaite.',
      'Faire raconter au vendeur pourquoi ce prix est important pour lui : projet suivant, attachement au bien, travaux realises, besoin financier, comparaison entendue.',
      'Separer les faits des attentes : caracteristiques du bien, retours de visites, biens concurrents connus, delais constates, contraintes du calendrier.',
      'Presenter les elements disponibles comme une aide a la decision, pas comme une contradiction frontale : "voici ce que les acheteurs risquent de regarder".',
      'Proposer deux scenarios de commercialisation : demarrage au prix souhaite avec point d etape date, ou ajustement plus prudent des le depart selon les elements verifies.',
      'Conclure par une decision simple : prix de depart, indicateurs a suivre, date du prochain point et message a envoyer apres le rendez-vous.'
    ],
    trame_orale: [
      'Je comprends que ce prix ait du sens pour vous. Mon role n est pas de vous imposer un chiffre, mais de vous aider a prendre une decision qui tienne face aux acheteurs.',
      'Pour eviter un debat d opinion, je vous propose de regarder trois choses : ce que votre bien a vraiment pour lui, ce que les acheteurs vont comparer, et ce qui pourrait bloquer une offre.',
      'Si nous partons trop haut sans strategie, le risque n est pas seulement de ne pas vendre tout de suite. Le risque est aussi d installer le bien dans le temps, puis de devoir justifier une baisse plus tard.',
      'On peut choisir de tester votre prix, mais il faut alors definir des signaux objectifs : nombre de demandes, qualite des visites, retours recurrents, absence ou presence d offres.',
      'Mon conseil est de fixer ensemble une methode : un prix, une duree d observation, des indicateurs, puis une decision prevue a l avance. Comme ca, on garde la main et on ne subit pas le marche.'
    ].join(' '),
    elements_a_preparer: [
      'Fiche descriptive complete du bien : surface, pieces, etage, exterieur, stationnement, cave, etat general, charges, travaux recents et points faibles connus.',
      'Documents disponibles : diagnostics, charges, taxe fonciere si partageable, factures de travaux, plans, reglement ou informations de copropriete si pertinent.',
      'Comparaisons prudentes : biens actuellement concurrents, biens similaires deja vendus si l information est verifiee, annonces comparables avec differences explicites.',
      'Historique commercial du bien si deja diffuse : prix affiche, duree de diffusion, nombre de contacts, visites, retours, offres ou absence d offres.',
      'Questions vendeur : delai souhaite, marge de negociation acceptee, prix plancher confidentiel, raison du prix souhaite, priorite entre vitesse, prix et confort de transaction.',
      'Points a verifier avant toute affirmation : donnees de marche locales, caracteristiques exactes du bien, contraintes juridiques ou techniques, informations financieres non confirmees.'
    ],
    message_de_suivi: [
      'Bonjour,',
      '',
      'Merci pour notre echange. Comme convenu, l objectif est de choisir une strategie de prix qui reste defendable devant les acheteurs, sans se baser sur une simple impression.',
      '',
      'Je vous propose de reprendre ensemble les elements suivants : les atouts objectifs du bien, les points que les acheteurs risquent de comparer, les retours attendus pendant la commercialisation, puis une date de point d etape pour decider si l approche doit etre ajustee.',
      '',
      'Cela nous permettra de garder une demarche claire : tester, mesurer, puis decider avec des elements concrets.',
      '',
      'Bien a vous'
    ].join('\n'),
    vigilances: [
      'Ne pas annoncer un prix de marche, un delai de vente ou une probabilite de vente sans source verifiee et contexte local valide.',
      'Ne pas contredire frontalement le vendeur : reformuler son objectif avant de presenter les risques.',
      'Ne pas utiliser de comparables approximatifs sans expliquer les differences avec le bien concerne.',
      'Ne pas promettre qu une baisse de prix declenchera une offre.',
      'Faire valider toute information juridique, reglementaire, technique ou financiere par le professionnel competent.'
    ]
  };
}

function buildVisiteAcquereurHesitantFallback_(schema, challenge, scenarioId) {
  return {
    fallback_type: 'specialized',
    scenario_id: scenarioId || 'buyer_post_visit_followup',
    contexte: challenge || 'Acquereur hesitant apres visite avec objections a clarifier.',
    theme: schema.theme,
    angle: schema.angle || 'Relance adaptee',
    synthese: [
      'L acquereur a visite le bien et n a pas encore donne de position claire.',
      'Les hesitations connues portent sur les elements exprimes pendant ou apres la visite.',
      'L objectif de la relance n est pas de pousser a la decision, mais d obtenir un retour exploitable : interet maintenu, objection bloquante, besoin d information ou abandon.'
    ],
    objections_identifiees: [
      'Objection de perception : luminosite, volumes, agencement ou ambiance ressentie pendant la visite.',
      'Objection de projection : travaux, ameublement, usage des pieces, adaptation au mode de vie.',
      'Objection de risque : budget global, incertitude sur les couts, peur de se tromper.',
      'Objection de timing : besoin de comparer, decision familiale, financement ou priorite non stabilisee.',
      'Information manquante a obtenir : ce qui bloque vraiment la suite et ce qui permettrait de trancher.'
    ],
    relance_adaptee: [
      'Bonjour,',
      '',
      'Je me permets de revenir vers vous suite a la visite. Vous aviez notamment evoque quelques points de hesitation, en particulier sur la projection dans le bien.',
      '',
      'Pour vous aider utilement, je peux soit vous transmettre les informations manquantes, soit organiser un second regard plus cible sur les points qui vous font hesiter.',
      '',
      'De votre cote, est-ce que le bien reste une option a creuser, ou souhaitez-vous que l on ecarte ce type de bien pour affiner la recherche ?',
      '',
      'Bien a vous'
    ].join('\n'),
    relance_alternative_si_aucune_reponse: [
      'Bonjour,',
      '',
      'Je reviens une derniere fois vers vous concernant la visite. Sans retour de votre part, je considererai simplement que le bien ne correspond pas suffisamment a votre recherche actuelle.',
      '',
      'Si vous le souhaitez, envoyez-moi juste un mot sur ce qui a bloque : luminosite, travaux, budget global, secteur ou autre point. Cela me permettra de mieux cibler les prochaines propositions.',
      '',
      'Bonne journee'
    ].join('\n'),
    taches_a_suivre: [
      'Noter les objections exactes dans le suivi acquereur, sans les transformer en certitudes.',
      'Identifier l information manquante qui pourrait lever ou confirmer le blocage.',
      'Preparer une reponse factuelle aux objections connues : documents, precision technique, seconde visite, photos complementaires si disponibles.',
      'Qualifier la suite : interesse, a relancer, recherche a ajuster, ou bien a ecarter.',
      'Mettre a jour les criteres de recherche selon le retour obtenu.'
    ],
    vigilances: [
      'Ne pas minimiser une objection travaux, financement, technique ou juridique.',
      'Ne pas inventer de cout de travaux, de luminosite moyenne, de performance ou d information non verifiee.',
      'Ne pas mettre de pression artificielle sur l acquereur.',
      'Conserver une trace claire des retours pour ajuster la recherche.'
    ]
  };
}

function buildCommunicationEstimationOfferteFallback_(schema, challenge, scenarioId) {
  return {
    fallback_type: 'specialized',
    scenario_id: scenarioId || 'estimation_offer_content',
    contexte: challenge || 'Communication autour d une estimation offerte sans promesse de resultat.',
    theme: schema.theme,
    angle: schema.angle || 'Contenu exploitable',
    contenu_exploitable: [
      'Vous vous demandez ce que vaut votre bien aujourd hui ?',
      '',
      'Une estimation utile ne se resume pas a un chiffre pose rapidement. Elle sert surtout a comprendre comment votre bien peut etre lu par les acheteurs : ses atouts, ses points de comparaison, ses limites eventuelles et la strategie de mise en vente la plus coherente.',
      '',
      'Nous proposons un premier echange d estimation offert, sans engagement, pour vous aider a y voir plus clair avant de prendre une decision.',
      '',
      'L objectif : vous donner une base de discussion serieuse, identifier les informations a verifier, et eviter les decisions prises sur une simple impression.',
      '',
      'Vous avez un projet de vente, maintenant ou plus tard ? Parlons-en simplement.'
    ].join('\n'),
    variantes: [
      'Accroche 1 : Avant de parler prix, parlons methode : une bonne estimation doit vous aider a decider, pas seulement vous donner un chiffre.',
      'Accroche 2 : Votre bien a une valeur, mais surtout un contexte : emplacement, etat, concurrence, timing et attentes des acheteurs.'
    ],
    cta: 'Envoyez-nous un message avec le type de bien et la commune. Nous vous proposerons un premier echange d estimation offert, sans engagement.',
    formulations_a_eviter: [
      'Estimation garantie.',
      'Vendez au meilleur prix a coup sur.',
      'Nous connaissons exactement le prix de votre bien sans visite.',
      'Votre bien vaut plus que vous ne le pensez.',
      'Acheteurs deja prets sans verification du dossier.'
    ],
    points_de_vigilance: [
      'Ne pas inventer de prix, de tendance marche, de delai de vente ou de volume d acheteurs.',
      'Preciser que l estimation depend des informations verifiees et du contexte du bien.',
      'Eviter toute promesse de resultat ou formulation pouvant creer une attente non maitrisable.',
      'Adapter le contenu au canal et aux obligations de communication de l agence.'
    ]
  };
}

function buildVisualHomeStagingFallback_(schema, challenge, visualContext, scenarioId) {
  var keep = visualContext.keep && visualContext.keep.length
    ? visualContext.keep
    : ['Volumes existants', 'Ouvertures', 'Elements fixes visibles', 'Perspective generale de la piece'];

  return {
    fallback_type: 'specialized',
    scenario_id: scenarioId || 'home_staging_visual_brief',
    contexte: challenge || 'Preparation d un brief home staging a partir d une photo source.',
    theme: schema.theme,
    angle: schema.angle || 'Brief avant apres',
    objectif_du_visuel: 'Montrer le potentiel d amenagement du bien a partir d une photo source, en aidant un prospect a se projeter sans presenter le resultat comme une photo reelle.',
    description_source: [
      'Photo source a decrire avant toute generation future : type de piece, angle de prise de vue, luminosite, etat general, mobilier present, elements fixes visibles.',
      'Informations a relever : ouvertures, circulation, sol, murs, plafond, radiateurs, prises, cheminee, cuisine ou rangements integres si visibles.',
      'Si la photo ne permet pas de verifier un element, le brief doit le signaler au lieu de l inventer.'
    ],
    intention_de_transformation: [
      'Valoriser les volumes et clarifier l usage de la piece.',
      'Alleger visuellement l espace sans modifier la structure supposee du bien.',
      'Creer une ambiance accueillante et credible pour une annonce immobiliere.',
      'Eviter les transformations lourdes qui pourraient faire croire a un etat reel apres travaux.'
    ],
    style: normalizeText_(visualContext.style) || 'Home staging contemporain chaleureux, sobre, lumineux, avec mobilier realiste et peu encombrant.',
    angle_et_lumiere: [
      'Conserver l angle de la photo source si l objectif est un avant / apres comparable.',
      'Privilegier une lumiere naturelle douce, coherente avec les ouvertures visibles.',
      'Ne pas ajouter de vue, d ouverture ou de source lumineuse non visible si cela change la perception du bien.'
    ],
    elements_a_preserver: keep,
    mentions_de_prudence: [
      'Projection visuelle non contractuelle — image d’intention, non représentative de l’état réel après travaux.',
      'Ne pas supprimer un defaut structurel visible sans validation.',
      'Ne pas ajouter d equipement fixe, de surface, de vue ou de prestation non verifies.',
      'Utiliser le visuel comme support de projection, pas comme preuve de l etat futur du bien.'
    ]
  };
}

function buildUsefulGenericSection_(theme, section, challenge) {
  var base = {
    Estimation: {
      strategie_de_rendez_vous: [
        'Clarifier l objectif du vendeur et le delai souhaite.',
        'Lister les faits connus sur le bien avant de parler prix.',
        'Identifier les points a verifier avant toute recommandation.',
        'Convenir d un prochain point de decision.'
      ],
      trame_orale: 'Je vous propose de separer votre objectif, les faits disponibles et les points a verifier. Cela nous permettra de choisir une strategie defendable sans inventer de donnees.',
      elements_a_preparer: ['Caracteristiques du bien', 'Documents disponibles', 'Historique de commercialisation', 'Questions sur delai, marge et priorites'],
      message_de_suivi: 'Bonjour, merci pour notre echange. Je vous propose de consolider les informations du bien, puis de valider ensemble une strategie claire et mesurable.',
      vigilances: ['Ne pas inventer de prix ou de tendance marche.', 'Faire valider les informations sensibles.', 'Distinguer faits, hypotheses et points a verifier.']
    },
    Visite: {
      synthese: ['Resume des faits observes pendant la visite.', 'Interet exprime ou non exprime.', 'Points de hesitation a clarifier.'],
      objections_identifiees: ['Projection dans le bien', 'Budget global', 'Travaux ou points techniques', 'Timing de decision'],
      relance_adaptee: 'Bonjour, suite a la visite, je voulais savoir si le bien reste une option a creuser ou si certains points vous bloquent. Votre retour me permettra d affiner la suite.',
      taches_a_suivre: ['Noter les objections', 'Envoyer les informations manquantes', 'Qualifier la suite', 'Mettre a jour la recherche'],
      vigilances: ['Ne pas forcer la decision.', 'Ne pas inventer de cout ou de donnee technique.', 'Tracer les retours utiles.']
    },
    Communication: {
      contenu_exploitable: 'Une communication utile doit donner envie d echanger sans promettre de resultat. Presenter le service, le contexte et la prochaine etape.',
      variantes: ['Angle pedagogique', 'Angle projet vendeur'],
      cta: 'Contactez-nous pour un premier echange sans engagement.',
      points_de_vigilance: ['Ne pas promettre de resultat.', 'Ne pas inventer de chiffres.', 'Adapter au canal de publication.']
    },
    Visuel: {
      objectif_du_visuel: 'Preparer une projection d intention a partir d une photo source.',
      description_source: ['Decrire uniquement ce qui est visible.', 'Signaler les elements incertains.'],
      intention_de_transformation: ['Valoriser les volumes.', 'Clarifier l usage.', 'Rester credible.'],
      style: 'Style sobre, lumineux et realiste.',
      angle_et_lumiere: ['Conserver l angle source si possible.', 'Lumiere coherente avec la photo.'],
      elements_a_preserver: ['Volumes', 'Ouvertures', 'Elements fixes'],
      mentions_de_prudence: ['Projection visuelle non contractuelle — image d’intention, non représentative de l’état réel après travaux.']
    }
  };

  if (base[theme] && base[theme][section]) return base[theme][section];
  return [
    'Reformuler le besoin avec les faits fournis : ' + (challenge || 'defi non renseigne'),
    'Identifier les informations manquantes avant de recommander.',
    'Proposer une prochaine action concrete et verifiable.',
    'Rappeler les limites professionnelles sans inventer de donnees.'
  ];
}

function detectScenarioId_(payload) {
  var explicit = normalizeScenarioId_(payload && payload.scenario_id);
  if (explicit) return explicit;

  var theme = normalizeRoutingText_(payload && payload.theme);
  var angle = normalizeRoutingText_(payload && payload.angle);
  var challenge = normalizeRoutingText_(payload && payload.challenge);
  var haystack = [theme, angle, challenge].join(' ');

  if (hasAllRoutingTerms_(haystack, ['vendeur', 'prix']) &&
      containsAnyRouting_(haystack, ['trop haut', 'ecart', 'surestime', 'sur estime', 'au dessus'])) {
    return 'seller_price_gap';
  }

  if (containsAnyRouting_(haystack, ['visite', 'apres visite', 'post visite']) &&
      containsAnyRouting_(haystack, ['acquereur', 'acheteur', 'buyer']) &&
      containsAnyRouting_(haystack, ['hesite', 'relance', 'ne repond plus', 'objection', 'doute'])) {
    return 'buyer_post_visit_followup';
  }

  if (containsAnyRouting_(haystack, ['communication', 'contenu', 'post', 'linkedin', 'facebook']) &&
      containsAnyRouting_(haystack, ['estimation offerte', 'estimation sans engagement', 'estimation'])) {
    return 'estimation_offer_content';
  }

  if (containsAnyRouting_(haystack, ['visuel', 'photo', 'image', 'brief', 'home staging', 'avant apres', 'avant / apres']) &&
      containsAnyRouting_(haystack, ['home staging', 'projection', 'avant apres', 'avant / apres', 'photo'])) {
    return 'home_staging_visual_brief';
  }

  return 'generic';
}

function normalizeScenarioId_(scenarioId) {
  var normalized = normalizeRoutingText_(scenarioId).replace(/\s+/g, '_');
  var aliases = {
    seller_price_gap: 'seller_price_gap',
    vendeur_trop_haut: 'seller_price_gap',
    ecart_de_prix_vendeur: 'seller_price_gap',
    buyer_post_visit_followup: 'buyer_post_visit_followup',
    acquereur_apres_visite: 'buyer_post_visit_followup',
    relance_acquereur_apres_visite: 'buyer_post_visit_followup',
    estimation_offer_content: 'estimation_offer_content',
    contenu_estimation_offerte: 'estimation_offer_content',
    home_staging_visual_brief: 'home_staging_visual_brief',
    brief_home_staging: 'home_staging_visual_brief',
    generic: 'generic'
  };
  return aliases[normalized] || '';
}

function normalizeRoutingText_(value) {
  return normalizeText_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9_\/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAnyRouting_(value, needles) {
  return needles.some(function(needle) {
    return value.indexOf(normalizeRoutingText_(needle)) !== -1;
  });
}

function hasAllRoutingTerms_(value, terms) {
  return terms.every(function(term) {
    return value.indexOf(normalizeRoutingText_(term)) !== -1;
  });
}

function containsAny_(value, needles) {
  return needles.some(function(needle) {
    return value.indexOf(needle.toLowerCase()) !== -1;
  });
}

function runLocalFallbackSmokeTests() {
  var scenarios = [
    {
      name: 'seller_price_gap',
      payload: {
        scenario_id: 'seller_price_gap',
        theme: 'Estimation',
        angle: 'Expliquer l ecart de prix',
        challenge: 'Un vendeur fictif veut afficher son appartement trop haut par rapport aux elements disponibles.'
      }
    },
    {
      name: 'buyer_post_visit_followup',
      payload: {
        scenario_id: 'buyer_post_visit_followup',
        theme: 'Visite',
        angle: 'Relance adaptee',
        challenge: 'Apres une visite fictive, un acquereur hesite et ne repond plus.'
      }
    },
    {
      name: 'estimation_offer_content',
      payload: {
        scenario_id: 'estimation_offer_content',
        theme: 'Communication',
        angle: 'Contenu exploitable',
        challenge: 'Une agence fictive veut publier un contenu immobilier pour annoncer une estimation offerte.'
      }
    },
    {
      name: 'home_staging_visual_brief',
      payload: {
        scenario_id: 'home_staging_visual_brief',
        theme: 'Visuel',
        angle: 'Brief avant / apres',
        challenge: 'Une photo fictive de salon doit servir a preparer une projection de home staging.',
        visualContext: {
          project: 'Home staging',
          style: 'Contemporain chaleureux',
          angle: 'Angle actuel a respecter',
          light: 'Jour doux',
          keep: ['Volumes et ouvertures', 'Vue / environnement']
        }
      }
    }
  ];

  var forbidden = ['à compléter', 'a completer', 'action attendue'];
  var results = scenarios.map(function(testCase) {
    var deliverable = buildLocalDeliverableFallback_(testCase.payload);
    var schema = getDeliverableSchema(testCase.payload.theme, testCase.payload.angle);
    var missingSections = schema.sections.filter(function(section) {
      return !Object.prototype.hasOwnProperty.call(deliverable, section);
    });
    var serialized = normalizeRoutingText_(JSON.stringify(deliverable));
    var forbiddenFound = forbidden.filter(function(term) {
      return serialized.indexOf(normalizeRoutingText_(term)) !== -1;
    });

    return {
      scenario_id: testCase.name,
      ok: missingSections.length === 0 &&
        forbiddenFound.length === 0 &&
        deliverable.fallback_type === 'specialized',
      fallback_type: deliverable.fallback_type,
      missing_sections: missingSections,
      forbidden_terms_found: forbiddenFound
    };
  });

  var report = {
    ok: results.every(function(result) { return result.ok; }),
    results: results
  };

  Logger.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    var failedScenarioIds = results
      .filter(function(result) { return !result.ok; })
      .map(function(result) { return result.scenario_id; });
    throw new Error('Smoke tests fallbacks en echec : ' + failedScenarioIds.join(', '));
  }

  return report;
}

function getDefaultAnglesForTheme_(theme) {
  var angles = {
    Estimation: ['Strategie de rendez-vous', 'Expliquer l ecart de prix', 'Message de suivi vendeur'],
    Prospection: ['Angle d approche', 'Sequence de relance', 'Message pret a copier'],
    Visite: ['Synthese de visite', 'Objections et reponses', 'Relance adaptee'],
    Acquereur: ['Qualification', 'Questions manquantes', 'Priorites et prochaines actions'],
    Communication: ['Contenu exploitable', 'Variantes de message', 'CTA et vigilance'],
    Organisation: ['Checklist', 'Priorites', 'Plan d action'],
    Visuel: ['Brief avant apres', 'Elements a preserver', 'Intention de transformation'],
    Autre: ['Clarifier le besoin', 'Choisir le bon livrable', 'Prochaines actions']
  };
  return angles[theme] || angles.Autre;
}
