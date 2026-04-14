# Mode : batch -- Traitement Massif d'Offres

Deux modes d'utilisation : **conductor --chrome** (navigue les portails en temps reel) ou **standalone** (script pour URLs deja collectees).

## Architecture

```
Claude Conductor (claude --chrome --dangerously-skip-permissions)
  |
  |  Chrome : navigue les portails (sessions connectees)
  |  Lit le DOM direct -- l'utilisateur voit tout en temps reel
  |
  +- Offre 1 : lit JD du DOM + URL
  |    +-> claude -p worker -> report .md + PDF + tracker-line
  |
  +- Offre 2 : click suivant, lit JD + URL
  |    +-> claude -p worker -> report .md + PDF + tracker-line
  |
  +- Fin : merge tracker-additions -> applications.md + resume
```

Chaque worker est un `claude -p` fils avec contexte propre de 200K tokens. Le conductor ne fait qu'orchestrer.

## Fichiers

```
batch/
  batch-input.tsv               # URLs (par conductor ou manuel)
  batch-state.tsv               # Progression (auto-genere, gitignored)
  batch-runner.sh               # Script orchestrateur standalone
  batch-prompt.md               # Prompt template pour workers
  logs/                         # Un log par offre (gitignored)
  tracker-additions/            # Lignes de tracker (gitignored)
```

## Mode A : Conductor --chrome

1. **Lire l'etat** : `batch/batch-state.tsv` -> savoir ce qui a deja ete traite
2. **Naviguer le portail** : Chrome -> URL de recherche
3. **Extraire les URLs** : Lire le DOM des resultats -> extraire la liste d'URLs -> append a `batch-input.tsv`
4. **Pour chaque URL en attente** :
   a. Chrome : click sur l'offre -> lire le texte JD du DOM
   b. Sauvegarder le JD dans `/tmp/batch-jd-{id}.txt`
   c. Calculer le prochain REPORT_NUM sequentiel
   d. Executer via Bash :
      ```bash
      claude -p --dangerously-skip-permissions \
        --append-system-prompt-file batch/batch-prompt.md \
        "Traite cette offre. URL: {url}. JD: /tmp/batch-jd-{id}.txt. Report: {num}. ID: {id}"
      ```
   e. Mettre a jour `batch-state.tsv` (completed/failed + score + report_num)
   f. Log dans `logs/{report_num}-{id}.log`
   g. Chrome : retour arriere -> offre suivante
5. **Pagination** : S'il n'y a plus d'offres -> click "Next" -> repeter
6. **Fin** : Merge `tracker-additions/` -> `applications.md` + resume

## Mode B : Script standalone

```bash
batch/batch-runner.sh [OPTIONS]
```

Options :
- `--dry-run` -- liste les en attente sans executer
- `--retry-failed` -- ne retente que les echouees
- `--start-from N` -- commence a partir de l'ID N
- `--parallel N` -- N workers en parallele
- `--max-retries N` -- tentatives par offre (default : 2)

## Format batch-state.tsv

```
id	url	status	started_at	completed_at	report_num	score	error	retries
1	https://...	completed	2026-...	2026-...	002	4.2	-	0
2	https://...	failed	2026-...	2026-...	-	-	Error msg	1
3	https://...	pending	-	-	-	-	-	0
```

## Reprise apres interruption

- Si ca plante -> re-executer -> lit `batch-state.tsv` -> skip les completees
- Lock file (`batch-runner.pid`) empeche la double execution
- Chaque worker est independant : un echec sur l'offre #47 n'affecte pas les autres

## Workers (claude -p)

Chaque worker recoit `batch-prompt.md` comme system prompt. Il est autonome.

Le worker produit :
1. Report `.md` dans `reports/`
2. PDF dans `output/`
3. Ligne de tracker dans `batch/tracker-additions/{id}.tsv`
4. JSON de resultat sur stdout

## Gestion des erreurs

| Erreur | Recovery |
|--------|----------|
| URL inaccessible | Worker echoue -> conductor marque `failed`, suivant |
| JD derriere un login | Conductor tente de lire le DOM. Si echec -> `failed` |
| Portail change de layout | Conductor raisonne sur le HTML, s'adapte |
| Worker crashe | Conductor marque `failed`, suivant. Retry avec `--retry-failed` |
| Conductor meurt | Re-executer -> lit state -> skip les completees |
| PDF echoue | Report .md est sauvegarde. PDF reste en attente |
