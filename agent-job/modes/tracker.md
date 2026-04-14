# Mode : tracker -- Tracker de Candidatures

Lire et afficher `data/applications.md`.

**Format du tracker :**
```markdown
| # | Date | Entreprise | Role | Score | Statut | PDF | Report |
```

Statuts possibles : `Evaluee` → `Postule` → `Repondu` → `Contact` → `Entretien` → `Offre` / `Rejetee` / `Ecartee` / `NE PAS POSTULER`

- `Postule` = le candidat a envoye sa candidature
- `Repondu` = Un recruiter/entreprise a contacte et le candidat a repondu (inbound)
- `Contact` = Le candidat a contacte proactivement quelqu'un de l'entreprise (outbound, ex : LinkedIn power move)

Si l'utilisateur demande de mettre a jour un statut, editer la ligne correspondante.

Afficher egalement des statistiques :
- Total de candidatures
- Par statut
- Score moyen
- % avec PDF genere
- % avec report genere
