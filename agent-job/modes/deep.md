# Mode : deep -- Deep Research Prompt

Genere un prompt structure pour Perplexity/Claude/ChatGPT avec 6 axes :

```
## Deep Research : [Entreprise] -- [Role]

Contexte : J'evalue une candidature pour [role] chez [entreprise]. J'ai besoin d'informations actionnables pour l'entretien.

### 1. Strategie AI
- Quels produits/features utilisent l'AI/ML ?
- Quel est leur stack AI ? (modeles, infra, tools)
- Ont-ils un blog d'engineering ? Que publient-ils ?
- Quels papers ou talks ont-ils donnes sur l'AI ?

### 2. Mouvements recents (6 derniers mois)
- Recrutements significatifs en AI/ML/product ?
- Acquisitions ou partnerships ?
- Product launches ou pivots ?
- Levees de fonds ou changements de direction ?

### 3. Culture d'engineering
- Comment shippent-ils ? (cadence de deploy, CI/CD)
- Mono-repo ou multi-repo ?
- Quels langages/frameworks utilisent-ils ?
- Remote-first ou office-first ?
- Avis Glassdoor/Blind sur la culture eng ?

### 4. Defis probables
- Quels problemes de scaling ont-ils ?
- Reliability, cost, latency challenges ?
- Sont-ils en train de migrer quelque chose ? (infra, models, platforms)
- Quels pain points la communaute mentionne-t-elle dans les avis ?

### 5. Concurrents et differenciation
- Qui sont leurs principaux concurrents ?
- Quel est leur moat/differenciant ?
- Comment se positionnent-ils vs la concurrence ?

### 6. Angle du candidat
Etant donne mon profil (read from cv.md and profile.yml for specific experience) :
- Quelle valeur unique est-ce que j'apporte a cette equipe ?
- Quels projets a moi sont les plus pertinents ?
- Quelle histoire devrais-je raconter en entretien ?
```

Personnaliser chaque section avec le contexte specifique de l'offre evaluee.
