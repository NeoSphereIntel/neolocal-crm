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
  if (diagnosisState === "Competitive but Not Dominant") return "mid";

  if (
    diagnosisState === "Structured but Under-Amplified" ||
    diagnosisState === "Constrained Operator" ||
    diagnosisState === "Invisible Operator" ||
    diagnosisState === "Under-Leveraged Inventory" ||
    diagnosisState === "Demand Not Captured"
  ) {
    return "late";
  }

  return "mid";
}

/**
 * =========================
 * MIRROR (CONTROLLED BLUNT)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming) {
  const category = safeText_(m.category || "market");
  const reviews = Math.round(m.reviews_count || 0);
  const topCompetitor = safeText_(m.comp_1_name || "the strongest visible competitor");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const hasNamedCompetitor = topCompetitor && topCompetitor !== "the strongest visible competitor";

  if (marketTier === "Dominant Operators") {
    return [
      `At your scale, the problem is not whether the business looks legitimate.`,
      `The problem is that you are not locking the decision early enough.`,
      `You are leaving enough room for competitors to stay alive in the buyer's mind longer than they should.`,
      `That means authority exists, but it is not being converted into full control.`
    ].join(" ");
  }

  if (marketTier === "Competitive Independents") {
    return [
      `You are not a weak operator in this ${category} market.`,
      `But you are still arriving too late in the decision.`,
      decisionTiming === "late"
        ? `Trust is being assigned before your business has done enough to deserve serious priority.`
        : `Your business is being considered, but not strongly enough to become the safe default early.`,
      hasNamedCompetitor
        ? `${topCompetitor}${topCompetitorReviews ? ` at roughly ${topCompetitorReviews} reviews` : ""} is giving buyers a stronger reason to feel safe sooner.`
        : `Stronger visible competitors are giving buyers a stronger reason to feel safe sooner.`,
      `That pushes you into more comparison, more price sensitivity, and weaker leverage inside the deal.`
    ].join(" ");
  }

  return [
    `Right now, the business is not giving buyers enough proof to trust it early.`,
    `At roughly ${reviews} reviews, it is still too easy to read this operation as uncertain before the real offer is even considered.`,
    decisionTiming === "late"
      ? `That means the business is entering the decision after confidence is already leaning elsewhere.`
      : `That means the business is being noticed without being strongly prioritized.`,
    `The issue is not only visibility. The issue is that trust is arriving too late to shape the choice.`
  ].join(" ");
}

/**
 * =========================
 * MARKET (EXTERNAL REALITY)
 * =========================
 */
function buildMarketSummary_(m, pressure) {
  const location = buildMarketLabel_(m);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);
  const topCompetitor = safeText_(m.comp_1_name || "a stronger visible competitor");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (pressure === "High") {
    return [
      `In ${location}, buyers are not evaluating every dealership from scratch.`,
      `They are shortlisting quickly based on who looks safer to buy from before inventory, pricing, or financing gets a full comparison.`,
      compAvg > 0
        ? `The visible market average is around ${compAvg} reviews, while stronger operators like ${topCompetitor} are showing closer to ${topCompetitorReviews || compMax}.`
        : `Stronger operators are already carrying materially heavier public proof.`,
      `That gives the market a built-in bias before the first serious conversation even starts.`
    ].join(" ");
  }

  if (pressure === "Medium") {
    return [
      `In ${location}, buyers still lean heavily on visible proof when deciding where to trust first.`,
      compAvg > 0
        ? `With the market sitting around ${compAvg} reviews, businesses with stronger proof are more likely to be evaluated first.`
        : `Businesses with stronger proof are more likely to be evaluated first.`,
      `That does not guarantee they are better. It means they are being treated as safer earlier.`
    ].join(" ");
  }

  return [
    `In ${location}, visible proof still influences who gets trusted first.`,
    `Businesses that reinforce trust earlier are more likely to capture the cleaner opportunity before comparison gets crowded.`
  ].join(" ");
}

/**
 * =========================
 * CONSEQUENCE (COMMERCIAL IMPACT)
 * =========================
 */
function buildConsequenceSummary_(m, marketTier, pressure, decisionTiming) {
  let openingLine = "";

  if (decisionTiming === "late") {
    openingLine = "You are competing from behind.";
  } else if (decisionTiming === "mid") {
    openingLine = "You are competing, but not from the strongest position.";
  } else {
    openingLine = "You are competing early, but not locking the outcome cleanly enough.";
  }

  if (pressure === "High") {
    return [
      openingLine,
      `That means fewer first-choice opportunities, more price-sensitive conversations, and lower closing leverage.`,
      `The business is not only losing attention.`,
      `It is losing position inside the sale because trust is being assigned earlier to someone else.`
    ].join(" ");
  }

  return [
    openingLine,
    `That reduces how often the business gets chosen cleanly without heavy comparison.`,
    `It also puts more pressure on pricing, sales conversations, and follow-up to win deals that should feel easier.`
  ].join(" ");
}

/**
 * =========================
 * DIRECTION (WHAT CHANGES)
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {
  if (diagnosisState === "Invisible Operator") {
    return `The priority is to stop asking buyers for blind trust and give them enough proof to treat the business as safe to consider early.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to reduce how often the business enters the sale from behind by strengthening trust early enough to change the comparison frame.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is not more generic presence. It is to shift when trust gets assigned so the business is taken seriously sooner and compared less from the back foot.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to turn credibility into first-choice preference so the business is not forced to keep winning deals through heavier comparison.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The priority is to stop letting operational value arrive too late and make the visible proof strong enough that buyers feel safer earlier in the process.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The priority is to close the gap between what the business can support operationally and what the market feels safe buying from early.`;
  }

  return `The priority is to strengthen visible proof so the market assigns trust earlier and the business stops selling from a weaker position.`;
}