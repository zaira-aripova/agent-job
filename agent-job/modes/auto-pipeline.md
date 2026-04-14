# Mode : auto-pipeline -- Pipeline Complet Automatique

Quand l'utilisateur colle un JD (texte ou URL) sans sous-commande explicite, executer TOUT le pipeline en sequence :

## Etape 0 -- Extraire le JD

Si l'input est une **URL** (pas du texte de JD colle), suivre cette strategie pour extraire le contenu :

**Ordre de priorite :**

1. **Playwright (prefere) :** La plupart des portails d'emploi (Lever, Ashby, Greenhouse, Workday) sont des SPAs. Utiliser `browser_navigate` + `browser_snapshot` pour rendre et lire le JD.
2. **WebFetch (fallback) :** Pour les pages statiques (ZipRecruiter, WeLoveProduct, pages carrieres d'entreprises).
3. **WebSearch (dernier recours) :** Chercher le titre du role + entreprise sur des portails secondaires qui indexent le JD en HTML statique.

**Si aucune methode ne fonctionne :** Demander au candidat de coller le JD manuellement ou de partager un screenshot.

**Si l'input est du texte de JD** (pas une URL) : utiliser directement, pas besoin de fetch.

## Etape 1 -- Evaluation A-G
Executer exactement comme le mode `offre` (lire `modes/offre.md` pour tous les blocs A-F + Block G Posting Legitimacy).

## Etape 2 -- Sauvegarder le Report .md
Sauvegarder l'evaluation complete dans `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` (voir le format dans `modes/offre.md`).
Include Block G in the saved report. Add `**Legitimacy:** {tier}` to the report header.

## Etape 3 -- Generer le PDF
Executer le pipeline complet de `pdf` (lire `modes/pdf.md`).

## Etape 4 -- Draft Application Answers (seulement si score >= 4.5)

Si le score final est >= 4.5, generer un brouillon de reponses pour le formulaire de candidature :

1. **Extraire les questions du formulaire** : Utiliser Playwright pour naviguer vers le formulaire et faire un snapshot. Si les questions ne peuvent pas etre extraites, utiliser les questions generiques.
2. **Generer les reponses** en suivant le ton (voir ci-dessous).
3. **Sauvegarder dans le report** comme section `## H) Draft Application Answers`.

### Questions generiques (utiliser si les questions ne peuvent pas etre extraites du formulaire)

- Why are you interested in this role?
- Why do you want to work at [Company]?
- Tell us about a relevant project or achievement
- What makes you a good fit for this position?
- How did you hear about this role?

### Ton pour les Form Answers

**Position : "I'm choosing you."** le candidat a des options et choisit cette entreprise pour des raisons concretes.

**Regles de ton :**
- **Confiant sans arrogance** : "I've spent the past year building production AI agent systems — your role is where I want to apply that experience next"
- **Selectif sans pretention** : "I've been intentional about finding a team where I can contribute meaningfully from day one"
- **Specifique et concret** : Toujours referencer quelque chose de REEL du JD ou de l'entreprise, et quelque chose de REEL de l'experience du candidat
- **Direct, sans fluff** : 2-4 phrases par reponse. Pas de "I'm passionate about..." ni "I would love the opportunity to..."
- **Le hook c'est la preuve, pas l'affirmation** : Au lieu de "I'm great at X", dire "I built X that does Y"

**Framework par question :**
- **Why this role?** -> "Your [specific thing] maps directly to [specific thing I built]."
- **Why this company?** -> Mentionner quelque chose de concret sur l'entreprise. "I've been using [product] for [time/purpose]."
- **Relevant experience?** -> Un proof point quantifie. "Built [X] that [metric]. Sold the company in 2025."
- **Good fit?** -> "I sit at the intersection of [A] and [B], which is exactly where this role lives."
- **How did you hear?** -> Honnete : "Found through [portal/scan], evaluated against my criteria, and it scored highest."

**Langue** : Toujours dans la langue du JD (EN par defaut). Appliquer `/tech-translate`.

## Etape 5 -- Mettre a jour le Tracker
Enregistrer dans `data/applications.md` avec toutes les colonnes incluant Report et PDF en ✅.

**Si une etape echoue**, continuer avec les suivantes et marquer l'etape echouee comme en attente dans le tracker.
