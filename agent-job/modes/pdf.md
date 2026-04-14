# Mode : pdf -- Generation de PDF optimise ATS

## Pipeline complet

1. Lire `cv.md` comme source de verite
2. Demander au candidat le JD s'il n'est pas en contexte (texte ou URL)
3. Extraire 15-20 keywords du JD
4. Detecter la langue du JD -> langue du CV (EN par defaut)
5. Detecter la localisation de l'entreprise -> format papier :
   - US/Canada -> `letter`
   - Reste du monde -> `a4`
6. Detecter l'archetype du role -> adapter le framing
7. Reecrire le Professional Summary en injectant les keywords du JD + exit narrative bridge ("Built and sold a business. Now applying systems thinking to [domain du JD].")
8. Selectionner les top 3-4 projets les plus pertinents pour l'offre
9. Reordonner les bullets d'experience par pertinence au JD
10. Construire la competency grid depuis les exigences du JD (6-8 keyword phrases)
11. Injecter les keywords naturellement dans les realisations existantes (JAMAIS inventer)
12. Generer le HTML complet depuis le template + contenu personnalise
13. Lire `name` de `config/profile.yml` -> normaliser en kebab-case lowercase (ex. "John Doe" -> "john-doe") -> `{candidate}`
14. Ecrire le HTML dans `/tmp/cv-{candidate}-{company}.html`
15. Executer : `node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={letter|a4}`
15. Rapporter : chemin du PDF, nb de pages, % de couverture des keywords

## Regles ATS (parsing propre)

- Layout single-column (pas de sidebars, pas de colonnes paralleles)
- Headers standard : "Professional Summary", "Work Experience", "Education", "Skills", "Certifications", "Projects"
- Pas de texte dans les images/SVGs
- Pas d'info critique dans les headers/footers du PDF (ATS les ignore)
- UTF-8, texte selectionnable (pas rasterise)
- Pas de tableaux imbriques
- Keywords du JD distribues : Summary (top 5), premier bullet de chaque role, Skills section

## Design du PDF

- **Fonts**: Space Grotesk (headings, 600-700) + DM Sans (body, 400-500)
- **Fonts self-hosted**: `fonts/`
- **Header**: nom en Space Grotesk 24px bold + ligne gradient `linear-gradient(to right, hsl(187,74%,32%), hsl(270,70%,45%))` 2px + ligne de contact
- **Section headers**: Space Grotesk 13px, uppercase, letter-spacing 0.05em, color cyan primary
- **Body**: DM Sans 11px, line-height 1.5
- **Company names**: color accent purple `hsl(270,70%,45%)`
- **Marges**: 0.6in
- **Background**: blanc pur

## Ordre des sections (optimise "6-second recruiter scan")

1. Header (nom grand, gradient, contact, lien portfolio)
2. Professional Summary (3-4 lignes, keyword-dense)
3. Core Competencies (6-8 keyword phrases en flex-grid)
4. Work Experience (chronologique inverse)
5. Projects (top 3-4 plus pertinents)
6. Education & Certifications
7. Skills (langues + techniques)

## Strategie d'injection de keywords (ethique, basee sur la verite)

Exemples de reformulation legitime :
- JD dit "RAG pipelines" et CV dit "LLM workflows with retrieval" -> changer en "RAG pipeline design and LLM orchestration workflows"
- JD dit "MLOps" et CV dit "observability, evals, error handling" -> changer en "MLOps and observability: evals, error handling, cost monitoring"
- JD dit "stakeholder management" et CV dit "collaborated with team" -> changer en "stakeholder management across engineering, operations, and business"

**JAMAIS ajouter des skills que le candidat n'a pas. Seulement reformuler l'experience reelle avec le vocabulaire exact du JD.**

## Template HTML

Utiliser le template dans `cv-template.html`. Remplacer les placeholders `{{...}}` avec du contenu personnalise :

| Placeholder | Contenu |
|-------------|---------|
| `{{LANG}}` | `en` ou `es` |
| `{{PAGE_WIDTH}}` | `8.5in` (letter) ou `210mm` (A4) |
| `{{NAME}}` | (from profile.yml) |
| `{{EMAIL}}` | (from profile.yml) |
| `{{LINKEDIN_URL}}` | [from profile.yml] |
| `{{LINKEDIN_DISPLAY}}` | [from profile.yml] |
| `{{PORTFOLIO_URL}}` | [from profile.yml] (ou /es selon la langue) |
| `{{PORTFOLIO_DISPLAY}}` | [from profile.yml] (ou /es selon la langue) |
| `{{LOCATION}}` | [from profile.yml] |
| `{{SECTION_SUMMARY}}` | Professional Summary / Resume Professionnel |
| `{{SUMMARY_TEXT}}` | Summary personnalise avec keywords |
| `{{SECTION_COMPETENCIES}}` | Core Competencies / Competences Cles |
| `{{COMPETENCIES}}` | `<span class="competency-tag">keyword</span>` x 6-8 |
| `{{SECTION_EXPERIENCE}}` | Work Experience / Experience Professionnelle |
| `{{EXPERIENCE}}` | HTML de chaque poste avec bullets reordonnes |
| `{{SECTION_PROJECTS}}` | Projects / Projets |
| `{{PROJECTS}}` | HTML des top 3-4 projets |
| `{{SECTION_EDUCATION}}` | Education / Formation |
| `{{EDUCATION}}` | HTML de la formation |
| `{{SECTION_CERTIFICATIONS}}` | Certifications / Certifications |
| `{{CERTIFICATIONS}}` | HTML des certifications |
| `{{SECTION_SKILLS}}` | Skills / Competences |
| `{{SKILLS}}` | HTML des skills |

