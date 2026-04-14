#!/usr/bin/env npx tsx
/**
 * generate-report-react-pdf.tsx
 *
 * Reads a agent-job report .md file and generates a styled PDF
 * using React-PDF with the Mantra DA (EB Garamond, navy/offWhite/blue).
 *
 * Features:
 *   - Clickable sommaire (table of contents) on page 1
 *   - 3-part structure: Resume > Decrocher un entretien > Se demarquer en entretien > Annexes
 *   - PartTitle navy banners as visual separators
 *   - View id anchors for internal PDF navigation
 *   - Rich meta block (contrat, localisation, salaire, experience, seniorite, source)
 *
 * Usage:
 *   npx tsx generate-report-react-pdf.tsx reports/046-theodo-2026-04-12.md
 *   npx tsx generate-report-react-pdf.tsx reports/046-theodo-2026-04-12.md --output dossiers/046-theodo/Dossier.pdf
 */

import React from "react";
import {
  Document, Page, Text, View, Link, Font, StyleSheet, renderToFile,
} from "@react-pdf/renderer";
import * as fs from "fs";
import * as path from "path";

// --- Fonts ---
const fontDir = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), "fonts");
Font.register({
  family: "EBGaramond",
  fonts: [
    { src: path.join(fontDir, "EBGaramond-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontDir, "EBGaramond-Bold.ttf"), fontWeight: "bold" },
    { src: path.join(fontDir, "EBGaramond-SemiBold.ttf"), fontWeight: "semibold" },
    { src: path.join(fontDir, "EBGaramond-Italic.ttf"), fontStyle: "italic" },
  ],
});
Font.registerHyphenationCallback((word: string) => [word]);

// --- Mantra DA Colors ---
const C = {
  navy: "#282C4B",
  blue: "#103ACD",
  offWhite: "#FAF9F5",
  border: "#d0cfc9",
  black: "#1a1a1a",
  white: "#FFFFFF",
};

// --- Styles ---
const s = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: C.white,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 45,
    fontFamily: "EBGaramond",
    fontSize: 10,
    color: C.black,
    lineHeight: 1.5,
  },
  header: {
    position: "absolute",
    top: 18,
    left: 45,
    right: 45,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  headerBrand: { fontSize: 7, color: C.navy, letterSpacing: 1.5, textTransform: "uppercase" },
  headerDate: { fontSize: 7, color: C.navy, letterSpacing: 1.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 45,
    right: 45,
    textAlign: "center",
    fontSize: 7,
    color: C.navy,
  },
  titleBlock: { marginBottom: 18 },
  h1: { fontSize: 22, fontWeight: "bold", color: C.navy, marginBottom: 14, lineHeight: 1.4 },
  subtitle: { fontSize: 11, color: C.navy, fontStyle: "italic", marginBottom: 10 },
  metaRow: { flexDirection: "row", marginBottom: 5 },
  metaLabel: { fontSize: 8, color: C.navy, fontWeight: "semibold", textTransform: "uppercase", letterSpacing: 1, width: 80 },
  metaValue: { fontSize: 10, color: C.black },
  divider: { borderBottomWidth: 2, borderBottomColor: C.navy, marginBottom: 14, marginTop: 4 },
  dividerThin: { borderBottomWidth: 0.5, borderBottomColor: C.border, marginVertical: 8 },
  h2: { fontSize: 15, fontWeight: "bold", color: C.navy, marginTop: 20, marginBottom: 10, borderBottomWidth: 1.5, borderBottomColor: C.navy, paddingBottom: 5 },
  h3: { fontSize: 11, fontWeight: "semibold", color: C.navy, marginTop: 14, marginBottom: 6 },
  table: { marginVertical: 8 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: C.navy, minHeight: 22, alignItems: "center" },
  tableRow: { flexDirection: "row", minHeight: 20, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRowAlt: { flexDirection: "row", minHeight: 20, alignItems: "center", backgroundColor: C.offWhite, borderBottomWidth: 0.5, borderBottomColor: C.border },
  th: { fontSize: 8, fontWeight: "bold", color: C.white, paddingVertical: 4, paddingHorizontal: 6 },
  td: { fontSize: 9, color: C.black, paddingVertical: 4, paddingHorizontal: 6 },
  p: { fontSize: 10, marginBottom: 5, lineHeight: 1.5 },
  pSmall: { fontSize: 9, marginBottom: 4, lineHeight: 1.45 },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  link: { color: C.blue, textDecoration: "none" },
  card: {
    backgroundColor: C.offWhite,
    borderLeftWidth: 3,
    borderLeftColor: C.navy,
    padding: 12,
    marginVertical: 8,
  },
  scoreBadge: {
    backgroundColor: C.navy,
    color: C.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: 12,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 8 },
  bulletDot: { width: 12, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.45 },
});

// --- Reusable Components ---
const Header = ({ date }: { date: string }) => (
  <View style={s.header} fixed>
    <Text style={s.headerBrand}>Mantra Career Agent</Text>
    <Text style={s.headerDate}>{date}</Text>
  </View>
);

const Footer = () => (
  <Text
    style={s.footer}
    fixed
    render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}`}
  />
);

const Th = ({ children, flex = 1 }: { children: string; flex?: number }) => (
  <Text style={[s.th, { flex }]}>{children}</Text>
);

const Td = ({ children, flex = 1, bold: isBold = false }: { children: string; flex?: number; bold?: boolean }) => (
  <Text style={[s.td, { flex }, isBold ? s.bold : {}]}>{children}</Text>
);

const TableRow = ({ cells, flexes, isHeader = false, isAlt = false }: { cells: string[]; flexes?: number[]; isHeader?: boolean; isAlt?: boolean }) => (
  <View style={isHeader ? s.tableHeaderRow : isAlt ? s.tableRowAlt : s.tableRow} wrap={false}>
    {cells.map((cell, i) => {
      const f = flexes ? flexes[i] : 1;
      return isHeader
        ? <Th key={i} flex={f}>{cell}</Th>
        : <Td key={i} flex={f}>{cell}</Td>;
    })}
  </View>
);

const Bullet = ({ children }: { children: string }) => (
  <View style={s.bullet}>
    <Text style={s.bulletDot}>-</Text>
    <Text style={s.bulletText}>{children}</Text>
  </View>
);

const LinkCell = ({ url, label, flex = 1, fontSize = 7 }: { url: string; label: string; flex?: number; fontSize?: number }) => {
  const safeLabel = label.length > 35 ? label.slice(0, 32) + "..." : label;
  return (
    <View style={{ flex, paddingVertical: 4, paddingHorizontal: 6 }}>
      <Link src={url}><Text style={[s.link, { fontSize }]}>{safeLabel}</Text></Link>
    </View>
  );
};

// --- Part Title (full-width navy banner) ---
const PartTitle = ({ children, id }: { children: string; id?: string }) => (
  <View style={{
    marginTop: 30,
    marginBottom: 14,
    backgroundColor: C.navy,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: -10,
  }} wrap={false} id={id}>
    <Text style={{ fontSize: 12, fontWeight: "bold", color: C.white, letterSpacing: 2.5, textTransform: "uppercase" }}>{children}</Text>
  </View>
);

// --- Table of Contents ---
const TocLine = ({ num, label, dest }: { num: string; label: string; dest: string }) => (
  <View style={{ flexDirection: "row", marginBottom: 4, paddingVertical: 2 }} wrap={false}>
    <Text style={{ fontSize: 10, color: C.navy, fontWeight: "semibold", width: 24 }}>{num}</Text>
    <Link src={`#${dest}`}><Text style={{ fontSize: 10, color: C.blue }}>{label}</Text></Link>
  </View>
);

