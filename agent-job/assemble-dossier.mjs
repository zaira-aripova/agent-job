#!/usr/bin/env node

/**
 * assemble-dossier.mjs — Assemble a complete application dossier for a validated offer
 *
 * Usage:
 *   node assemble-dossier.mjs <report-number>
 *   node assemble-dossier.mjs 021
 *
 * Creates a folder: dossiers/{###}-{company-slug}/
 * Copies all related files into it:
 *   - report .md + .pdf
 *   - CV .pdf (personalized)
 *   - interview prep (deep research)
 *   - contact (outreach plan)
 *   - JD snapshot (if saved)
 *   - INDEX.md (table of contents)
 */

import { resolve, basename, dirname } from 'path';
import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function findFiles(dir, pattern) {
  try {
    const files = await readdir(dir);
    return files.filter(f => f.includes(pattern));
  } catch { return []; }
}

async function assembleDossier() {
  const num = process.argv[2];
  if (!num) {
    console.error('Usage: node assemble-dossier.mjs <report-number>');
    console.error('Example: node assemble-dossier.mjs 021');
    process.exit(1);
  }

  const paddedNum = num.padStart(3, '0');
  console.log(`📂 Assembling dossier for report #${paddedNum}...`);

  // 1. Find the report
  const reportsDir = resolve(__dirname, 'reports');
  const reportFiles = await findFiles(reportsDir, `${paddedNum}-`);
  const reportMd = reportFiles.find(f => f.endsWith('.md'));

  if (!reportMd) {
    console.error(`❌ No report found for #${paddedNum} in reports/`);
    process.exit(1);
  }

  // Extract company slug from filename: {num}-{slug}-{date}.md
  const match = reportMd.match(/^\d{3}-(.+)-\d{4}-\d{2}-\d{2}\.md$/);
  const companySlug = match ? match[1] : 'unknown';
  const dateStr = reportMd.match(/(\d{4}-\d{2}-\d{2})\.md$/)?.[1] || 'unknown';

  // Extract company name and role from report header
  const reportContent = await readFile(resolve(reportsDir, reportMd), 'utf-8');
  const titleMatch = reportContent.match(/^# .+?--\s*(.+?)\s*--\s*(.+)$/m);
  const companyName = titleMatch ? titleMatch[1].trim() : companySlug;
  const roleName = titleMatch ? titleMatch[2].trim() : 'Unknown Role';

  // Extract score
  const scoreMatch = reportContent.match(/\*\*Score\s*:\*\*\s*(\d+\.?\d*\/5)/i)
    || reportContent.match(/(\d+\.?\d*)\s*\/\s*5/);
  const score = scoreMatch ? scoreMatch[1] : 'N/A';

  // Extract URL
  const urlMatch = reportContent.match(/\*\*URL\s*:\*\*\s*(.+)/i);
  const offerUrl = urlMatch ? urlMatch[1].trim() : 'N/A';

  // Create dossier directory
  const dossierDir = resolve(__dirname, 'dossiers', `${paddedNum}-${companySlug}`);
  await mkdir(dossierDir, { recursive: true });
  console.log(`📁 Dossier: ${dossierDir}`);

  const collected = [];

  // 2. Copy report .md
  const srcReport = resolve(reportsDir, reportMd);
  const dstReport = resolve(dossierDir, `report-${paddedNum}.md`);
  await copyFile(srcReport, dstReport);
  collected.push({ type: 'Report (Markdown)', file: `report-${paddedNum}.md`, desc: 'Evaluation complete A-G' });
  console.log(`  ✅ Report .md`);

  // 3. Copy report .pdf
  const reportPdfName = reportMd.replace('.md', '.pdf');
  const reportPdfSrc = resolve(__dirname, 'output', 'reports', reportPdfName);
  if (await exists(reportPdfSrc)) {
    const dstReportPdf = resolve(dossierDir, `report-${paddedNum}.pdf`);
    await copyFile(reportPdfSrc, dstReportPdf);
    collected.push({ type: 'Report (PDF)', file: `report-${paddedNum}.pdf`, desc: 'Evaluation PDF avec pagination' });
    console.log(`  ✅ Report .pdf`);
  }

  // 4. Find and copy CV PDF (fuzzy match: any slug segment matches)
  const outputDir = resolve(__dirname, 'output');
  const slugParts = companySlug.split('-');
  const allOutputFiles = await findFiles(outputDir, '.pdf');
  const cvPdf = allOutputFiles.find(f => f.startsWith('cv-') && slugParts.some(part => part.length > 2 && f.toLowerCase().includes(part)));
  if (cvPdf) {
    await copyFile(resolve(outputDir, cvPdf), resolve(dossierDir, cvPdf));
    collected.push({ type: 'CV (PDF)', file: cvPdf, desc: 'CV personnalise pour cette offre' });
    console.log(`  ✅ CV PDF: ${cvPdf}`);
  }

  // 5. Find and copy interview prep (fuzzy match on slug parts)
  const prepDir = resolve(__dirname, 'interview-prep');
  let prepFiles = await findFiles(prepDir, companySlug);
  if (prepFiles.length === 0) {
    // Fuzzy: try matching any slug segment > 2 chars
    const allPrep = await findFiles(prepDir, '.md');
    prepFiles = allPrep.filter(f => slugParts.some(part => part.length > 2 && f.toLowerCase().includes(part)));
  }
  for (const f of prepFiles) {
    await copyFile(resolve(prepDir, f), resolve(dossierDir, f));
    const type = f.includes('contact') ? 'Contact (Outreach)' : 'Interview Prep (Deep Research)';
    const desc = f.includes('contact')
      ? 'Organigramme, emails Hunter, messages LinkedIn, cadence'
      : 'Recherche approfondie entreprise + stories STAR+R';
    collected.push({ type, file: f, desc });
    console.log(`  ✅ ${type}: ${f}`);
  }

  // 6. Find and copy JD snapshot (fuzzy match)
  const jdsDir = resolve(__dirname, 'jds');
  let jdFiles = await findFiles(jdsDir, companySlug);
  if (jdFiles.length === 0) {
    const allJds = await findFiles(jdsDir, '');
    jdFiles = allJds.filter(f => slugParts.some(part => part.length > 2 && f.toLowerCase().includes(part)));
  }
  for (const f of jdFiles) {
    await copyFile(resolve(jdsDir, f), resolve(dossierDir, f));
    collected.push({ type: 'JD Snapshot', file: f, desc: "Copie de l'offre originale" });
    console.log(`  ✅ JD: ${f}`);
  }

  // 7. Convert all .md files in the dossier to PDF via generate-report-pdf.mjs
  const { execSync } = await import('child_process');
  const mdFiles = collected.filter(c => c.file.endsWith('.md'));
  for (const c of mdFiles) {
    const mdPath = resolve(dossierDir, c.file);
    const pdfName = c.file.replace('.md', '.pdf');
    const pdfPath = resolve(dossierDir, pdfName);
    try {
      execSync(`node "${resolve(__dirname, 'generate-report-pdf.mjs')}" "${mdPath}" --output="${pdfPath}"`, {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 30000,
      });
      collected.push({ type: c.type + ' (PDF)', file: pdfName, desc: c.desc });
      console.log(`  ✅ PDF: ${pdfName}`);
    } catch (err) {
      console.log(`  ⚠️  PDF skipped: ${pdfName} (${err.message?.split('\n')[0] || 'error'})`);
    }
  }

  // 8. Generate INDEX.md
  const index = `# Dossier Candidature : ${companyName} -- ${roleName}

**Date :** ${dateStr}
**Score :** ${score}
**URL :** ${offerUrl}
**Statut :** Dossier assemble

---

## Contenu du dossier

| # | Type | Fichier | Description |
|---|------|---------|-------------|
${collected.map((c, i) => `| ${i + 1} | ${c.type} | [${c.file}](./${c.file}) | ${c.desc} |`).join('\n')}

---

## Checklist avant candidature

- [ ] Relire le report d'evaluation (blocs A-G)
- [ ] Verifier que le CV est personnalise (bloc E applique)
- [ ] Preparer les stories STAR+R pour l'entretien (bloc F)
- [ ] Envoyer les messages LinkedIn (contact)
- [ ] Envoyer l'email froid si score Hunter >= 80
- [ ] Mettre a jour le tracker (statut → Applied)

---

*Dossier genere automatiquement par agent-job le ${new Date().toISOString().split('T')[0]}*
`;

  await writeFile(resolve(dossierDir, 'INDEX.md'), index);
  console.log(`  ✅ INDEX.md`);

  // 9. Convert INDEX.md to PDF
  try {
    const indexPdfPath = resolve(dossierDir, 'INDEX.pdf');
    execSync(`node "${resolve(__dirname, 'generate-report-pdf.mjs')}" "${resolve(dossierDir, 'INDEX.md')}" --output="${indexPdfPath}"`, {
      cwd: __dirname,
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log(`  ✅ INDEX.pdf`);
  } catch (err) {
    console.log(`  ⚠️  INDEX.pdf skipped`);
  }

  // Summary
  console.log(`\n✅ Dossier assemble: ${collected.length} fichiers`);
  console.log(`📂 ${dossierDir}`);
  collected.forEach(c => console.log(`   ${c.file} (${c.type})`));

  return { dossierDir, files: collected };
}

assembleDossier().catch(err => {
  console.error('❌ Dossier assembly failed:', err.message);
  process.exit(1);
});
