# Mode : scan -- Portal Scanner (Decouverte d'Offres)

Scanne les portails d'emploi configures, filtre par pertinence de titre, et ajoute les nouvelles offres au pipeline pour evaluation ulterieure.

## Execution recommandee

Executer comme subagent pour ne pas consommer le contexte du main :

```
Agent(
    subagent_type="general-purpose",
    prompt="[contenu de ce fichier + donnees specifiques]",
    run_in_background=True
)
```

## Configuration

Lire `portals.yml` qui contient :
- `search_queries` : Liste de queries WebSearch avec des filtres `site:` par portail (decouverte large)
- `tracked_companies` : Entreprises specifiques avec `careers_url` pour navigation directe
- `title_filter` : Keywords positive/negative/seniority_boost pour le filtrage des titres

## Strategie de decouverte (3 niveaux)

### Niveau 1 -- Playwright direct (PRINCIPAL)

**Pour chaque entreprise dans `tracked_companies` :** Naviguer vers sa `careers_url` avec Playwright (`browser_navigate` + `browser_snapshot`), lire TOUS les job listings visibles, et extraire titre + URL de chacun. C'est la methode la plus fiable car :
- Voit la page en temps reel (pas de resultats caches de Google)
- Fonctionne avec les SPAs (Ashby, Lever, Workday)
- Detecte les offres nouvelles instantanement
- Ne depend pas de l'indexation de Google

**Chaque entreprise DOIT avoir `careers_url` dans portals.yml.** Si elle ne l'a pas, la chercher une fois, la sauvegarder, et l'utiliser pour les scans futurs.

### Niveau 2 -- Greenhouse API (COMPLEMENTAIRE)

Pour les entreprises avec Greenhouse, l'API JSON (`boards-api.greenhouse.io/v1/boards/{slug}/jobs`) renvoie des donnees structurees propres. Utiliser comme complement rapide du Niveau 1 -- c'est plus rapide que Playwright mais ne fonctionne qu'avec Greenhouse.

### Niveau 3 -- WebSearch queries (DECOUVERTE LARGE)

Les `search_queries` avec des filtres `site:` couvrent les portails de maniere transversale (tous les Ashby, tous les Greenhouse, etc.). Utile pour decouvrir des entreprises NOUVELLES qui ne sont pas encore dans `tracked_companies`, mais les resultats peuvent etre obsoletes.

**Priorite d'execution :**
1. Niveau 1 : Playwright -> toutes les `tracked_companies` avec `careers_url`
2. Niveau 2 : API -> toutes les `tracked_companies` avec `api:`
3. Niveau 3 : WebSearch -> tous les `search_queries` avec `enabled: true`

Les niveaux sont additifs -- ils s'executent tous, les resultats sont melanges et dedupliques.

## Workflow

1. **Lire la configuration** : `portals.yml`
2. **Lire l'historique** : `data/scan-history.tsv` -> URLs deja vues
3. **Lire les sources de dedup** : `data/applications.md` + `data/pipeline.md`

4. **Niveau 1 -- Playwright scan** (parallele en batches de 3-5) :
   Pour chaque entreprise dans `tracked_companies` avec `enabled: true` et `careers_url` definie :
   a. `browser_navigate` vers la `careers_url`
   b. `browser_snapshot` pour lire tous les job listings
   c. Si la page a des filtres/departements, naviguer les sections pertinentes
   d. Pour chaque job listing extraire : `{title, url, company}`
   e. Si la page pagine les resultats, naviguer les pages supplementaires
   f. Accumuler dans la liste de candidats
   g. Si `careers_url` echoue (404, redirect), essayer `scan_query` comme fallback et noter pour mettre a jour l'URL

5. **Niveau 2 -- Greenhouse APIs** (parallele) :
   Pour chaque entreprise dans `tracked_companies` avec `api:` definie et `enabled: true` :
   a. WebFetch de l'URL de l'API -> JSON avec la liste des jobs
   b. Pour chaque job extraire : `{title, url, company}`
   c. Accumuler dans la liste de candidats (dedup avec Niveau 1)

6. **Niveau 3 -- WebSearch queries** (parallele si possible) :
   Pour chaque query dans `search_queries` avec `enabled: true` :
   a. Executer WebSearch avec le `query` defini
   b. De chaque resultat extraire : `{title, url, company}`
      - **title** : du titre du resultat (avant le " @ " ou " | ")
      - **url** : URL du resultat
      - **company** : apres le " @ " dans le titre, ou extraire du domaine/path
   c. Accumuler dans la liste de candidats (dedup avec Niveau 1+2)

6. **Filtrer par titre** en utilisant `title_filter` de `portals.yml` :
   - Au moins 1 keyword de `positive` doit apparaitre dans le titre (case-insensitive)
   - 0 keywords de `negative` doivent apparaitre
   - Les keywords `seniority_boost` donnent la priorite mais ne sont pas obligatoires

7. **Dedupliquer** contre 3 sources :
   - `scan-history.tsv` -> URL exacte deja vue
   - `applications.md` -> entreprise + role normalise deja evalue
   - `pipeline.md` -> URL exacte deja dans les en attente ou traitees

