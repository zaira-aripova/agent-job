# Mode: patterns -- Detecteur de schemas de rejet

## Objectif

Analyser toutes les candidatures suivies pour trouver des schemas dans les resultats et faire remonter des insights actionnables. Identifie ce qui fonctionne (archetypes, politiques de teletravail, plages de score) et ce qui fait perdre du temps (postes geo-restreints, decalages de stack, candidatures a faible score).

## Entrees

- `data/applications.md` -- Tracker de candidatures
- `reports/` -- Rapports d'evaluation individuels
- `config/profile.yml` -- Profil utilisateur (pour le contexte des recommandations)
- `modes/_profile.md` -- Archetypes et cadrage utilisateur
- `portals.yml` -- Configuration des portails (pour les recommandations de mise a jour des filtres)

## Seuil minimum

Avant de lancer l'analyse, verifier : est-ce que `data/applications.md` contient au moins 5 entrees avec un statut au-dela de "Evaluated" (c'est-a-dire Applied, Responded, Interview, Offer, Rejected, Discarded, SKIP) ?

Si non, dire a l'utilisateur :
> "Pas assez de donnees pour le moment -- {N}/5 candidatures ont progresse au-dela de l'evaluation. Continuez a postuler et revenez quand vous aurez plus de resultats a analyser."

Sortir proprement.

## Etape 1 -- Executer le script d'analyse

Executer :

```bash
node analyze-patterns.mjs
```

Analyser la sortie JSON. Elle contient :

| Cle | Contenu |
|-----|---------|
| `metadata` | Total des entrees, plage de dates, date d'analyse, compteurs par resultat |
| `funnel` | Comptage par etape de statut (evaluated, applied, interview, offer, etc.) |
| `scoreComparison` | Moyenne/min/max du score par groupe de resultat (positive, negative, self_filtered, pending) |
| `archetypeBreakdown` | Par archetype : total, positive, negative, self_filtered, taux de conversion |
| `blockerAnalysis` | Bloqueurs durs les plus frequents : geo-restriction, stack-mismatch, seniority, onsite |
| `remotePolicy` | Par categorie de politique : total, positive, negative, taux de conversion |
| `companySizeBreakdown` | Par categorie de taille : startup, scaleup, enterprise |
| `scoreThreshold` | Score minimum recommande + raisonnement |
| `techStackGaps` | Lacunes techniques les plus frequentes dans les resultats negatifs |
| `recommendations` | Top 5 des actions avec raisonnement et niveau d'impact |

Si le script retourne `error`, afficher le message d'erreur et sortir.

## Etape 2 -- Generer le rapport

Ecrire le rapport dans `reports/pattern-analysis-{YYYY-MM-DD}.md`.

### Structure du rapport

```markdown
# Analyse des schemas -- {YYYY-MM-DD}

**Candidatures analysees :** {total}
**Plage de dates :** {de} a {a}
**Resultats :** {positive} positifs, {negative} negatifs, {self_filtered} auto-filtres, {pending} en attente

---

## Entonnoir de conversion

Afficher chaque statut avec le comptage et le pourcentage du total. Utiliser un tableau simple :

| Etape | Comptage | % |
|-------|----------|---|
| Evaluated | X | X% |
| Applied | X | X% |
| ... | | |

## Score vs Resultat

| Resultat | Score moyen | Min | Max | Comptage |
|----------|-------------|-----|-----|----------|
| Positif | X.X/5 | X.X | X.X | X |
| Negatif | ... | | | |
| Auto-filtre | ... | | | |
| En attente | ... | | | |

## Performance par archetype

Tableau avec chaque archetype, total des candidatures, resultats positifs, taux de conversion.
Mettre en evidence l'archetype le plus performant et le moins performant.

## Principaux bloqueurs

Tableau de frequence des bloqueurs durs recurrents (geo-restriction, stack-mismatch, etc.).
Noter le pourcentage de toutes les candidatures affectees par chacun.

## Schemas de politique de teletravail

Tableau montrant le taux de conversion par categorie de politique de teletravail (global, regional, geo-restreint, hybride/presentiel).

## Lacunes de stack technique

Liste des competences manquantes les plus courantes dans les resultats negatifs/auto-filtres avec la frequence.

## Seuil de score recommande

Indiquer le score minimum base sur les donnees et le raisonnement.

## Recommandations

Numeroter les principales recommandations (depuis la sortie du script). Pour chaque :
1. **[IMPACT]** Action a entreprendre
   Raisonnement derriere la recommandation.
```

## Etape 3 -- Presenter le resume

Montrer a l'utilisateur une version condensee avec :
1. Resume statistique en une ligne (X candidatures, Y% postulees, Z% resultat positif)
2. Top 3 des decouvertes (schemas les plus impactants)
3. Lien vers le rapport complet

Exemple :
> **Analyse des schemas terminee** (24 candidatures, 7-8 avr.)
>
> Decouvertes cles :
> - Les postes geo-restreints ont 0% de conversion (7 sur 24) -- arreter d'evaluer les offres US/Canada-only
> - Les postes remote regionaux/globaux convertissent a 57-67% -- c'est votre creneau ideal
> - Aucun resultat positif en dessous de 4.2/5 -- envisagez cela comme votre seuil plancher
>
> Rapport complet : `reports/pattern-analysis-2026-04-08.md`

## Etape 4 -- Proposer d'appliquer les recommandations

Demander a l'utilisateur s'il veut agir sur les recommandations :

> "Voulez-vous que j'applique certaines de ces recommandations ? Je peux :
> - Mettre a jour `portals.yml` pour filtrer les postes geo-restreints
> - Definir un seuil de score dans `_profile.md` pour la generation PDF
> - Ajuster le ciblage des archetypes en fonction de ce qui convertit
>
> Dites-moi lesquelles, ou 'toutes' pour tout appliquer."

Si l'utilisateur accepte :
- Pour les changements de filtres de portails : editer `portals.yml`
- Pour les changements de profil/archetype : editer `modes/_profile.md` (JAMAIS `_shared.md`)
- Pour le seuil de score : ajouter dans `config/profile.yml` sous une cle `patterns`

## Classification des resultats

Pour reference, les resultats sont classes ainsi :

| Statut | Resultat |
|--------|----------|
| Interview, Offer, Responded, Applied | **Positif** (effort investi ou traction obtenue) |
| Rejected, Discarded | **Negatif** (l'entreprise a dit non ou l'offre est fermee) |
| SKIP, NO APLICAR | **Auto-filtre** (l'utilisateur a decide de ne pas postuler) |
| Evaluated | **En attente** (aucune action prise encore) |