## Canva CV Generation (optional)

If `config/profile.yml` has `canva_resume_design_id` set, offer the user a choice before generating:
- **"HTML/PDF (fast, ATS-optimized)"** — existing flow above
- **"Canva CV (visual, design-preserving)"** — new flow below

If the user has no `canva_resume_design_id`, skip this prompt and use the HTML/PDF flow.

### Canva workflow

#### Step 1 — Duplicate the base design

a. `export-design` the base design (using `canva_resume_design_id`) as PDF → get download URL
b. `import-design-from-url` using that download URL → creates a new editable design (the duplicate)
c. Note the new `design_id` for the duplicate

#### Step 2 — Read the design structure

a. `get-design-content` on the new design → returns all text elements (richtexts) with their content
b. Map text elements to CV sections by content matching:
   - Look for the candidate's name → header section
   - Look for "Summary" or "Professional Summary" → summary section
   - Look for company names from cv.md → experience sections
   - Look for degree/school names → education section
   - Look for skill keywords → skills section
c. If mapping fails, show the user what was found and ask for guidance

#### Step 3 — Generate tailored content

Same content generation as the HTML flow (Steps 1-11 above):
- Rewrite Professional Summary with JD keywords + exit narrative
- Reorder experience bullets by JD relevance
- Select top competencies from JD requirements
- Inject keywords naturally (NEVER invent)

**IMPORTANT — Character budget rule:** Each replacement text MUST be approximately the same length as the original text it replaces (within ±15% character count). If tailored content is longer, condense it. The Canva design has fixed-size text boxes — longer text causes overlapping with adjacent elements. Count the characters in each original element from Step 2 and enforce this budget when generating replacements.

#### Step 4 — Apply edits

a. `start-editing-transaction` on the duplicate design
b. `perform-editing-operations` with `find_and_replace_text` for each section:
   - Replace summary text with tailored summary
   - Replace each experience bullet with reordered/rewritten bullets
   - Replace competency/skills text with JD-matched terms
   - Replace project descriptions with top relevant projects
c. **Reflow layout after text replacement:**
   After applying all text replacements, the text boxes auto-resize but neighboring elements stay in place. This causes uneven spacing between work experience sections. Fix this:
   1. Read the updated element positions and dimensions from the `perform-editing-operations` response
   2. For each work experience section (top to bottom), calculate where the bullets text box ends: `end_y = top + height`
   3. The next section's header should start at `end_y + consistent_gap` (use the original gap from the template, typically ~30px)
   4. Use `position_element` to move the next section's date, company name, role title, and bullets elements to maintain even spacing
   5. Repeat for all work experience sections
d. **Verify layout before commit:**
   - `get-design-thumbnail` with the transaction_id and page_index=1
   - Visually inspect the thumbnail for: text overlapping, uneven spacing, text cut off, text too small
   - If issues remain, adjust with `position_element`, `resize_element`, or `format_text`
   - Repeat until layout is clean
d. Show the user the final preview and ask for approval
e. `commit-editing-transaction` to save (ONLY after user approval)

#### Step 5 — Export and download PDF

a. `export-design` the duplicate as PDF (format: a4 or letter based on JD location)
b. **IMMEDIATELY** download the PDF using Bash:
   ```bash
   curl -sL -o "output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf" "{download_url}"
   ```
   The export URL is a pre-signed S3 link that expires in ~2 hours. Download it right away.
c. Verify the download:
   ```bash
   file output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf
   ```
   Must show "PDF document". If it shows XML or HTML, the URL expired — re-export and retry.
d. Report: PDF path, file size, Canva design URL (for manual tweaking)

#### Error handling

- If `import-design-from-url` fails → fall back to HTML/PDF pipeline with message
- If text elements can't be mapped → warn user, show what was found, ask for manual mapping
- If `find_and_replace_text` finds no matches → try broader substring matching
- Always provide the Canva design URL so the user can edit manually if auto-edit fails

## Post-generation

Mettre a jour le tracker si l'offre est deja enregistree : changer PDF de ❌ a ✅.
