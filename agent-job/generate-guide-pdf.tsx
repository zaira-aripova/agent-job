#!/usr/bin/env npx tsx
/**
 * generate-guide-pdf.tsx — GUIDE-ELEVES.pdf, DA Mantra.
 */
import React from "react";
import {
  Document, Page, Text, View, Link, Font, StyleSheet, renderToFile,
} from "@react-pdf/renderer";
import * as path from "path";

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
Font.registerHyphenationCallback((w: string) => [w]);

const C = { navy: "#282C4B", blue: "#103ACD", offWhite: "#FAF9F5", border: "#d0cfc9", black: "#1a1a1a", white: "#FFFFFF" };

const s = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: C.white, paddingTop: 55, paddingBottom: 55, paddingHorizontal: 50, fontFamily: "EBGaramond", fontSize: 10, color: C.black, lineHeight: 1.75 },
  header: { position: "absolute", top: 18, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBrand: { fontSize: 7, color: C.navy, letterSpacing: 1.5, textTransform: "uppercase" },
  footer: { position: "absolute", bottom: 22, left: 50, right: 50, textAlign: "center", fontSize: 7, color: C.navy },
  h1: { fontSize: 24, fontWeight: "bold", color: C.navy, marginBottom: 6, lineHeight: 1.4 },
  subtitle: { fontSize: 12, color: C.navy, fontStyle: "italic", marginBottom: 22, lineHeight: 1.5 },
  h2: { fontSize: 15, fontWeight: "bold", color: C.navy, marginTop: 28, marginBottom: 12, borderBottomWidth: 1.5, borderBottomColor: C.navy, paddingBottom: 5 },
  h3: { fontSize: 11, fontWeight: "semibold", color: C.navy, marginTop: 18, marginBottom: 8 },
  p: { fontSize: 10, marginBottom: 8, lineHeight: 1.75 },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  link: { color: C.blue, textDecoration: "none" },
  bullet: { flexDirection: "row", marginBottom: 6, paddingLeft: 8 },
  bulletDot: { width: 14, fontSize: 10, color: C.navy, fontWeight: "bold" },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.75 },
  table: { marginVertical: 10 },
  thr: { flexDirection: "row", backgroundColor: C.navy, minHeight: 26, alignItems: "center" },
  tr: { flexDirection: "row", minHeight: 24, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: C.border },
  trAlt: { flexDirection: "row", minHeight: 24, alignItems: "center", backgroundColor: C.offWhite, borderBottomWidth: 0.5, borderBottomColor: C.border },
  th: { fontSize: 8, fontWeight: "bold", color: C.white, paddingVertical: 6, paddingHorizontal: 8 },
  td: { fontSize: 9, color: C.black, paddingVertical: 6, paddingHorizontal: 8, lineHeight: 1.55 },
  stepN: { fontSize: 18, fontWeight: "bold", color: C.navy, marginRight: 10, width: 24 },
});

/* --- helpers --- */
const DOT = "\u2022";
const B = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bullet}><Text style={s.bulletDot}>{DOT}</Text><Text style={s.bulletText}>{children}</Text></View>
);
const Th = ({ children, f = 1 }: { children: string; f?: number }) => <Text style={[s.th, { flex: f }]}>{children}</Text>;
const Td = ({ children, f = 1, b = false }: { children: React.ReactNode; f?: number; b?: boolean }) => <Text style={[s.td, { flex: f }, b ? s.bold : {}]}>{children}</Text>;
const Step = ({ n, title, text }: { n: number; title: string; text: string }) => (
  <View style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }} wrap={false}>
    <Text style={s.stepN}>{n}.</Text>
    <Text style={[s.p, { flex: 1, marginBottom: 0 }]}><Text style={s.bold}>{title} </Text>{text}</Text>
  </View>
);

