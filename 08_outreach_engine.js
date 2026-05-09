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

    case "Outgunned":
      return "Stronger visible competitors are shaping trust before buyers really compare options.";

    case "Undersignaled":
      return "The business looks lighter in public than it likely is in reality.";

    case "Contender":
      return "You’re closer to controlling the decision than it probably looks from the outside.";

    default:
      return "Something about how the market is reading your business feels off.";
  }
}

/* ============================================================================
   SIGNAL HELPERS
============================================================================ */

function getMomentumOutreachLine_(m) {
  var momentum = String(m.momentum_state || "").trim();

  if (momentum === "aggressive") {
    return "The gap is not just there — it is being reinforced.";
  }

  if (momentum === "stagnant") {
    return "The good news is the market is not widening that trust gap aggressively right now.";
  }

  if (momentum === "slow") {
    return "This still looks winnable, but the opening won’t stay soft forever.";
  }

  if (momentum === "active") {
    return "This is the kind of market where small trust gaps compound faster than they look on paper.";
  }

  return "";
}

function getUndervaluedOutreachLine_(m) {
  if (m.is_undervalued === true || String(m.is_undervalued || "").toLowerCase() === "true") {
    return "What stood out is that you look closer to the top of the market than your current public position suggests.";
  }
  return "";
}

function getMarketContextLine_(m, diagnosis, profile) {
  var city = String(m.city || "your market").trim();
  var businessName = String(m.business_name || "your business").trim();
  var compAvg = Math.round(Number(m.comp_avg_reviews || 0));
  var reviews = Math.round(Number(m.reviews_count || 0));
  var category = String(m.category || profile.label || "business").trim();

  if (profile.template_family === "auto_retail") {
    if (compAvg > 0) {
      return "In " + city + ", stores with stronger visible trust are often getting read as safer before vehicles are seriously compared.";
    }
    return "In " + city + ", buyers are still making fast trust decisions before inventory gets a fair comparison.";
  }

  if (compAvg > 0) {
    return "In " + city + ", visible competitors appear to be clustering around roughly " + compAvg + " reviews, while " + businessName + " is sitting closer to " + reviews + ".";
  }

  return "In " + city + ", buyers are making fast trust decisions in the " + category + " market.";
}

function buildOutreachBodyLines_(m, diagnosis, profile) {
  var lines = [];
  var diagnosisLine = getOutreachAngleFromDiagnosis_(diagnosis.diagnosis_state);
  var marketLine = getMarketContextLine_(m, diagnosis, profile);
  var momentumLine = getMomentumOutreachLine_(m);
  var undervaluedLine = getUndervaluedOutreachLine_(m);

  if (marketLine) lines.push(marketLine);
  if (diagnosisLine) lines.push(diagnosisLine);
  if (momentumLine) lines.push(momentumLine);
  if (undervaluedLine) lines.push(undervaluedLine);

  return lines.filter(function(line) {
    return String(line || "").trim() !== "";
  });
}

/* ============================================================================
   SIGNATURE HELPER
============================================================================ */

function getSignatureName_() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) return "Phil";

    var namePart = email.split("@")[0];
    var clean = namePart.replace(/[._-]+/g, " ");

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
    return buildAutoRetailOutreach_(m, diagnosis, profile);
  }

  return buildGenericOutreach_(m, diagnosis, profile);
}

/* ============================================================================
   AUTO RETAIL — ANGLE-BASED OUTREACH
============================================================================ */

function buildAutoRetailOutreach_(m, diagnosis, profile) {
  const sig = getSignatureName_();
  const lines = buildOutreachBodyLines_(m, diagnosis, profile);

  return [
    "Hi,",
    "",
    "Quick observation about your dealership —",
    "",
    lines.join(" "),
    "",
    "If you want, I can show you exactly where that is happening locally and why stronger stores are getting trusted earlier.",
    "",
    "— " + sig
  ].join("\n");
}

/* ============================================================================
   GENERIC OUTREACH
============================================================================ */

function buildGenericOutreach_(m, diagnosis, profile) {
  const sig = getSignatureName_();
  const lines = buildOutreachBodyLines_(m, diagnosis, profile);

  return [
    "Hi,",
    "",
    "Quick observation about your business —",
    "",
    lines.join(" "),
    "",
    "If you want, I can show you exactly where that is happening locally.",
    "",
    "— " + sig
  ].join("\n");
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
    business_name: headers.indexOf("business_name"),
    city: headers.indexOf("city"),
    category: headers.indexOf("category"),
    reviews: headers.indexOf("reviews_count"),
    comp_avg: headers.indexOf("comp_avg_reviews"),
    comp_1_name: headers.indexOf("comp_1_name"),
    comp_1_reviews: headers.indexOf("comp_1_reviews"),
    momentum_state: headers.indexOf("momentum_state"),
    is_undervalued: headers.indexOf("is_undervalued"),
    diagnosis: headers.indexOf("diagnosis_state"),
    priority: headers.indexOf("priority_bucket"),
    output: headers.indexOf("outreach_message")
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const m = {
      business_name: idx.business_name > -1 ? row[idx.business_name] : "",
      city: idx.city > -1 ? row[idx.city] : "",
      category: idx.category > -1 ? row[idx.category] : "",
      reviews_count: idx.reviews > -1 ? row[idx.reviews] : 0,
      comp_avg_reviews: idx.comp_avg > -1 ? row[idx.comp_avg] : 0,
      comp_1_name: idx.comp_1_name > -1 ? row[idx.comp_1_name] : "",
      comp_1_reviews: idx.comp_1_reviews > -1 ? row[idx.comp_1_reviews] : 0,
      momentum_state: idx.momentum_state > -1 ? row[idx.momentum_state] : "",
      is_undervalued: idx.is_undervalued > -1 ? row[idx.is_undervalued] : false
    };

    const diagnosis = {
      diagnosis_state: idx.diagnosis > -1 ? row[idx.diagnosis] : "",
      priority_bucket: idx.priority > -1 ? row[idx.priority] : ""
    };

    const message = generateOutreachMessage_(m, diagnosis, {});
    sheet.getRange(i + 1, idx.output + 1).setValue(message);
  }

  SpreadsheetApp.getUi().alert("Outreach messages generated.");
}