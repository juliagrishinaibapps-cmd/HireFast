import { jsPDF } from "jspdf";

const NAVY = "#1a2942";
const DARK = "#222222";
const GREY = "#666666";
const GOLD = "#b8943f";

// A4: 210 x 297mm, margins 20mm left/right, 15mm top/bottom
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 20; // margin left
const MR = 20; // margin right
const MT = 15; // margin top
const MB = 15; // margin bottom
const CONTENT_W = PAGE_W - ML - MR;
const BOTTOM_LIMIT = PAGE_H - MB - 10; // 10mm for footer

function addPageNumbers(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(GREY);
    doc.text(`Page ${i} of ${total}`, PAGE_W - MR, PAGE_H - 8, { align: "right" });
    // Footer line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(ML, PAGE_H - MB, PAGE_W - MR, PAGE_H - MB);
  }
}

function sectionHeader(doc: jsPDF, y: number, title: string): number {
  if (y > BOTTOM_LIMIT - 20) { doc.addPage(); y = MT; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(NAVY);
  doc.text(title.toUpperCase(), ML, y);
  // underline
  doc.setDrawColor(NAVY);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 1.5, ML + CONTENT_W, y + 1.5);
  return y + 7;
}

function bodyText(doc: jsPDF, y: number, text: string, indent = 0, italic = false): number {
  doc.setFont("helvetica", italic ? "italic" : "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(DARK);
  const lines = doc.splitTextToSize(text, CONTENT_W - indent);
  for (const line of lines) {
    if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
    doc.text(line, ML + indent, y);
    y += 5;
  }
  return y;
}

function bulletPoint(doc: jsPDF, y: number, text: string): number {
  if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(DARK);
  doc.text("•", ML + 5, y);
  const lines = doc.splitTextToSize(text.replace(/^[•\-–]\s*/, ""), CONTENT_W - 10);
  for (const line of lines) {
    if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
    doc.text(line, ML + 10, y);
    y += 5;
  }
  return y;
}

export function generateCvPdf(cvText: string, role: string, company: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const lines = cvText.split("\n");

  let y = MT;

  // Try to extract name from first non-empty line
  const firstLine = lines.find(l => l.trim());
  const isNameLine = firstLine && !firstLine.match(/^(PROFESSIONAL|WORK|EDUCATION|SKILLS|SUMMARY|PERSONAL)/i);
  if (firstLine && isNameLine) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(NAVY);
    doc.text(firstLine.trim(), ML, y);
    y += 8;
    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.6);
    doc.line(ML, y, ML + CONTENT_W, y);
    y += 6;
  }

  const SECTION_HEADERS = /^(PROFESSIONAL SUMMARY|WORK EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|PERSONAL DETAILS|PERSONAL)/i;
  const isJobLine = (l: string) => l.match(/\|/) && l.match(/\d{4}/);
  const isBullet = (l: string) => l.startsWith("•") || l.startsWith("-") || l.startsWith("–");

  let skipFirst = isNameLine;
  let inSection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y += 2; continue; }
    if (skipFirst && trimmed === firstLine?.trim()) { skipFirst = false; continue; }

    if (trimmed.match(SECTION_HEADERS) || trimmed.match(/^[A-Z\s]{4,}$/) && trimmed.length < 40) {
      y += 4;
      if (y > BOTTOM_LIMIT - 20) { doc.addPage(); y = MT; }
      y = sectionHeader(doc, y, trimmed);
      inSection = trimmed.toUpperCase();
      continue;
    }

    if (isJobLine(trimmed)) {
      y += 2;
      if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
      const parts = trimmed.split("|").map(p => p.trim());
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(DARK);
      doc.text(parts[0] || "", ML, y);
      if (parts[1]) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(GREY);
        doc.text(parts.slice(1).join(" | "), ML + CONTENT_W, y, { align: "right" });
      }
      y += 5;
      continue;
    }

    if (isBullet(trimmed)) {
      y = bulletPoint(doc, y, trimmed);
      continue;
    }

    const isItalic = inSection.includes("SUMMARY");
    y = bodyText(doc, y, trimmed, 0, isItalic);
  }

  addPageNumbers(doc);
  const filename = `CV - ${role} at ${company}`.replace(/[^a-zA-Z0-9 \-]/g, "").trim();
  doc.save(`${filename}.pdf`);
}

export function generateCoverLetterPdf(
  letter: string,
  role: string,
  company: string
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MT;

  // Date top right
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(GREY);
  doc.text(today, ML + CONTENT_W, y, { align: "right" });
  y += 12;

  // Re: line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(NAVY);
  doc.text(`Re: Application for ${role} at ${company}`, ML, y);
  doc.setDrawColor(NAVY);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 1.5, ML + CONTENT_W, y + 1.5);
  y += 10;

  // Body paragraphs
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(DARK);

  const paragraphs = letter.split(/\n\n+/).filter(Boolean);
  for (const para of paragraphs) {
    const text = para.replace(/\n/g, " ").trim();
    if (!text) continue;
    if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
    const paraLines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of paraLines) {
      if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
      doc.text(line, ML, y);
      y += 5.5;
    }
    y += 4; // paragraph gap
  }

  // Signature
  y += 6;
  if (y > BOTTOM_LIMIT) { doc.addPage(); y = MT; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(DARK);
  doc.text("Yours sincerely,", ML, y);
  y += 14;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + 60, y);

  addPageNumbers(doc);
  const filename = `Cover Letter - ${role} at ${company}`.replace(/[^a-zA-Z0-9 \-]/g, "").trim();
  doc.save(`${filename}.pdf`);
}