7.5. **Verifier la vivacite des resultats de WebSearch (Niveau 3)** -- AVANT d'ajouter au pipeline :

   Les resultats de WebSearch peuvent etre obsoletes (Google met en cache les resultats pendant des semaines ou des mois). Pour eviter d'evaluer des offres expirees, verifier avec Playwright chaque URL nouvelle provenant du Niveau 3. Les Niveaux 1 et 2 sont inheremment en temps reel et ne necessitent pas cette verification.

   Pour chaque URL nouvelle du Niveau 3 (sequentiel -- JAMAIS Playwright en parallele) :
   a. `browser_navigate` vers l'URL
   b. `browser_snapshot` pour lire le contenu
   c. Classifier :
      - **Active** : titre du poste visible + description du role + controle visible Apply/Submit/Solicitar dans le contenu principal. Ne pas compter le texte generique de header/navbar/footer.
      - **Expiree** (l'un de ces signaux) :
        - URL finale contient `?error=true` (Greenhouse redirige ainsi quand l'offre est fermee)
        - Page contient : "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found"
        - Seuls navbar et footer visibles, sans contenu JD (contenu < ~300 chars)
   d. Si expiree : enregistrer dans `scan-history.tsv` avec status `skipped_expired` et ecarter
   e. Si active : continuer a l'etape 8

   **Ne pas interrompre le scan entier si une URL echoue.** Si `browser_navigate` donne une erreur (timeout, 403, etc.), marquer comme `skipped_expired` et continuer avec la suivante.

8. **Pour chaque offre nouvelle verifiee qui passe les filtres** :
   a. Ajouter a `pipeline.md` section "En attente" : `- [ ] {url} | {company} | {title}`
   b. Enregistrer dans `scan-history.tsv` : `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

9. **Offres filtrees par titre** : enregistrer dans `scan-history.tsv` avec status `skipped_title`
10. **Offres dupliquees** : enregistrer avec status `skipped_dup`
11. **Offres expirees (Niveau 3)** : enregistrer avec status `skipped_expired`

## Extraction de titre et entreprise des resultats WebSearch

Les resultats de WebSearch arrivent au format : `"Job Title @ Company"` ou `"Job Title | Company"` ou `"Job Title -- Company"`.

Patrons d'extraction par portail :
- **Ashby** : `"Senior AI PM (Remote) @ EverAI"` -> title : `Senior AI PM`, company : `EverAI`
- **Greenhouse** : `"AI Engineer at Anthropic"` -> title : `AI Engineer`, company : `Anthropic`
- **Lever** : `"Product Manager - AI @ Temporal"` -> title : `Product Manager - AI`, company : `Temporal`

Regex generique : `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## URLs privees

Si une URL non accessible publiquement est trouvee :
1. Sauvegarder le JD dans `jds/{company}-{role-slug}.md`
2. Ajouter a pipeline.md comme : `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan History

`data/scan-history.tsv` trace TOUTES les URLs vues :

```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby — AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby — AI PM	SA AI	OldCo	skipped_dup
https://...	2026-02-10	WebSearch — AI PM	PM AI	ClosedCo	skipped_expired
```

## Resume de sortie

```
Portal Scan -- {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries executes : N
Offres trouvees : N total
Filtrees par titre : N pertinentes
Dupliquees : N (deja evaluees ou dans le pipeline)
Expirees ecartees : N (liens morts, Niveau 3)
Nouvelles ajoutees a pipeline.md : N

  + {company} | {title} | {query_name}
  ...

-> Executer /agent-job pipeline pour evaluer les nouvelles offres.
```

## Gestion des careers_url

Chaque entreprise dans `tracked_companies` doit avoir `careers_url` -- l'URL directe vers sa page d'offres. Cela evite de la chercher a chaque fois.

**Patrons connus par plateforme :**
- **Ashby :** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse :** `https://job-boards.greenhouse.io/{slug}` ou `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever :** `https://jobs.lever.co/{slug}`
- **Custom :** L'URL propre de l'entreprise (ex : `https://openai.com/careers`)

**Si `careers_url` n'existe pas** pour une entreprise :
1. Essayer le patron de sa plateforme connue
2. Si ca echoue, faire un WebSearch rapide : `"{company}" careers jobs`
3. Naviguer avec Playwright pour confirmer que ca fonctionne
4. **Sauvegarder l'URL trouvee dans portals.yml** pour les scans futurs

**Si `careers_url` renvoie un 404 ou un redirect :**
1. Noter dans le resume de sortie
2. Essayer scan_query comme fallback
3. Marquer pour mise a jour manuelle

## Maintenance du portals.yml

- **TOUJOURS sauvegarder `careers_url`** quand on ajoute une nouvelle entreprise
- Ajouter de nouveaux queries selon la decouverte de portails ou roles interessants
- Desactiver les queries avec `enabled: false` s'ils generent trop de bruit
- Ajuster les keywords de filtrage selon l'evolution des roles cibles
- Ajouter des entreprises a `tracked_companies` quand on veut les suivre de pres
- Verifier `careers_url` periodiquement -- les entreprises changent de plateforme ATS
