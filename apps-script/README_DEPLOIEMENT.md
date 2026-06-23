# Backend Apps Script - IA Cafe Club Defi

Ce dossier prepare le moteur backend d'une demo IA immobiliere. Il ne modifie pas l'interface `index.html` et ne lance aucun appel OpenAI reel tant que le backend n'est pas valide.

## Fichiers

- `00_Config.gs` : constantes, noms d'onglets, noms de proprietes Apps Script, helpers de securite et d'anonymisation.
- `01_Setup_Sheet.gs` : fonction manuelle `setupIaCafeClubSheet()` pour creer les onglets du Google Sheet.
- `02_Framework_Immo.gs` : referentiel metier, regles de reponse, schemas de livrables et prompts.
- `03_OpenAI_Service.gs` : service d'appel OpenAI cote serveur, desactive par defaut.
- `04_Logs_Couts.gs` : logs d'usage, estimation de cout uniquement si `TARIFS_IA` est renseigne avec source officielle validee.
- `05_WebApp_Routes.gs` : routes Web App separees pour analyse, livrable, brief visuel et logs.
- `README_DEPLOIEMENT.md` : instructions de deploiement.

## Deploiement manuel

1. Creer ou ouvrir le Google Sheet qui servira de backend.
2. Ouvrir Apps Script depuis ce Sheet.
3. Copier les fichiers `.gs` dans le projet Apps Script.
4. Lancer manuellement `setupIaCafeClubSheet()` depuis Apps Script.
5. Verifier la creation des onglets :
   - `CONFIG`
   - `FRAMEWORK_IMMO`
   - `IA_LOG`
   - `TARIFS_IA`
   - `CAS_TEST`
   - `VISUELS_LOG`

## Cle OpenAI

La cle OpenAI doit etre ajoutee plus tard, manuellement, dans les proprietes du projet Apps Script.

Nom de propriete attendu :

```text
OPENAI_API_KEY
```

Aucune cle ne doit etre placee dans :

- `index.html`
- ce dossier
- Git
- le navigateur
- une cellule partagee publiquement

Le modele doit aussi etre configure manuellement plus tard via les proprietes Apps Script, avec une source de validation separee :

```text
OPENAI_MODEL
```

Les appels OpenAI restent desactives tant que cette propriete n'est pas configuree a `true` :

```text
ENABLE_OPENAI_CALLS
```

## Routes prevues

Les routes passent par `doPost(e)` avec un payload JSON contenant `route`.

### Analyse du defi

```json
{
  "route": "analyzeChallenge",
  "theme": "Estimation",
  "challenge": "Un vendeur fictif veut afficher au-dessus des comparables connus."
}
```

### Generation du livrable

```json
{
  "route": "generateDeliverable",
  "theme": "Prospection",
  "angle": "Sequence de relance",
  "challenge": "Une agence fictive veut relancer des proprietaires non repondants."
}
```

### Futur brief visuel

```json
{
  "route": "prepareVisualBrief",
  "theme": "Visuel",
  "angle": "Brief avant apres",
  "challenge": "Une photo fictive de salon doit servir a preparer une projection.",
  "visualContext": {
    "project": "Home staging",
    "style": "Contemporain chaleureux",
    "angle": "Angle actuel a respecter",
    "light": "Jour doux",
    "keep": ["Volumes et ouvertures", "Vue / environnement"]
  }
}
```

### Log futur

```json
{
  "route": "logEvent",
  "module": "demo",
  "theme": "Visite",
  "challenge": "Defi fictif sans donnee client reelle.",
  "angle": "Objections et reponses",
  "response": "Synthese fictive.",
  "validationStatus": "a valider"
}
```

## Tests possibles sans cle API

- Executer `setupIaCafeClubSheet()` dans Apps Script et verifier les onglets.
- Executer `doGet()` pour verifier l'etat du service.
- Appeler `doPost()` avec `analyzeChallenge` : le backend retourne une analyse locale de secours.
- Appeler `doPost()` avec `generateDeliverable` : le backend retourne un squelette de livrable conforme au schema.
- Appeler `doPost()` avec `prepareVisualBrief` : le backend retourne un squelette de brief visuel, sans generation d'image.
- Appeler `logEvent` apres setup pour verifier l'ecriture dans `IA_LOG` ou `VISUELS_LOG`.
- Verifier que `TARIFS_IA` ne contient que les colonnes, sans modele, prix ou cout par defaut.

## Contraintes de securite

- Aucun fichier Li.La.
- Aucune connexion Gmail, Drive, Agenda ou CRM.
- Aucune generation d'image a ce stade.
- Aucune donnee client reelle.
- Aucune invention juridique, reglementaire, de marche ou de prix.
- Aucune cle API dans le front, dans Git ou dans le navigateur.
- Validation humaine avant toute connexion OpenAI ou modification de l'interface.