const Guide = () => (
  <Document title="Mantra Career Agent" author="Mantra" language="fr">
    <Page size="A4" style={s.page}>
      <View style={s.header} fixed>
        <Text style={s.headerBrand}>{"Mantra Career Agent"}</Text>
        <Text style={s.headerBrand}>{"Guide d'installation"}</Text>
      </View>
      <Text style={s.footer} fixed render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}`} />

      {/* TITRE */}
      <Text style={s.h1}>{"Mantra Career Agent"}</Text>
      <Text style={s.subtitle}>{"Guide d'installation"}</Text>

      {/* QU'EST-CE QUE C'EST */}
      <Text style={s.h2}>{"Qu'est-ce que c'est ?"}</Text>
      <Text style={s.p}>{"Mantra Career Agent est votre assistant de recherche d'emploi. Vous lui donnez votre CV et vos criteres, il fait le reste :"}</Text>

      <Step n={1} title={"Il scanne les portails emploi"} text={"Welcome to the Jungle, France Travail, Indeed, APEC, LinkedIn, et des dizaines d'entreprises directement, et identifie les offres qui correspondent a votre profil"} />
      <Step n={2} title={"Evalue chaque offre et attribue un score sur 5"} text={"en croisant l'offre avec votre CV, vos competences, votre localisation, le salaire, le niveau demande (voir le detail du scoring plus bas)"} />
      <Step n={3} title={"Prepare 100% de votre candidature"} text={"CV adapte a l'offre, lettre de motivation, contacts cles (recruteur, manager, pairs), messages LinkedIn et emails prets a envoyer, et preparation complete de l'entretien avec vos stories STAR redigees"} />

      <Text style={[s.p, { marginTop: 4 }]}>
        {"Vous dialoguez avec l'agent dans Claude Code. Il fait la recherche, l'analyse et la redaction. Vous relisez, vous validez, vous envoyez. Rien ne part sans votre accord."}
      </Text>

      {/* INSTALLATION */}
      <Text style={s.h2}>{"Ce qu'il faut installer"}</Text>

      <B><Text style={s.bold}>{"Node.js "}</Text>{"- "}<Link src="https://nodejs.org"><Text style={s.link}>{"nodejs.org"}</Text></Link>{", version LTS (v18+)"}</B>
      <B><Text style={s.bold}>{"Claude Code "}</Text>{"- installez-le depuis "}<Link src="https://docs.anthropic.com/en/docs/claude-code"><Text style={s.link}>{"docs.anthropic.com"}</Text></Link></B>
      <B><Text style={s.bold}>{"MCP Canva "}</Text>{"- pour generer et modifier vos CV directement dans Canva"}</B>
      <B><Text style={s.bold}>{"Le dossier du projet "}</Text>{"- telechargez l'agent et placez-le dans un dossier"}</B>

      <Text style={[s.p, { fontSize: 9, fontStyle: "italic", marginTop: 4 }]}>{"Au premier lancement, Claude Code vous demandera de vous connecter a votre compte Anthropic, c'est automatique."}</Text>

      {/* PREPARATION */}
      <Text style={s.h2}>{"Ce qu'il faut preparer"}</Text>
      <Text style={s.p}>{"L'agent a besoin de deux documents pour travailler correctement :"}</Text>

      <Text style={s.h3}>{"1. Un CV au format .docx"}</Text>
      <Text style={s.p}>{"Votre CV classique, mis a jour, au format Word. C'est le document que l'agent adaptera pour chaque offre."}</Text>

      <Text style={s.h3}>{"2. Un fichier complet avec tous vos elements"}</Text>
      <Text style={s.p}>{"Un document libre (Word, texte, ou directement dans Claude Code) qui rassemble tout ce que l'agent doit savoir sur vous :"}</Text>
      <B>{"Ambition, poste vise, seniorite"}</B>
      <B>{"Secteur, type d'entreprise, localisation"}</B>
      <B>{"Fourchette de salaire cible"}</B>
      <B>{"Parcours detaille avec missions, resultats chiffres et KPI (+30% de trafic, 8 pays geres, budget 200K...)"}</B>
      <B>{"Projets cles, reussites marquantes, publications"}</B>
      <B>{"Competences techniques et linguistiques"}</B>
      <B>{"Formation, diplomes, certifications"}</B>
      <B>{"Ce qui vous motive et ce que vous refusez (deal-breakers)"}</B>

      <Text style={[s.p, { marginTop: 6, fontWeight: "semibold", color: C.navy }]}>
        {"Plus ce fichier est precis sur les resultats et les chiffres, plus l'agent sera capable de faire le match avec les offres."}
      </Text>

      {/* COMMENT CA MARCHE */}
      <Text style={s.h2}>{"Comment ca marche"}</Text>

      <Step n={1} title={"Ouvrez Claude Code"} text={""} />
      <Step n={2} title={"Selectionnez le dossier"} text={"dans lequel vous avez place l'agent telecharge"} />
      <Step n={3} title={"Suivez le guide"} text={"si c'est votre premiere fois, l'agent vous guide : il vous demande votre CV, vos criteres, configure les portails, et apprend a vous connaitre"} />


      {/* SCORING */}
      <Text style={s.h2}>{"Le scoring : comment l'agent note chaque offre"}</Text>
      <Text style={s.p}>{"Chaque offre est evaluee sur 5 dimensions, qui donnent un score global sur 5 :"}</Text>

      <View style={s.table}>
        <View style={s.thr} wrap={false}><Th f={1.2}>{"Dimension"}</Th><Th f={2.8}>{"Ce qui est mesure"}</Th></View>
        {[
          ["Match avec le CV", "Vos competences, experiences et resultats correspondent-ils aux prerequis de l'offre ?"],
          ["Alignement objectifs", "Le poste correspond-il aux roles que vous ciblez, a votre trajectoire de carriere ?"],
          ["Remuneration", "Le salaire propose est-il coherent avec le marche et votre cible ?"],
          ["Signaux culturels", "Culture d'entreprise, teletravail, stabilite, perspectives de croissance"],
          ["Red flags", "Elements bloquants : localisation incompatible, experience trop elevee, offre expiree..."],
        ].map((r, i) => (
          <View key={i} style={i % 2 === 1 ? s.trAlt : s.tr} wrap={false}>
            <Text style={[s.td, { flex: 1.2, fontWeight: "bold" }]}>{r[0]}</Text>
            <Text style={[s.td, { flex: 2.8, fontSize: 9 }]}>{r[1]}</Text>
          </View>
        ))}
      </View>

      <Text style={s.h3}>{"Ce que le score signifie"}</Text>
      <View style={s.table}>
        <View style={s.thr} wrap={false}><Th f={0.8}>{"Score"}</Th><Th f={3}>{"Interpretation"}</Th></View>
        {[
          ["4.5 et +", "Excellent match, postulez rapidement"],
          ["4.0 - 4.4", "Bon match, candidature recommandee"],
          ["3.5 - 3.9", "Correct mais pas ideal, postulez seulement si vous avez une raison precise"],
          ["Moins de 3.5", "Candidature deconseillee, votre temps est mieux investi ailleurs"],
        ].map((r, i) => (
          <View key={i} style={i % 2 === 1 ? s.trAlt : s.tr} wrap={false}>
            <Text style={[s.td, { flex: 0.8, fontWeight: "bold" }]}>{r[0]}</Text>
            <Text style={[s.td, { flex: 3, fontSize: 9 }]}>{r[1]}</Text>
          </View>
        ))}
      </View>

      <Text style={[s.p, { marginTop: 6 }]}>
        {"En parallele, l'agent verifie aussi la legitimite de l'offre (est-elle encore active ? est-ce une vraie ouverture ?) sur trois niveaux : haute confiance, a surveiller, suspect."}
      </Text>

      {/* DOSSIER DE SORTIE */}
      <Text style={s.h2}>{"Le dossier de sortie"}</Text>
      <Text style={s.p}>{"Pour chaque offre bien notee, l'agent genere un Dossier PDF unique, un seul document avec tout ce qu'il faut :"}</Text>
      <B><Text style={s.bold}>{"Partie 1 - Resume : "}</Text>{"synthese du poste, correspondance point par point avec votre CV, lacunes identifiees et comment les compenser"}</B>
      <B><Text style={s.bold}>{"Partie 2 - Decrocher un entretien : "}</Text>{"CV personnalise, brouillons de candidature, contacts avec emails, messages prets"}</B>
      <B><Text style={s.bold}>{"Partie 3 - Se demarquer : "}</Text>{"fiche entreprise, actions concretes avant l'entretien, stories STAR redigees"}</B>
      <B><Text style={s.bold}>{"Annexes : "}</Text>{"donnees salariales du marche, strategie de positionnement, mots-cles ATS"}</B>

      {/* POUR ALLER PLUS LOIN */}
      <Text style={s.h2}>{"Pour aller plus loin"}</Text>

      <Text style={s.h3}>{"API optionnelles"}</Text>
      <Text style={s.p}>{"Ces services ne sont pas obligatoires mais ameliorent la qualite des resultats :"}</Text>
      <View style={s.table}>
        <View style={s.thr} wrap={false}><Th f={1}>{"Service"}</Th><Th f={2}>{"Ce que ca apporte"}</Th><Th f={0.8}>{"Gratuit ?"}</Th></View>
        <View style={s.tr} wrap={false}>
          <Td f={1} b>{"Hunter.io"}</Td>
          <Td f={2}>{"Trouve les emails pro des recruteurs et managers"}</Td>
          <Td f={0.8}>{"25 rech./mois"}</Td>
        </View>
        <View style={s.trAlt} wrap={false}>
          <Td f={1} b>{"France Travail"}</Td>
          <Td f={2}>{"Scanne les offres en temps reel"}</Td>
          <Td f={0.8}>{"Gratuit"}</Td>
        </View>
      </View>

      <Text style={s.h3}>{"Glossaire"}</Text>
      <View style={s.table}>
        <View style={s.thr} wrap={false}><Th f={0.8}>{"Terme"}</Th><Th f={3.2}>{"Ce que ca veut dire"}</Th></View>
        {[
          ["ATS", "Applicant Tracking System, le logiciel que les recruteurs utilisent pour trier les CV automatiquement. Un CV optimise ATS contient les bons mots-cles pour passer ce filtre."],
          ["Story STAR", "Methode pour structurer vos reponses en entretien : Situation, Tache, Action, Resultat. L'agent ajoute une Reflexion (ce que vous avez appris)."],
          ["Outreach", "Prise de contact proactive, envoyer un message LinkedIn ou un email au recruteur avant meme de postuler."],
          ["Archetype", "Le type de poste vise (ex : Chef de projet marketing). L'agent utilise vos archetypes pour evaluer la correspondance avec chaque offre."],
        ].map((r, i) => (
          <View key={i} style={i % 2 === 1 ? s.trAlt : s.tr} wrap={false}>
            <Text style={[s.td, { flex: 0.8, fontWeight: "bold" }]}>{r[0]}</Text>
            <Text style={[s.td, { flex: 3.2, fontSize: 8.5, lineHeight: 1.5 }]}>{r[1]}</Text>
          </View>
        ))}
      </View>

    </Page>
  </Document>
);

(async () => {
  const outPath = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), "GUIDE-ELEVES.pdf");
  await renderToFile(<Guide />, outPath);
  console.log(`PDF saved: ${outPath}`);
})();
