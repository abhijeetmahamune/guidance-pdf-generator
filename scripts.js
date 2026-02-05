/* =========================================================
   INITIAL SETUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupDownload();
});

/* =========================================================
   DOWNLOAD HANDLER
========================================================= */

function setupDownload() {
  const btn = document.getElementById("downloadPdf");
  if (!btn) return;

  btn.addEventListener("click", () => {
    generatePdf();
  });
}

/* =========================================================
   MAIN PDF GENERATOR (TEXT-BASED, CLEAN)
========================================================= */

function generatePdf() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const W = 210;
  const H = 297;
  const M = 20;
  let y = 20;

  // Brand colors
  const BRAND_BLUE = [33, 64, 154];
  const BOX_BLUE = [235, 240, 250];
  const NOTE_YELLOW = [254, 252, 232];

  // Read form values
  const studentName = val("studentName");
  const assessmentType = val("assessmentType");

  const parentTodos = lines("parentTodos");
  const studentTodos = assessmentType.includes("Career")
    ? lines("careerTodo")
    : lines("studentTodos");

  const notes = val("counselorNotes");

  /* ================= HEADER ================= */
  pdf.setFillColor(...BRAND_BLUE);
  pdf.rect(0, 0, W, 25, "F");

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Personalized Action Plan", W / 2, 16, { align: "center" });

  pdf.setTextColor(0);
  y = 35;

  /* ================= STUDENT INFO ================= */
  y = box(pdf, "Student Information", [
    `Student Name: ${studentName}`,
    `Assessment Type: ${assessmentType}`,
    `Date: ${new Date().toLocaleDateString()}`
  ], y, BOX_BLUE);

  /* ================= DISCLAIMER ================= */
  y = paragraph(
    pdf,
    "This guidance is intended for support and direction only and does not replace professional, medical, or psychological advice.",
    y
  );

  /* ================= PARENT TODOS ================= */
  if (assessmentType.includes("Psychometric") && parentTodos.length) {
    y = box(
      pdf,
      "Parent To-Do List",
      parentTodos.map(t => "☐ " + t),
      y,
      BOX_BLUE
    );
  }

  /* ================= STUDENT TODOS ================= */
  if (studentTodos.length) {
    y = box(
      pdf,
      "Student To-Do List",
      studentTodos.map(t => "☐ " + t),
      y,
      BOX_BLUE
    );
  }

  /* ================= NOTES ================= */
  if (notes) {
    y = box(pdf, "Counselor Notes", [notes], y, NOTE_YELLOW);
  }

  /* ================= FOOTER ================= */
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.text(
      "Brain Checker • Confidential • For family use only",
      W / 2,
      290,
      { align: "center" }
    );
  }

  pdf.save(`BrainChecker_Action_Plan_${Date.now()}.pdf`);
}

/* =========================================================
   BOX (AUTO-SIZING, NO OVERFLOW)
========================================================= */

function box(pdf, title, items, startY, bgColor) {
  const W = 210;
  const H = 297;
  const M = 20;
  const P = 6;
  const maxW = W - M * 2 - P * 2;

  let y = startY;
  let height = 10;

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);

  const rendered = [];

  items.forEach(text => {
    const clean = sanitize(text);
    const split = pdf.splitTextToSize(clean, maxW);
    rendered.push(split);
    height += split.length * 6;
  });

  if (y + height > H - M) {
    pdf.addPage();
    y = M;
  }

  pdf.setFillColor(...bgColor);
  pdf.rect(M, y, W - M * 2, height, "F");

  pdf.setFont("Helvetica", "bold");
  pdf.text(title, M + P, y + 7);

  pdf.setFont("Helvetica", "normal");
  let ty = y + 14;

  rendered.forEach(block => {
    block.forEach(line => {
      pdf.text(line, M + P, ty);
      ty += 6;
    });
  });

  return y + height + 10;
}

/* =========================================================
   PARAGRAPH (SAFE LINE-BY-LINE)
========================================================= */

function paragraph(pdf, text, startY) {
  const M = 20;
  const maxW = 170;
  let y = startY;

  pdf.setFontSize(10);
  const split = pdf.splitTextToSize(sanitize(text), maxW);

  split.forEach(line => {
    pdf.text(line, M, y);
    y += 5;
  });

  return y + 5;
}

/* =========================================================
   HELPERS
========================================================= */

function val(id) {
  return document.getElementById(id)?.value || "";
}

function lines(id) {
  return val(id)
    .split("\n")
    .map(sanitize)
    .filter(Boolean);
}

function sanitize(text) {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/[•●▪■◆►▶◦]/g, "")
    .replace(/&+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