const TocPart = ({ children }: { children: string }) => (
  <Text style={{ fontSize: 9, fontWeight: "bold", color: C.navy, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 10, marginBottom: 4 }}>{children}</Text>
);

// --- Markdown Parser ---

interface ReportMeta {
  title: string;
  date: string;
  score: string;
  url: string;
  legitimacy: string;
  company: string;
  role: string;
  contrat: string;
  localisation: string;
  salaire: string;
  experience: string;
  seniorite: string;
}

interface MdTable {
  headers: string[];
  rows: string[][];
}

interface MdSection {
  heading: string;
  subsections: MdSubSection[];
}

interface MdSubSection {
  heading?: string;
  paragraphs: string[];
  bullets: string[];
  tables: MdTable[];
  blockquotes: string[];
  links: { url: string; label: string }[];
}

function parseMarkdown(md: string): { meta: ReportMeta; sections: MdSection[] } {
  const lines = md.split("\n");

  const meta: ReportMeta = {
    title: "", date: "", score: "", url: "", legitimacy: "", company: "", role: "",
    contrat: "", localisation: "", salaire: "", experience: "", seniorite: "",
  };

  let i = 0;

  // Find H1 title
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("# ")) {
      meta.title = line.replace(/^# /, "").replace(/\*\*/g, "").trim();
      let cleanTitle = meta.title.replace(/^Evaluation\s*:\s*/i, "").trim();
      const parts = cleanTitle.split(" -- ");
      if (parts.length >= 2) {
        meta.company = parts[0].trim();
        meta.role = parts[1].trim();
      } else {
        const parts2 = cleanTitle.split(" - ");
        if (parts2.length >= 2) {
          meta.company = parts2[0].trim();
          meta.role = parts2.slice(1).join(" - ").trim();
        } else {
          meta.company = cleanTitle;
          meta.role = "";
        }
      }
      i++;
      break;
    }
  }

  // Extract meta fields
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("## ")) break;
    const stripped = line.replace(/\*\*/g, "");
    if (stripped.startsWith("Date")) meta.date = stripped.replace(/^Date\s*:\s*/, "").trim();
    if (stripped.startsWith("Score")) meta.score = stripped.replace(/^Score\s*:\s*/, "").trim();
    if (stripped.startsWith("URL")) meta.url = stripped.replace(/^URL\s*:\s*/, "").trim();
    if (stripped.match(/^L[eé]gitimit[eé]|^Legitimacy/i)) meta.legitimacy = stripped.replace(/^(L[eé]gitimit[eé]|Legitimacy)\s*:\s*/i, "").trim();
    if (stripped.match(/^Contrat/i)) meta.contrat = stripped.replace(/^Contrat\s*:\s*/i, "").trim();
    if (stripped.match(/^Localisation/i)) meta.localisation = stripped.replace(/^Localisation\s*:\s*/i, "").trim();
    if (stripped.match(/^Salaire/i)) meta.salaire = stripped.replace(/^Salaire\s*:\s*/i, "").trim();
    if (stripped.match(/^Exp[eé]rience/i)) meta.experience = stripped.replace(/^Exp[eé]rience\s*:\s*/i, "").trim();
    if (stripped.match(/^S[eé]niorit[eé]/i)) meta.seniorite = stripped.replace(/^S[eé]niorit[eé]\s*:\s*/i, "").trim();
  }

  if (!meta.date) meta.date = new Date().toISOString().slice(0, 10);

  // Parse sections
  const sections: MdSection[] = [];
  let currentSection: MdSection | null = null;
  let currentSub: MdSubSection | null = null;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  function flushTable() {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      if (currentSub) currentSub.tables.push({ headers: tableHeaders, rows: tableRows });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  }

  function flushBlockquote() {
    if (blockquoteLines.length > 0 && currentSub) {
      currentSub.blockquotes.push(blockquoteLines.join("\n"));
      blockquoteLines = [];
      inBlockquote = false;
    }
  }

  function ensureSub() {
    if (!currentSub) {
      currentSub = { paragraphs: [], bullets: [], tables: [], blockquotes: [], links: [] };
      if (currentSection) currentSection.subsections.push(currentSub);
    }
  }

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith("## ")) {
      flushTable();
      flushBlockquote();
      currentSub = null;
      currentSection = {
        heading: line.replace(/^## /, "").replace(/\*\*/g, "").trim(),
        subsections: [],
      };
      sections.push(currentSection);
      currentSub = { paragraphs: [], bullets: [], tables: [], blockquotes: [], links: [] };
      currentSection.subsections.push(currentSub);
      continue;
    }

    if (line.startsWith("### ")) {
      flushTable();
      flushBlockquote();
      if (!currentSection) continue;
      currentSub = {
        heading: line.replace(/^### /, "").replace(/\*\*/g, "").trim(),
        paragraphs: [], bullets: [], tables: [], blockquotes: [], links: [],
      };
      currentSection.subsections.push(currentSub);
      continue;
    }

    if (!currentSection) continue;
    ensureSub();

    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith("> ")) {
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^> /, ""));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      currentSub!.bullets.push(line.replace(/^[-*] /, "").replace(/\*\*/g, ""));
      continue;
    }

    if (line === "---" || line === "***") continue;
    if (line === "") continue;

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      currentSub!.links.push({ label: match[1], url: match[2] });
    }

    currentSub!.paragraphs.push(line.replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1"));
  }

  flushTable();
  flushBlockquote();

  return { meta, sections };
}

