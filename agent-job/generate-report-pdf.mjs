#!/usr/bin/env node

/**
 * generate-report-pdf.mjs — Markdown evaluation report → PDF via Playwright
 *
 * Usage:
 *   node generate-report-pdf.mjs <report.md> [--output=path.pdf]
 *
 * Converts a markdown evaluation report to a styled PDF.
 * Output defaults to output/reports/{filename}.pdf
 */

import { chromium } from 'playwright';
import { resolve, basename, dirname } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function markdownToHTML(md) {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Links (must be before bold/italic to avoid conflict with brackets)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (match, header, sep, body) => {
    const headers = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Lists (unordered)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs (lines not already wrapped)
  html = html.replace(/^(?!<[h|u|o|t|p|l|hr|pre])((?!^\s*$).+)$/gm, '<p>$1</p>');

  // Clean up double-wrapped paragraphs
  html = html.replace(/<p><(h[1-3]|li|table|ul|ol|hr|pre)/g, '<$1');
  html = html.replace(/<\/(h[1-3]|li|table|ul|ol|pre)><\/p>/g, '</$1>');

  // Add page-break-before class to all h2 elements after the first one
  let h2Count = 0;
  html = html.replace(/<h2>/g, () => {
    h2Count++;
    return h2Count > 1 ? '<h2 class="page-break-before">' : '<h2>';
  });

  return html;
}

const CSS = `
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11px;
    line-height: 1.6;
    color: #000000;
    max-width: 100%;
    padding: 0;
    margin: 0;
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.02em;
    border-bottom: 2px solid #282C4B;
    padding-bottom: 8px;
    margin-top: 0;
    color: #282C4B;
  }
  h2 {
    font-size: 14px;
    font-weight: 700;
    color: #282C4B;
    border-bottom: 1px solid #282C4B;
    padding-bottom: 4px;
    margin-top: 24px;
  }
  h3 {
    font-size: 12px;
    font-weight: 700;
    color: #282C4B;
    margin-top: 16px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10px;
  }
  th, td {
    border: 1px solid #d0cfc9;
    padding: 5px 8px;
    text-align: left;
  }
  th {
    background: #282C4B;
    color: #FFFFFF;
    font-weight: 600;
  }
  tr:nth-child(even) {
    background: #FAF9F5;
  }
  code {
    background: #FAF9F5;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
    font-family: 'Courier New', monospace;
  }
  pre {
    background: #FAF9F5;
    padding: 10px;
    border-radius: 2px;
    border-left: 3px solid #282C4B;
    overflow-x: auto;
    font-size: 10px;
  }
  hr {
    border: none;
    border-top: 1px solid #d0cfc9;
    margin: 20px 0;
  }
  ul, ol {
    padding-left: 20px;
  }
  li {
    margin: 3px 0;
  }
  strong {
    color: #000000;
  }
  p {
    margin: 6px 0;
  }
  blockquote {
    border-left: 3px solid #282C4B;
    margin: 10px 0;
    padding: 8px 16px;
    background: #FAF9F5;
    font-style: italic;
  }
  a { color: #103ACD; text-decoration: none; }
  a:hover { text-decoration: underline; }
  h2.page-break-before {
    page-break-before: always;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
`;

async function generateReportPDF() {
  const args = process.argv.slice(2);
  let inputPath, outputPath;

  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      outputPath = arg.split('=')[1];
    } else if (!inputPath) {
      inputPath = arg;
    }
  }

  if (!inputPath) {
    console.error('Usage: node generate-report-pdf.mjs <report.md> [--output=path.pdf]');
    process.exit(1);
  }

  inputPath = resolve(inputPath);

  if (!outputPath) {
    const filename = basename(inputPath, '.md') + '.pdf';
    outputPath = resolve(__dirname, 'output', 'reports', filename);
  } else {
    outputPath = resolve(outputPath);
  }

  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });

  console.log(`📄 Input:  ${inputPath}`);
  console.log(`📁 Output: ${outputPath}`);

  // Read and convert markdown
  const md = await readFile(inputPath, 'utf-8');
  const bodyHTML = markdownToHTML(md);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>${CSS}</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-family:Georgia,serif;font-size:8px;width:100%;text-align:right;padding-right:0.5in;color:#282C4B;">agent-job</div>',
      footerTemplate: '<div style="font-family:Georgia,serif;font-size:8px;width:100%;text-align:center;color:#282C4B;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '0.7in', right: '0.5in', bottom: '0.7in', left: '0.5in' },
    });

    await writeFile(outputPath, pdfBuffer);

    const pdfString = pdfBuffer.toString('latin1');
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length;

    console.log(`✅ PDF generated: ${outputPath}`);
    console.log(`📊 Pages: ${pageCount}`);
    console.log(`📦 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    return { outputPath, pageCount, size: pdfBuffer.length };
  } finally {
    await browser.close();
  }
}

generateReportPDF().catch((err) => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
