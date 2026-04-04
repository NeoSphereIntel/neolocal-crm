/**
 * Snapshot Narrative Engine v4 — Diagnosis-Driven (Controlled Blunt)
 * Each diagnosis has distinct:
 * - mirror meaning
 * - market interaction
 * - commercial consequence
 * - direction
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const pressure = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const decisionTiming = classifyDecisionTiming_(diagnosisState);

  const mirror = buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming);
  const market = buildMarketSummary_(m, pressure);
  const consequence = buildConsequenceSummary_(m, diagnosisState, marketTier, pressure, decisionTiming);
  const direction = buildDirectionSummary_(diagnosisState);

  return {
    market_position_summary: mirror,
    strategic_gap_summary: market,
    action_implication_summary: consequence,
    snapshot_narrative: [
      diagnosisState + ".",
      mirror,
      market,
      consequence,
      direction
    ].join("\n\n")
  };
}

/**
 * =========================
 * DECISION TIMING
 * =========================
 */
function classifyDecisionTiming_(diagnosisState) {
  if (diagnosisState === "Competitive but Not Dominant") return "mid";

  return "late";
}

/**
 * =========================
 * HELPERS
 * =========================
 */
function hasUsableCompetitorName_(name) {
  const s = String(name || "").trim().toLowerCase();
  if (!s) return false;
  if (s.indexOf("competitor") !== -1) return false;
  if (s.indexOf("visible") !== -1) return false;
  if (s.indexOf("stronger") !== -1) return false;
  return true;
}

function getReviewScaleLabel_(count) {
  const n = Math.round(count || 0);

  if (n >= 2000) return "the low thousands";
  if (n >= 1000) return "the high hundreds to low thousands";
  if (n >= 500) return "the high hundreds";
  if (n >= 200) return "the mid hundreds";
  if (n >= 75) return "the low hundreds";
  if (n > 0) return "double-digit to low-hundreds";
  return "visible trust-bearing";
}

/**
 * =========================
 * MIRROR (DIAGNOSIS-DRIVEN)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming) {
  const category = safeText_(m.category || "market");

  if (diagnosisState === "Invisible Operator") {
    return `Right now, the business is not getting seriously considered early enough in this ${category} market. Buyers are making decisions before they have enough reason to trust this business, which means it is being filtered out before the real offer is evaluated.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `You are not a weak operator in this ${category} market. But buyers are trusting stronger stores before they seriously consider you. That means you are entering the decision after confidence is already leaning elsewhere.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The business is credible and structured, but it is not carrying enough visible weight to be prioritized early. Buyers see it, but they are not treating it as a leading option when they make their first shortlist.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The business is firmly in the competitive set, but it is not the default choice. Buyers include it early, but they still feel the need to compare instead of committing quickly.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The business likely has competitive inventory, but buyers are not reaching it with enough confidence. Trust is being decided before inventory gets a fair chance to influence the decision.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The business appears capable of handling more demand than it is currently capturing. Buyers exist, but stronger-positioned competitors are absorbing more of that demand earlier in the decision process.`;
  }

  return `The business is not being positioned strongly enough early in the decision process.`;
}

/**
 * =========================
 * MARKET
 * =========================
 */
function buildMarketSummary_(m, pressure) {
  const location = buildMarketLabel_(m);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);

  if (pressure === "High") {
    const avgScale = getReviewScaleLabel_(compAvg);
    const leaderScale = getReviewScaleLabel_(compMax);

    return `In ${location}, buyers shortlist quickly based on who looks more established. This is a high-trust market where the benchmark sits in ${avgScale}, and leading operators are playing in ${leaderScale}. That creates a strong bias before full comparison begins.`;
  }

  if (pressure === "Medium") {
    return `In ${location}, visible proof still heavily influences who gets evaluated first. Businesses with stronger trust signals are more likely to be considered early.`;
  }

  return `In ${location}, buyers still rely on visible trust signals when deciding who to consider first.`;
}

/**
 * =========================
 * CONSEQUENCE (DIAGNOSIS-DRIVEN)
 * =========================
 */
function buildConsequenceSummary_(m, diagnosisState, marketTier, pressure, decisionTiming) {

  if (diagnosisState === "Invisible Operator") {
    return `The business is losing opportunities before conversations even start. Stronger competitors are getting the first contact, which means better opportunities never reach this business at all.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `You are competing from behind. That leads to more comparison-driven deals, higher price sensitivity, and reduced leverage once negotiations begin.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The business is active, but underperforming relative to its actual capability. Too many opportunities turn into comparisons instead of clean wins.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `Deals are being won, but not cleanly. Buyers are still comparing heavily, which puts pressure on margin and reduces first-choice conversion.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `Inventory is not converting as efficiently as it should. Vehicles are not getting the level of attention they deserve because trust is not strong enough early in the process.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The business is not capturing the full demand available to it. Competitors are absorbing more opportunities simply because they are positioned more strongly at the trust stage.`;
  }

  return `The business is not converting its position into strong commercial outcomes.`;
}

/**
 * =========================
 * DIRECTION (DIAGNOSIS-DRIVEN)
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {

  if (diagnosisState === "Invisible Operator") {
    return `The priority is to establish enough trust early so the business is considered at all.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to stop starting the sale from behind by earning buyer confidence earlier in the decision.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is to convert existing strength into visible proof so the business is prioritized earlier.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to become the default choice so buyers stop comparing as heavily.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The priority is to bring inventory into the trust layer earlier so it can influence decisions sooner.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The priority is to align trust with capacity so the business can absorb more of the available demand.`;
  }

  return `The priority is to strengthen early positioning in the market.`;
}