# Mode: followup -- Suivi de cadence des relances

## Objectif

Suivre la cadence de relance des candidatures actives. Signaler les relances en retard, extraire les contacts depuis les notes, et generer des brouillons de relance (email/LinkedIn) adaptes en utilisant le contexte du rapport.

## Entrees

- `data/applications.md` -- Tracker de candidatures
- `data/follow-ups.md` -- Historique des relances (cree a la premiere utilisation)
- `reports/` -- Rapports d'evaluation (pour le contexte des brouillons)
- `config/profile.yml` -- Profil utilisateur (nom, identite)
- `cv.md` -- CV pour les preuves dans les brouillons

## Etape 1 -- Executer le script de cadence

Executer :

```bash
node followup-cadence.mjs
```

Analyser la sortie JSON. Elle contient :

| Cle | Contenu |
|-----|---------|
| `metadata` | Date d'analyse, total suivi, nombre actionnable, compteurs en retard/urgent/froid/en attente |
| `entries` | Par candidature : entreprise, poste, statut, jours depuis la candidature, nombre de relances, urgence, prochaine date de relance, contacts extraits, chemin du rapport |
| `cadenceConfig` | Regles de cadence (applied: 7 jours, responded: 3 jours, interview: 1 jour) |

S'il n'y a pas d'entrees actionnables, dire a l'utilisateur :
> "Aucune candidature active a relancer. Postulez d'abord a quelques postes avec `/agent-job` et revenez quand elles seront en cours."

## Etape 2 -- Afficher le tableau de bord

Afficher un tableau de bord de cadence trie par urgence (urgent > en retard > en attente > froid) :

```
Follow-up Cadence Dashboard -- {date}
{N} candidatures suivies, {N} actionnables

| # | Entreprise | Poste | Statut | Jours | Relances | Prochaine | Urgence | Contact |
```

