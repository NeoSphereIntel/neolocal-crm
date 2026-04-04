/**
 * Snapshot Narrative Engine v3 — Tier-Aware (Controlled Blunt)
 * Structure:
 * - Mirror (operator accountability)
 * - Market (external forces)
 * - Consequence (commercial impact)
 * - Direction (what changes)
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const pressure = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const decisionTiming = classifyDecisionTiming_(diagnosisState);

  const mirror = buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming);
  const market = buildMarketSummary_(m, pressure);
  const consequence = buildConsequenceSummary_(m, marketTier, pressure, decisionTiming);
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
 * DECISION TIMING LAYER
 * =========================
 */
function classifyDecisionTiming_(diagnosisState) {
  if (
    diagnosisState === "Competitive but Not Dominant"
  ) return "mid";

  if (
    diagnosisState === "Structured but Under-Amplified" ||
    diagnosisState === "Constrained Operator"
  ) return "late";

  if (
    diagnosisState === "Invisible Operator" ||
    diagnosisState === "Under-Leveraged Inventory" ||
    diagnosisState === "Demand Not Captured"
  ) return "late";

  return "mid";
}

/**
 * =========================
 * MIRROR (CONTROLLED BLUNT)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming) {
  const category = m.category || "market";

  let timingLine = "";
  if (decisionTiming === "late") {
    timingLine = "You are entering the decision after trust is already being assigned.";
  } else if (decisionTiming === "mid") {
    timingLine = "You are being considered, but not prioritized early.";
  } else {
    timingLine = "You are part of the early decision set, but not controlling it.";
  }

  if (marketTier === "Competitive Independents") {
    return [
      `You are not a weak operator in this ${category} market.`,
      `But right now, you are not being chosen early enough.`,
      timingLine,
      `The operation may be solid, but the market is not seeing enough proof early enough to treat you as a default choice.`,
      `That forces you into more comparisons, more price sensitivity, and weaker positioning inside the deal.`
    ].join(" ");
  }

  if (marketTier === "Dominant Operators") {
    return [
      `At your scale, the issue is not credibility.`,
      `The issue is control.`,
      `You are not consistently locking in first-choice status early enough.`,
      `That allows competitors to stay in the decision longer than they should.`
    ].join(" ");
  }

  return [
    `Right now, you are not generating enough visible proof early in the decision process.`,
    timingLine,
    `That means you are being evaluated later, after initial trust has already been assigned elsewhere.`,
    `The operation may be better than it appears, but the market is not seeing it soon enough.`
  ].join(" ");
}

/**
 * =========================
 * MARKET (EXTERNAL REALITY)
 * =========================
 */
function buildMarketSummary_(m, pressure) {
  const location = m.city || "your area";
  const compAvg = Math.round(m.comp_avg_reviews || 0);

  if (pressure === "High") {
    return [
      `In ${location}, buyers shortlist quickly.`,
      `That shortlist is shaped by visible proof — reviews, repetition, and familiarity.`,
      `Right now, the market is clustering around operators with roughly ${compAvg || "stronger"} review signals.`,
      `That means trust is being assigned before full comparison even begins.`
    ].join(" ");
  }

  if (pressure === "Medium") {
    return [
      `In ${location}, buyers still rely heavily on visible signals to guide decisions.`,
      `Operators with stronger proof are consistently being evaluated first.`,
      `That shifts how often other businesses get a fair comparison.`
    ].join(" ");
  }

  return [
    `In ${location}, the market still responds to visible proof when deciding who to trust.`,
    `Businesses that reinforce that proof earlier tend to capture attention first.`
  ].join(" ");
}

/**
 * =========================
 * CONSEQUENCE (COMMERCIAL IMPACT)
 * =========================
 */
function buildConsequenceSummary_(m, marketTier, pressure, decisionTiming) {
  let timingImpact = "";

  if (decisionTiming === "late") {
    timingImpact = "You are competing from behind.";
  } else if (decisionTiming === "mid") {
    timingImpact = "You are competing, but not from a position of strength.";
  } else {
    timingImpact = "You are competing, but not fully controlling the outcome.";
  }

  if (pressure === "High") {
    return [
      timingImpact,
      `That leads to fewer first-choice opportunities, more price-driven conversations, and lower closing leverage.`,
      `You are not losing because of your offer.`,
      `You are losing because of when you are being considered.`
    ].join(" ");
  }

  return [
    timingImpact,
    `That reduces how often you are chosen cleanly without comparison.`,
    `It also increases pressure on pricing and sales conversations.`
  ].join(" ");
}

/**
 * =========================
 * DIRECTION (WHAT CHANGES)
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {

  if (diagnosisState === "Invisible Operator") {
    return `The priority is to establish enough visible proof that the business is treated as a credible option early in the decision process.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to reduce competitive pressure by strengthening early trust signals so the business is not constantly compared from behind.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is to shift when trust is assigned, so the business moves from being seen to being chosen earlier.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to increase first-choice preference and reduce reliance on comparison.`;
  }

  return `The priority is to strengthen visible authority so the market assigns more confidence earlier.`;
}