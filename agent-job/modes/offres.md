# Mode : offres -- Comparaison Multi-Offre

Matrice de scoring a 10 dimensions ponderees :

| Dimension | Poids | Criteres 1-5 |
|-----------|-------|---------------|
| Alignement North Star | 25% | 5=role cible exact, 1=non lie |
| Match CV | 15% | 5=90%+ match, 1=<40% match |
| Niveau (senior+) | 15% | 5=staff+, 4=senior, 3=mid-senior, 2=mid, 1=junior |
| Comp estimee | 10% | 5=top quartile, 1=below market |
| Trajectoire de croissance | 10% | 5=clear path to next level, 1=dead end |
| Qualite remote | 5% | 5=full remote async, 1=onsite only |
| Reputation entreprise | 5% | 5=top employer, 1=red flags |
| Modernite tech stack | 5% | 5=cutting edge AI/ML, 1=legacy |
| Rapidite vers offre | 5% | 5=fast process, 1=6+ months |
| Signaux culturels | 5% | 5=builder culture, 1=bureaucratic |

Pour chaque offre : score sur chaque dimension, score pondere total.
Classement final + recommandation avec considerations de time-to-offer.

Demander a l'utilisateur les offres si elles ne sont pas en contexte. Peut etre du texte, des URLs, ou des references a des offres deja evaluees dans le tracker.