Utiliser des indicateurs visuels :
- **URGENT** -- repondre sous 24 heures (l'entreprise a repondu)
- **EN RETARD** -- la relance est en retard
- **en attente (X jours)** -- dans les temps, relance planifiee
- **FROID** -- 2+ relances envoyees, suggerer de cloturer

## Etape 3 -- Generer les brouillons de relance

Pour chaque entree **en retard** ou **urgente** uniquement :

1. Lire le rapport lie (`reportPath` depuis le JSON) pour le contexte de l'entreprise
2. Lire `cv.md` pour les preuves
3. Lire `config/profile.yml` pour le nom et l'identite du candidat

### Framework de relance par email (premiere relance, followupCount == 0)

Generer un email de 3-4 phrases :

1. **Phrase 1 :** Faire reference au poste specifique + quand vous avez postule. Etre precis -- mentionner le nom de l'entreprise et l'intitule du poste.
2. **Phrase 2 :** Un argument concret de valeur ajoutee issu du Block B du rapport ou une preuve du cv.md. Quantifier si possible.
3. **Phrase 3 :** Demande douce + disponibilite. Proposer un creneau specifique ("cette semaine" ou "mardi prochain").
4. **Phrase 4 (optionnel) :** Breve mention d'un projet ou accomplissement recent pertinent.

**Regles :**
- Professionnel mais chaleureux, PAS desespere
- **JAMAIS** utiliser "just checking in", "just following up", "touching base", ou "circling back"
- Commencer par la valeur, pas par la demande
- Faire reference a quelque chose de specifique a CETTE entreprise (depuis le rapport Block A)
- Rester sous 150 mots
- Inclure une ligne d'objet
- Utiliser le nom du candidat depuis `config/profile.yml`

**Exemple de ton :**
> Subject: Re: Senior PHP/Laravel Developer -- IxDF
>
> Hi [contact name or "team"],
>
> I submitted my application for the Senior PHP/Laravel Developer role on April 7th. I wanted to share that my production Laravel app (Barbeiro.app -- 120 models, 315 API endpoints, full test suite) closely mirrors the TDD-driven culture described in the posting.
>
> I'd love to discuss how my 15 years of PHP experience and hands-on AI tooling workflow could contribute to IxDF's platform. Would any time this week work for a brief conversation?
>
> Best,
> [Name]

### Relance LinkedIn (si aucun contact email trouve)

Reutiliser le framework contact : 3 phrases, 300 caracteres max.
- Accroche specifique a l'entreprise -> preuve -> demande douce
- Suggerer a l'utilisateur de lancer `/agent-job contact {company}` pour trouver la bonne personne d'abord

### Deuxieme relance (followupCount == 1)

Plus courte que la premiere (2-3 phrases). Adopter un **nouvel angle** :
- Partager un insight pertinent, un article, ou une mise a jour de projet
- Ne pas repeter le contenu de la premiere relance
- Toujours faire reference au poste specifiquement

### Candidature froide (followupCount >= 2)

Ne PAS generer une autre relance. A la place, suggerer :
> "Cette candidature a eu {N} relances sans reponse. Envisagez :
> - Mettre a jour le statut en `Discarded` si le poste semble pourvu
> - Essayer un contact different via `/agent-job contact`
> - Garder en statut `Applied` mais deprioritiser"

## Etape 4 -- Presenter les brouillons

Pour chaque brouillon, afficher :

```
## Relance : {Company} -- {Role} (#{num})

**A :** {email ou "Pas de contact trouve -- lancez `/agent-job contact` d'abord"}
**Objet :** {ligne d'objet}
**Jours depuis la candidature :** {N}
**Relances envoyees :** {N}
**Canal :** Email / LinkedIn

{texte du brouillon}
```

## Etape 5 -- Enregistrer les relances

Apres que l'utilisateur a confirme avoir envoye une relance, l'enregistrer :

1. Si `data/follow-ups.md` n'existe pas, le creer :
   ```markdown
   # Historique des relances

   | # | App# | Date | Entreprise | Poste | Canal | Contact | Notes |
   |---|------|------|------------|-------|-------|---------|-------|
   ```

2. Ajouter une ligne avec :
   - `#` = prochain numero sequentiel dans la table des relances
   - `App#` = numero de candidature depuis le tracker
   - `Date` = date du jour
   - `Entreprise` = nom de l'entreprise
   - `Poste` = intitule du poste
   - `Canal` = Email / LinkedIn / Autre
   - `Contact` = a qui c'a ete envoye
   - `Notes` = note breve (ex: "Premiere relance, reference Barbeiro.app")

3. Optionnellement mettre a jour la colonne Notes dans `data/applications.md` avec "Relance {N} envoyee {YYYY-MM-DD}"

**IMPORTANT :** N'enregistrer que les relances que l'utilisateur confirme avoir reellement envoyees. Ne jamais enregistrer un brouillon comme envoye.

## Etape 6 -- Resume

Apres avoir montre tous les brouillons, resumer :

> **Tableau de bord des relances** ({date})
> - {N} candidatures suivies
> - {N} en retard -- brouillons generes ci-dessus
> - {N} urgentes -- repondre aujourd'hui
> - {N} en attente -- prochaines dates de relance affichees
> - {N} froides -- envisager de cloturer
>
> Consultez les brouillons ci-dessus et dites-moi lesquels vous avez envoyes pour que je les enregistre.

## Reference des regles de cadence

| Statut | Premiere relance | Suivantes | Tentatives max |
|--------|-----------------|-----------|----------------|
| Applied | 7 jours apres la candidature | Tous les 7 jours | 2 (puis marquer froid) |
| Responded | 1 jour (reponse urgente) | Tous les 3 jours | Pas de limite |
| Interview | 1 jour apres (remerciement) | Tous les 3 jours | Pas de limite |

Ces valeurs par defaut peuvent etre modifiees via `node followup-cadence.mjs --applied-days N`.
