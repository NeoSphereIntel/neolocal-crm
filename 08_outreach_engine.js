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
      return "You're stronger than the market is giving you credit for.";

    case "Competitive but Not Dominant":
    case "Competing But Not Default":
      return "You're in the mix, but not controlling the decision.";

    case "Constrained Operator":
      return "You're getting beat earlier in the process than you should be.";

    case "Considered But Not Safe":
      return "You're being taken seriously, but not trusted first.";

    case "Invisible":
      return "You should be showing up stronger than you currently are.";

    case "Outgunned":
      return "Stronger visible competitors are shaping trust before buyers really compare options.";

    case "Undersignaled":
      return "The business looks lighter in public than it likely is in reality.";

    case "Contender":
      return "You're closer to controlling the decision than it probably looks from the outside.";

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
    return "This still looks winnable, but the opening won't stay soft forever.";
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

/* ============================================================================
   MARKET INTELLIGENCE OUTREACH ENGINE (v2)
   Shadow pattern — old functions above are unchanged.
   generateMarketIntelOutreach_ is the new entry point.
============================================================================ */

/**
 * Main entry point. Returns { cold_email, dm, follow_up }.
 * @param {Object} lead - lead object from normalizeLocalResults_ second pass
 * @param {Object} marketCapture - result of calculateMarketCapture_
 * @param {Object} peerBand - result of calculatePeerBand_
 */
function generateMarketIntelOutreach_(lead, marketCapture, peerBand) {
  const sig      = getSignatureName_();
  const name     = String(lead.business_name || lead.title || "").trim();
  const city     = String(lead.city || "your market").trim();
  const category = String(lead.category || "business").trim();
  const diag     = String(marketCapture.diagnosis || "").trim();
  const dims     = marketCapture.dimension_scores || {};
  const weakest  = getMIWeakDims_(dims, 3);
  const topTopic = getMITopReviewTopic_(lead.review_topics);

  return {
    cold_email: buildMIColdEmail_(lead, name, city, category, diag, dims, weakest, topTopic, peerBand, sig),
    dm:         buildMIDM_(lead, name, city, category, diag, dims, weakest, sig),
    follow_up:  buildMIFollowUp_(lead, name, city, category, diag, dims, weakest, topTopic, sig)
  };
}