// --- Section-to-Part mapping ---
interface PartDef {
  id: string;
  label: string;
  tocLabel: string;
}

const PARTS: PartDef[] = [
  { id: "part1", label: "Partie 1 \u2014 Resume", tocLabel: "Resume" },
  { id: "part2", label: "Partie 2 \u2014 Decrocher un entretien", tocLabel: "Decrocher un entretien" },
  { id: "part3", label: "Partie 3 \u2014 Se demarquer en entretien", tocLabel: "Se demarquer en entretien" },
  { id: "partA", label: "Annexes", tocLabel: "Annexes" },
];

/**
 * Map a section heading to its part index (0-3) and its TOC id/num.
 * Sections numbered 1-2 -> Part 0 (Resume)
 * Sections numbered 3-5 -> Part 1 (Decrocher)
 * Sections numbered 6-8 -> Part 2 (Se demarquer)
 * Sections starting with "Annexe" or lettered A-C -> Part 3 (Annexes)
 */
function classifySection(heading: string): { partIndex: number; tocNum: string; tocId: string; cleanLabel: string } {
  const h = heading.trim();

  // Numbered sections: "1. Resume du poste", "2. Match avec le CV", etc.
  const numMatch = h.match(/^(\d+)\.\s*(.+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const label = numMatch[2].trim();
    let partIndex = 0;
    if (num <= 2) partIndex = 0;
    else if (num <= 5) partIndex = 1;
    else partIndex = 2;
    return { partIndex, tocNum: `${num}.`, tocId: `sec${num}`, cleanLabel: label };
  }

  // Annexe sections: "Annexe A -- Remuneration", "Annexe B", or "A. Remuneration"
  const annexeMatch = h.match(/^Annexe\s+([A-Z])\s*[-\u2014]+\s*(.+)/i);
  if (annexeMatch) {
    const letter = annexeMatch[1].toUpperCase();
    const label = annexeMatch[2].trim();
    return { partIndex: 3, tocNum: `${letter}.`, tocId: `sec${letter}`, cleanLabel: label };
  }

  // "A. Remuneration" or "B. Niveau"
  const letterMatch = h.match(/^([A-C])\.\s*(.+)/);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const label = letterMatch[2].trim();
    return { partIndex: 3, tocNum: `${letter}.`, tocId: `sec${letter}`, cleanLabel: label };
  }

  // Fallback: treat as last part
  return { partIndex: 2, tocNum: "", tocId: `sec_${h.slice(0, 10).replace(/\s/g, "")}`, cleanLabel: h };
}

