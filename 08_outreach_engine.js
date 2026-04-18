/**
 * File: 08_outreach_engine.gs
 * Market-position based outreach (angle-based, non-SEO, high-response)
 */

/* ============================================================================
   ANGLE MAPPER
============================================================================ */

function getOutreachAngleFromDiagnosis_(diagnosisState) {
  switch (String(diagnosisState || "").trim()) {

    case "Structured but Under-Amplified":
      return "You’re stronger than the market is giving you credit for.";

    case "Competitive but Not Dominant":
    case "Competing But Not Default":
      return "You’re in the mix, but not controlling the decision.";

    case "Constrained Operator":
      return "You’re getting beat earlier in the process than you should be.";

    case "Considered But Not Safe":
      return "You’re being taken seriously, but not trusted first.";

    case "Invisible":
      return "You should be showing up stronger than you currently are.";

    default:
      return "Something about how the market is reading your business feels off.";
  }
}

/* ============================================================================
   SIGNATURE HELPER
============================================================================ */

function getSignatureName_() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) return "Phil";

    var namePart = email.split("@")[0]; // phil.caplo
    var clean = namePart.replace(/[._-]+/g, " "); // phil caplo

    return clean
      .split(" ")
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  } catch (e) {
    return "Phil";
  }
}

/* ============================================================================
   ENTRY POINT
============================================================================ */

function generateOutreachMessage_(m, diagnosis, scores) {
  const verticalKey = determineVerticalType_(m);
  const profile = getVerticalProfile_(verticalKey);

  if (profile.template_family === "auto_retail") {
    return buildAutoRetailOutreach_(m, diagnosis);
  }

  return buildGenericOutreach_(m, diagnosis, profile);
}

/* ============================================================================
   AUTO RETAIL — ANGLE-BASED OUTREACH
============================================================================ */

function buildAutoRetailOutreach_(m, diagnosis) {
  const angle = getOutreachAngleFromDiagnosis_(diagnosis.diagnosis_state);
  const sig = getSignatureName_();

  return `Hi,

Quick observation about your dealership —

${angle}

If you want, I can show you exactly where that’s happening locally.

— ${sig}`;
}

/* ============================================================================
   GENERIC OUTREACH
============================================================================ */

function buildGenericOutreach_(m, diagnosis, profile) {
  const angle = getOutreachAngleFromDiagnosis_(diagnosis.diagnosis_state);
  const sig = getSignatureName_();

  return `Hi,

Quick observation about your business —

${angle}

If you want, I can show you exactly where that’s happening locally.

— ${sig}`;
}

/* ============================================================================
   BULK REBUILD
============================================================================ */

function rebuildAllOutreachMessages() {
  ensureLeadsColumn_("outreach_message");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idx = {
    reviews: headers.indexOf("reviews_count"),
    comp_avg: headers.indexOf("comp_avg_reviews"),
    comp_1_name: headers.indexOf("comp_1_name"),
    comp_1_reviews: headers.indexOf("comp_1_reviews"),
    diagnosis: headers.indexOf("diagnosis_state"),
    priority: headers.indexOf("priority_bucket"),
    output: headers.indexOf("outreach_message")
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const m = {
      reviews_count: row[idx.reviews],
      comp_avg_reviews: row[idx.comp_avg],
      comp_1_name: row[idx.comp_1_name],
      comp_1_reviews: row[idx.comp_1_reviews]
    };

    const diagnosis = {
      diagnosis_state: row[idx.diagnosis],
      priority_bucket: row[idx.priority]
    };

    const message = generateOutreachMessage_(m, diagnosis, {});
    sheet.getRange(i + 1, idx.output + 1).setValue(message);
  }

  SpreadsheetApp.getUi().alert("Outreach messages generated.");
}