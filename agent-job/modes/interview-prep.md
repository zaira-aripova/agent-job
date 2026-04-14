# Mode: interview-prep -- Intelligence d'entretien specifique a l'entreprise

Quand l'utilisateur demande a se preparer pour un entretien dans une entreprise+poste specifique, ou quand une evaluation obtient 4.0+ et que l'utilisateur met a jour le statut en `Interview`, executer ce mode.

## Entrees

1. **Nom de l'entreprise** et **intitule du poste** (requis)
2. **Rapport d'evaluation** dans `reports/` (si existant) -- lire pour l'archetype, les lacunes, les preuves correspondantes
3. **Banque d'histoires** dans `interview-prep/story-bank.md` -- lire pour les histoires deja preparees
4. **CV** dans `cv.md` + `article-digest.md` -- lire pour les preuves
5. **Profil** dans `config/profile.yml` + `modes/_profile.md` -- lire pour le contexte du candidat

## Etape 1 -- Recherche

Executer ces requetes WebSearch. Extraire des donnees structurees, pas des resumes. Citer les sources pour chaque affirmation.

| Requete | Quoi extraire |
|---------|---------------|
| `"{company} {role} interview questions site:glassdoor.com"` | Questions reellement posees, note de difficulte, note d'experience, calendrier du processus, nombre de tours, ratio offre/refus |
| `"{company} interview process site:teamblind.com"` | Descriptions candides du processus, donnees recentes, details de negociation de remuneration, niveau d'exigence |
| `"{company} {role} interview site:leetcode.com/discuss"` | Problemes de code/technique specifiques, sujets de system design, structure des tours |
| `"{company} engineering blog"` | Stack technique, valeurs, ce qu'ils publient, priorites techniques |
| `"{company} interview process {role}"` (general) | Comble les lacunes des sources ci-dessus -- articles de blog, YouTube, guides de preparation, recits de candidats |

Si l'entreprise est petite ou peu connue et donne peu de resultats, elargir : chercher l'archetype du poste dans des entreprises a un stade similaire, et noter que les informations sont limitees.

**Ne PAS inventer de questions.** Si une source dit "ils ont pose des questions sur les systemes distribues", rapporter cela. Ne pas inventer une question specifique sur les systemes distribues. Quand vous generez des questions probables a partir de l'analyse du JD, les etiqueter clairement comme `[infere du JD]` et non sourcees de candidats.

## Etape 2 -- Vue d'ensemble du processus

```markdown
## Vue d'ensemble du processus
- **Tours :** {N} tours, ~{X} jours de bout en bout
- **Format :** {ex: ecran recruteur -> telephone technique -> exercice a domicile -> sur site (4 tours) -> hiring manager}
- **Difficulte :** {X}/5 (moyenne Glassdoor, N avis)
- **Taux d'experience positive :** {X}%
- **Particularites connues :** {ex: "pair programming au lieu du tableau blanc", "pas de LeetCode, tout pratique", "l'exercice a domicile dure 4 heures"}
- **Sources :** {liens}
```

Si les donnees sont insuffisantes pour un champ, ecrire "inconnu -- pas assez de donnees" plutot que deviner.

## Etape 3 -- Decomposition tour par tour

Pour chaque tour decouvert lors de la recherche :

```markdown
### Tour {N} : {Type}
- **Duree :** {X} min
- **Conduit par :** {pair / manager / N+2 / recruteur -- si connu}
- **Ce qu'ils evaluent :** {competences ou traits specifiques}
- **Questions rapportees :**
  - {question} -- [source: Glassdoor 2026-Q1]
  - {question} -- [source: Blind]
- **Comment se preparer :** {1-2 actions concretes}
```

Si la structure des tours est inconnue, l'indiquer et fournir les meilleures informations disponibles sur les types de tours a attendre en fonction de la taille de l'entreprise, du stade et du niveau du poste.

## Etape 4 -- Questions probables

Categoriser toutes les questions decouvertes et inferees :

### Techniques
Questions sur le system design, le code, l'architecture, les connaissances du domaine.
Pour chaque : la question, la source, et a quoi ressemble une bonne reponse pour ce candidat specifiquement (referencer les preuves du CV).

### Comportementales
Questions sur le leadership, les conflits, la collaboration, les echecs.
Pour chaque : la question, la source, et quelle histoire de `story-bank.md` correspond le mieux.