// --- Render a parsed table ---
const MAX_TABLE_COLS = 6;

const RenderTable = ({ table }: { table: MdTable }) => {
  let headers = table.headers;
  let rows = table.rows;

  if (headers.length > MAX_TABLE_COLS) {
    const keepIndices: number[] = [];
    for (let k = 0; k < Math.min(4, headers.length); k++) keepIndices.push(k);
    for (let k = Math.max(4, headers.length - 2); k < headers.length; k++) {
      if (!keepIndices.includes(k)) keepIndices.push(k);
    }
    const finalIndices = keepIndices.slice(0, MAX_TABLE_COLS);
    headers = finalIndices.map(k => headers[k]);
    rows = rows.map(row => finalIndices.map(k => row[k] || ""));
  }

  const colCount = Math.max(headers.length, rows[0]?.length || 1);
  const normalizedRows = rows.map(row => {
    if (row.length < colCount) return [...row, ...Array(colCount - row.length).fill("")];
    if (row.length > colCount) return row.slice(0, colCount);
    return row;
  });
  const normalizedHeaders = headers.length < colCount
    ? [...headers, ...Array(colCount - headers.length).fill("")]
    : headers.slice(0, colCount);

  const flexes = Array(colCount).fill(1);
  if (colCount >= 3 && normalizedHeaders[0]?.length <= 3) flexes[0] = 0.3;
  const tableFontSize = colCount >= 6 ? 7 : 9;

  return (
    <View style={s.table}>
      {normalizedHeaders.length > 0 && normalizedHeaders.some(h => h) && (
        <View style={s.tableHeaderRow} wrap={false}>
          {normalizedHeaders.map((h, j) => (
            <Text key={j} style={[s.th, { flex: flexes[j], fontSize: Math.min(tableFontSize, 8) }]}>{h.replace(/\*\*/g, "")}</Text>
          ))}
        </View>
      )}
      {normalizedRows.map((row, ri) => (
        <View key={ri} style={ri % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
          {row.map((cell, ci) => {
            const cleanCell = cell.replace(/\*\*/g, "");
            if (cleanCell.match(/^https?:\/\//)) {
              const shortUrl = cleanCell.replace(/^https?:\/\/(www\.)?/, "").slice(0, 35);
              return <LinkCell key={ci} url={cleanCell} label={shortUrl} flex={flexes[ci] || 1} fontSize={Math.min(tableFontSize, 7)} />;
            }
            const linkMatch = cleanCell.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
              return <LinkCell key={ci} url={linkMatch[2]} label={linkMatch[1]} flex={flexes[ci] || 1} fontSize={Math.min(tableFontSize, 7)} />;
            }
            return (
              <Text key={ci} style={[s.td, { flex: flexes[ci] || 1, fontSize: tableFontSize }, ci === 0 && colCount >= 3 ? s.bold : {}]}>
                {cleanCell}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// --- Render a subsection ---
const RenderSubSection = ({ sub }: { sub: MdSubSection }) => (
  <View>
    {sub.heading && <Text style={s.h3}>{sub.heading}</Text>}
    {sub.paragraphs.map((p, i) => <Text key={`p${i}`} style={s.p}>{p}</Text>)}
    {sub.bullets.map((b, i) => <Bullet key={`b${i}`}>{b}</Bullet>)}
    {sub.tables.map((t, i) => <RenderTable key={`t${i}`} table={t} />)}
    {sub.blockquotes.length > 0 && (
      <View style={s.card}>
        {sub.blockquotes.map((bq, bqi) =>
          bq.split("\n").filter(line => line.trim()).map((line, li) => (
            <Text key={`bq${bqi}-${li}`} style={s.pSmall}>{line.replace(/\*\*/g, "")}</Text>
          ))
        )}
      </View>
    )}
  </View>
);

// --- Main Report Component ---
const ReportPDF = ({ meta, sections }: { meta: ReportMeta; sections: MdSection[] }) => {
  // Classify each section into parts
  const classified = sections.map((sec) => ({
    section: sec,
    ...classifySection(sec.heading),
  }));

  // Build TOC entries grouped by part
  const tocByPart: Map<number, { tocNum: string; tocId: string; cleanLabel: string }[]> = new Map();
  for (const c of classified) {
    if (!tocByPart.has(c.partIndex)) tocByPart.set(c.partIndex, []);
    tocByPart.get(c.partIndex)!.push({ tocNum: c.tocNum, tocId: c.tocId, cleanLabel: c.cleanLabel });
  }

  // Track which parts we need to render
  const partsUsed = new Set(classified.map(c => c.partIndex));

  return (
    <Document title={`${meta.company} - ${meta.role}`} author="agent-job" language="fr">
      <Page size="A4" style={s.page}>
        <Header date={meta.date} />
        <Footer />

        {/* ===== TITLE BLOCK ===== */}
        <View style={s.titleBlock}>
          <Text style={s.h1}>{meta.company} - {meta.role}</Text>
          <View style={s.divider} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              {meta.contrat && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Contrat</Text>
                  <Text style={s.metaValue}>{meta.contrat}</Text>
                </View>
              )}
              {meta.localisation && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Localisation</Text>
                  <Text style={s.metaValue}>{meta.localisation}</Text>
                </View>
              )}
              {meta.salaire && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Salaire</Text>
                  <Text style={s.metaValue}>{meta.salaire}</Text>
                </View>
              )}
              {meta.experience && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Experience</Text>
                  <Text style={s.metaValue}>{meta.experience}</Text>
                </View>
              )}
              {meta.seniorite && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Seniorite</Text>
                  <Text style={s.metaValue}>{meta.seniorite}</Text>
                </View>
              )}
              {meta.url && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Source</Text>
                  <Link src={meta.url}><Text style={[s.link, { fontSize: 9 }]}>{meta.url.length > 55 ? meta.url.slice(0, 52) + "..." : meta.url}</Text></Link>
                </View>
              )}
            </View>
            {meta.score && <Text style={s.scoreBadge}>{meta.score}</Text>}
          </View>
        </View>

        {/* ===== SOMMAIRE ===== */}
        <View style={{ marginTop: 10, marginBottom: 8 }}>
          <Text style={[s.h2, { marginTop: 0 }]}>Sommaire</Text>

          {[0, 1, 2, 3].filter(pi => partsUsed.has(pi)).map(pi => (
            <View key={`toc-part-${pi}`}>
              <TocPart>{PARTS[pi].tocLabel}</TocPart>
              {(tocByPart.get(pi) || []).map((entry, ei) => (
                <TocLine key={`toc-${pi}-${ei}`} num={entry.tocNum} label={entry.cleanLabel} dest={entry.tocId} />
              ))}
            </View>
          ))}
        </View>

        {/* ===== PAGE BREAK before content ===== */}
        <View break />

        {/* ===== RENDER PARTS + SECTIONS ===== */}
        {(() => {
          let lastPartIndex = -1;
          return classified.map((c, ci) => {
            const needsPartTitle = c.partIndex !== lastPartIndex;
            lastPartIndex = c.partIndex;
            return (
              <View key={ci} wrap>
                {needsPartTitle && partsUsed.has(c.partIndex) && (
                  <PartTitle id={PARTS[c.partIndex].id}>{PARTS[c.partIndex].label}</PartTitle>
                )}
                <View id={c.tocId}>
                  <Text style={s.h2}>{c.section.heading}</Text>
                </View>
                {c.section.subsections.map((sub, ssi) => (
                  <RenderSubSection key={ssi} sub={sub} />
                ))}
              </View>
            );
          });
        })()}

      </Page>
    </Document>
  );
};

// --- CLI ---
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npx tsx generate-report-react-pdf.tsx <report.md> [--output path.pdf]");
    process.exit(1);
  }

  const mdPath = path.resolve(args[0]);
  if (!fs.existsSync(mdPath)) {
    console.error(`File not found: ${mdPath}`);
    process.exit(1);
  }

  let outputPath: string;
  const outputIdx = args.indexOf("--output");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputPath = path.resolve(args[outputIdx + 1]);
  } else {
    outputPath = mdPath.replace(/\.md$/, ".pdf");
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const md = fs.readFileSync(mdPath, "utf-8");
  const { meta, sections } = parseMarkdown(md);

  console.log(`Parsing: ${path.basename(mdPath)}`);
  console.log(`  Title: ${meta.company} - ${meta.role}`);
  console.log(`  Date: ${meta.date}`);
  console.log(`  Score: ${meta.score}`);
  console.log(`  Sections: ${sections.length}`);
  console.log(`  Meta: contrat=${meta.contrat || '-'}, loc=${meta.localisation || '-'}, sal=${meta.salaire || '-'}`);

  await renderToFile(<ReportPDF meta={meta} sections={sections} />, outputPath);
  console.log(`PDF saved: ${outputPath}`);
}

main().catch((err) => {
  console.error("Error generating PDF:", err);
  process.exit(1);
});
