# Mantra Career Agent

Agent de recherche d'emploi propulse par Claude Code.

Il scanne les portails, evalue les offres, et prepare 100% de la candidature : CV adapte, lettre, contacts, messages, preparation d'entretien.

## Installation

1. Installer [Node.js](https://nodejs.org) (v18+)
2. Installer [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
3. Telecharger ce dossier
4. Lancer dans le dossier :

```
npm install
npx playwright install chromium
```

5. Ouvrir Claude Code, selectionner ce dossier
6. L'agent vous guide pour la configuration

## Documents necessaires

- **1 CV** au format .docx (ou colle directement dans Claude Code)
- **1 fichier complet** avec : ambition, seniorite, secteur, salaire, parcours detaille, resultats chiffres, KPI, projets, deal-breakers

Plus vous donnez de details, plus l'agent sera precis.

## Commandes

```
/agent-job              -> Menu principal
/agent-job scan         -> Scanner les portails
/agent-job pdf          -> Generer un CV adapte
/agent-job tracker      -> Voir le suivi des candidatures
/agent-job apply        -> Remplir un formulaire de candidature
/agent-job deep         -> Recherche approfondie sur une entreprise
```

Ou collez directement une URL d'offre : l'agent l'evalue automatiquement.

## Problemes connus

### Generation de PDF

Le CV PDF genere par l'agent utilise un template HTML par defaut (Space Grotesk + DM Sans, gradient cyan/violet). Il ne reprend **pas** le design de votre CV original. Si vous voulez conserver votre mise en page :

- **Option Canva** : connectez le MCP Canva dans Claude Code, renseignez votre `canva_resume_design_id` dans `config/profile.yml`, et l'agent modifiera directement votre design Canva
- **Option manuelle** : utilisez le PDF genere comme brouillon de reference, puis reportez les modifications dans votre vrai CV (Word, Canva, etc.)

### Caracteres speciaux dans les PDF

La police EB Garamond utilisee pour les dossiers PDF ne supporte pas certains caracteres Unicode rares (espaces fines insecables, etc.). Si vous voyez des caracteres manquants dans un PDF, signalez-le.

### Playwright / Chromium

Certaines fonctions (scan de portails, verification d'offres, generation PDF via Playwright) necessitent Chromium. Si vous avez une erreur "browser not found" :

```
npx playwright install chromium
```

Sur certains systemes (Linux sans interface graphique), des dependances systeme supplementaires peuvent etre necessaires. Consultez la [doc Playwright](https://playwright.dev/docs/intro).

### Connexion Anthropic

Au premier lancement, Claude Code demande de se connecter a un compte Anthropic. Si la connexion echoue, verifiez votre acces internet et que votre compte Anthropic est actif.

### Scanner de portails

Le scanner utilise Playwright pour naviguer sur les sites carriere des entreprises. Certains sites peuvent bloquer la navigation automatisee (captcha, rate limiting). Dans ce cas, l'offre est simplement ignoree et vous pouvez l'evaluer manuellement en collant l'URL.

### Performances

La premiere evaluation est lente (l'agent charge le contexte). Les suivantes sont plus rapides. Le batch processing (`/agent-job batch`) permet de traiter plusieurs offres en parallele.

## License

MIT