### Specifiques au poste
Questions liees a la fiche de poste specifique (en fonction de l'archetype).
Pour chaque : la question, pourquoi ils la posent probablement (a quelle exigence du JD elle correspond), et le meilleur angle du candidat.

### Signaux d'alerte sur le parcours
Questions que l'interviewer posera probablement sur les trous, transitions ou elements inhabituels dans le parcours du candidat. Lire `_profile.md` et `cv.md` pour identifier ce qui pourrait susciter des questions.
Pour chaque : la question probable, pourquoi elle se pose, et un cadrage recommande (honnete, specifique, tourne vers l'avenir -- jamais defensif).

## Etape 5 -- Mapping de la banque d'histoires

| # | Question/sujet probable | Meilleure histoire de story-bank.md | Adequation | Lacune ? |
|---|------------------------|-------------------------------------|------------|----------|
| 1 | ... | [Titre de l'histoire] | forte/partielle/aucune | |

- **forte** : l'histoire repond directement a la question
- **partielle** : l'histoire est adjacente, necessite un recadrage
- **aucune** : pas d'histoire existante -- signaler a l'utilisateur

Pour chaque lacune, suggerer : "Vous avez besoin d'une histoire sur {sujet}. Envisagez : {experience specifique du cv.md qui pourrait devenir une histoire STAR+R}."

Si l'utilisateur veut rediger les histoires manquantes, l'aider a construire le format STAR+R et ajouter a `interview-prep/story-bank.md`.

## Etape 6 -- Checklist de preparation technique

Basee sur ce que l'entreprise teste reellement, pas des conseils generiques :

```markdown
- [ ] {sujet} -- pourquoi : "{evidence de la recherche}"
- [ ] {sujet} -- pourquoi : "{leur blog/produit suggere que c'est important}"
- [ ] {sujet} -- pourquoi : "{mentionne dans N/M avis Glassdoor recents}"
```

Prioriser par frequence et pertinence pour le poste. Maximum 10 elements.

## Etape 7 -- Signaux de l'entreprise

Choses a dire, faire et eviter en fonction de la recherche :

- **Valeurs qu'ils evaluent :** les nommer, citer la source (page carrieres, blog, avis Glassdoor)
- **Vocabulaire a utiliser :** termes que l'entreprise utilise en interne -- montre le travail de preparation (ex: Stripe dit "increase the GDP of the internet", Anthropic dit "safety" pas "alignment")
- **Choses a eviter :** anti-patterns specifiques signales dans les avis d'entretien
- **Questions a leur poser :** 2-3 questions pertinentes qui demontrent que vous avez fait vos recherches sur l'entreprise, liees a des actualites recentes ou articles de blog decouverts a l'Etape 1

## Sortie

Sauvegarder le rapport complet dans `interview-prep/{company-slug}-{role-slug}.md` avec cet en-tete :

```markdown
# Interview Intel: {Company} -- {Role}

**Rapport :** {lien vers le rapport d'evaluation si existant, ou "N/A"}
**Recherche :** {YYYY-MM-DD}
**Sources :** {N} avis Glassdoor, {N} posts Blind, {N} autres
```

## Apres la recherche

Apres avoir livre le rapport :

1. Demander a l'utilisateur s'il veut rediger des histoires pour les lacunes trouvees a l'Etape 5
2. S'il a une date d'entretien planifiee, le noter : "Votre entretien est dans {X} jours. Voulez-vous que je planifie un rappel pour revoir cette preparation ?"
3. Suggerer de lancer le mode `deep` si la recherche sur l'entreprise de l'Etape 1 etait limitee -- le mode deep couvre la strategie, la culture et le paysage concurrentiel plus en profondeur

## Regles

- **JAMAIS inventer des questions d'entretien et les attribuer a des sources.** Les questions inferees doivent etre etiquetees `[infere du JD]`.
- **JAMAIS fabriquer des notes ou statistiques Glassdoor.** Si les donnees ne sont pas la, le dire.
- **Tout citer.** Chaque question, chaque statistique, chaque affirmation recoit une source ou une etiquette `[infere]`.
- Generer dans la langue du JD (EN par defaut).
- Etre direct. C'est un document de travail de preparation, pas un discours de motivation.