/** Sorts all five dimensions weakest-first. Returns [{key, label, score}]. */
function getMIWeakDims_(dims, count) {
  const all = [
    { key: "discovery_position_score",      label: "Discovery Position" },
    { key: "profile_authority_score",        label: "Profile Authority" },
    { key: "trust_surface_score",            label: "Trust Surface" },
    { key: "owner_engagement_score",         label: "Owner Engagement" },
    { key: "competitive_displacement_score", label: "Competitive Displacement" }
  ];
  return all
    .map(d => ({ key: d.key, label: d.label, score: Number(dims[d.key] || 0) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count || 2);
}

/** Returns the highest-mention keyword from review_topics JSON. Empty string if unavailable. */
function getMITopReviewTopic_(reviewTopicsJson) {
  if (!reviewTopicsJson) return "";
  try {
    const topics = JSON.parse(String(reviewTopicsJson));
    if (!Array.isArray(topics) || !topics.length) return "";
    const sorted = topics.slice().sort((a, b) => (Number(b.mentions) || 0) - (Number(a.mentions) || 0));
    return String(sorted[0].keyword || "").trim();
  } catch (e) {
    return "";
  }
}

/** Hook sentence by diagnosis — opens the cold email. Never leads with review counts. */
function getMIOutreachHook_(diagnosis, category, city, lead) {
  const pos       = Number(lead.maps_position || 0);
  const compAbove = pos > 1 ? pos - 1 : 0;
  const aboveStr  = compAbove > 1
    ? compAbove + " competitors are"
    : (compAbove === 1 ? "a competitor is" : "stronger operators are");

  switch (diagnosis) {
    case "Ghost":
      return "We mapped " + category + " visibility in " + city + " and your business doesn't appear in the discovery surface where customers are searching.";

    case "Outgunned":
      return "We mapped " + category + " visibility in " + city + " — " + aboveStr + " capturing the discovery surface ahead of you, and the gap is compounding.";

    case "Underdog":
      return "We mapped " + category + " visibility in " + city + " and something stood out — your operational signals suggest you should be more visible than your current position shows.";

    case "Contender":
      return "We mapped " + category + " visibility in " + city + " — your business is competitive, but you're not yet controlling the top positions.";

    case "Anchor":
      return "We mapped " + category + " visibility in " + city + " — your business leads the discovery surface, and there are specific ways to make that position harder to close.";

    default:
      return "We mapped " + category + " visibility in " + city + " and a few things about your position stood out.";
  }
}

/** Shorter displacement-first hook for the DM. */
function getMIDisplacementHook_(diagnosis, category, city, lead) {
  const comp1 = String(lead.comp_1_name || "").trim();
  const pos   = Number(lead.maps_position || 0);

  switch (diagnosis) {
    case "Ghost":
      return (comp1 ? comp1 + " and similar operators are" : "Other operators are") +
        " capturing the " + category + " discovery surface in " + city + " — your business isn't in the set customers are choosing from.";

    case "Outgunned":
      return (comp1 ? comp1 + " and the operators above you are" : "Competitors ahead of you are") +
        " building verified footprint consistently — the discovery gap widens as they do.";

    case "Underdog":
      return "You're doing the work but the discovery profile isn't reflecting it — that gap costs market capture in " + city + " every week it sits.";

    case "Contender":
      return "You're close to the front of " + city + "'s " + category + " results — a couple of specific gaps are keeping you from the lead position.";

    default:
      return "Your discovery presence in " + city + " is already strong — there's an angle here to make it harder to close.";
  }
}

/** One-sentence dimensional insight for the weakest dimension. */
function getMIDimInsightLine_(weakDim, lead, city, category, topTopic) {
  if (!weakDim) return "";

  const pos   = Number(lead.maps_position || 0);
  const comp1 = String(lead.comp_1_name || "").trim();

  switch (weakDim.key) {
    case "discovery_position_score":
      if (pos > 0) {
        return "At position " + pos + " in " + city + "'s " + category + " results, you're outside the range where most customers make a decision — positions 1–3 capture the majority of attention before anyone digs deeper.";
      }
      return "Your business isn't appearing in the primary discovery positions where customers are searching for " + category + " in " + city + ".";

    case "profile_authority_score":
      return "The verified signals your profile carries — operational photos, service details, booking access — trail what the operators above you project. That gap affects how search engines and AI tools rank confidence in your listing." +
        (topTopic ? " Even with customers mentioning " + topTopic + ", that activity isn't structured into your profile in a way the market can read." : "");

    case "trust_surface_score":
      if (topTopic) {
        return "Customers are mentioning " + topTopic + " — that's real signal. But the trust surface your profile projects relative to " + (comp1 || "similar operators") + " isn't reflecting the level of activity you're likely running.";
      }
      return "The verified footprint your profile projects trails " + (comp1 ? comp1 + " and similar operators" : "your peer band") + " in " + city + " — the public-facing signals don't match what your operation likely looks like in practice.";

    case "owner_engagement_score":
      return (comp1 ? comp1 + " and the" : "The") + " operators above you are projecting active management — responses, photo updates, operational signals. Your profile reads static, which search engines interpret as lower ongoing relevance.";

    case "competitive_displacement_score":
      return "The " + category + " market in " + city + " is competitive — without a stronger verified footprint, the operators above you continue consolidating discovery share and the gap becomes harder to close.";

    default:
      return "";
  }
}

/** Operator context line for cold email. Returns empty string if no operator intel present. */
function getMIOperatorOutreachLine_(lead) {
  const band   = String(lead.operator_scale_band || "").trim();
  const model  = String(lead.operator_business_model || "").trim();
  const volume = String(lead.operator_monthly_volume || "").trim();
  const fit    = Number(lead.operator_fit_score || 0);

  if (!band && !model) return "";

  const scaleDesc  = band ? "a " + band.toLowerCase() + " operation" : "an operation your size";
  const volumeDesc = volume ? " handling roughly " + volume + " jobs per month" : "";

  let fitLine = "";
  if (fit >= 80)      fitLine = "your market capture already outpaces operators at your scale — there's room to push the gap further.";
  else if (fit >= 60) fitLine = "your position is solid for an operation your size, with specific gaps worth closing.";
  else if (fit >= 40) fitLine = "you're capturing less discovery share than similar operations typically do — correctable.";
  else if (fit > 0)   fitLine = "there's a meaningful gap between what your operation produces and what the market can see.";

  if (!fitLine) return "";
  return "For " + scaleDesc + volumeDesc + ", " + fitLine;
}

/* --- Cold Email ----------------------------------------------------------- */

function buildMIColdEmail_(lead, name, city, category, diagnosis, dims, weakest, topTopic, peerBand, sig) {
  const hook       = getMIOutreachHook_(diagnosis, category, city, lead);
  const dimInsight = getMIDimInsightLine_(weakest[0], lead, city, category, topTopic);
  const opLine     = getMIOperatorOutreachLine_(lead);

  const parts = ["Hi,", "", hook];
  if (dimInsight) parts.push("", dimInsight);
  if (opLine)     parts.push("", opLine);
  parts.push(
    "",
    "If you want, I can walk you through exactly where this shows up locally — takes about 10 minutes, no pitch.",
    "",
    "— " + sig
  );

  return parts.join("\n");
}

/* --- DM (under 100 words) ------------------------------------------------- */

function buildMIDM_(lead, name, city, category, diagnosis, dims, weakest, sig) {
  const hook  = getMIDisplacementHook_(diagnosis, category, city, lead);
  const comp1 = String(lead.comp_1_name || "").trim();

  let question = "";
  switch (diagnosis) {
    case "Ghost":
    case "Outgunned":
      question = "Is that something you've been tracking, or has visibility not been the focus?";
      break;
    case "Underdog":
      question = "Is there a reason the profile hasn't been built out to match the operation?";
      break;
    case "Contender":
      question = "Are you actively working on the profile, or has it mostly been on autopilot?";
      break;
    default:
      question = "Is this a market you're planning to push further, or holding where you are?";
  }

  const lines = [hook];
  if (comp1) lines.push(comp1 + " and similar operators are adding verified footprint consistently.");
  lines.push(question);

  return lines.join(" ") + "\n\n— " + sig;
}

/* --- Follow-Up ------------------------------------------------------------ */

function buildMIFollowUp_(lead, name, city, category, diagnosis, dims, weakest, topTopic, sig) {
  // Deliberately uses second-weakest dimension — different angle from cold email
  const altDim    = weakest[1] || weakest[0];
  const altInsight = getMIDimInsightLine_(altDim, lead, city, category, topTopic);

  let opener = "";
  switch (diagnosis) {
    case "Ghost":
    case "Outgunned":
      opener = "Following up — the " + category + " market in " + city + " is still moving.";
      break;
    case "Underdog":
      opener = "One more angle on this — the gap isn't in the work, it's in what's visible.";
      break;
    case "Contender":
      opener = "Circling back — a specific piece that's worth knowing.";
      break;
    default:
      opener = "One thing worth a quick look before we leave this.";
  }

  const parts = ["Hi,", "", opener];
  if (altInsight) parts.push("", altInsight);
  parts.push(
    "",
    "Worth 10 minutes if the timing works.",
    "",
    "— " + sig
  );

  return parts.join("\n");
}