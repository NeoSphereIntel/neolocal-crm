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
 * HELPERS
 * =========================
 */
function hasUsableCompetitorName_(name) {
  const s = String(name || "").trim().toLowerCase();
  if (!s) return false;
  if (s === "the strongest visible competitor") return false;
  if (s === "a stronger visible competitor") return false;
  if (s === "stronger visible competitors") return false;
  if (s === "a stronger visible dealership") return false;
  if (s === "the strongest visible dealership") return false;
  if (s === "stronger competing dealerships") return false;
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
 * MIRROR (CONTROLLED BLUNT)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier, decisionTiming) {
  const category = safeText_(m.category || "market");
  const reviews = Math.round(m.reviews_count || 0);
  const topCompetitor = safeText_(m.comp_1_name || "");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const hasNamedCompetitor = hasUsableCompetitorName_(topCompetitor);

  if (marketTier === "Dominant Operators") {
    return [
      `At your scale, the problem is not legitimacy.`,
      `The problem is that you are not locking the decision early enough.`,
      `You are leaving room for competitors to stay in the buyer's consideration longer than they should.`,
      `That means the business has authority, but is not converting that authority into full control.`
    ].join(" ");
  }

  if (marketTier === "Competitive Independents") {
    return [
      `You are not a weak operator in this ${category} market.`,
      `But stronger stores are setting trust before you are seriously considered.`,
      decisionTiming === "late"
        ? `Buyers are giving other dealerships the benefit of the doubt before your business has earned that same confidence.`
        : `Your business is being considered, but not strongly enough to become the default choice early.`,
      hasNamedCompetitor
        ? `${topCompetitor}${topCompetitorReviews ? `, at roughly ${topCompetitorReviews} reviews,` : ""} is giving buyers more confidence, earlier.`
        : `Other stores are giving buyers more confidence, earlier.`,
      `That pushes you into more comparison, more price pressure, and less leverage once the conversation starts.`
    ].join(" ");
  }

  return [
    `Right now, the business is not giving buyers enough proof to trust it early.`,
    `At roughly ${reviews} reviews, it is still too easy to read this operation as uncertain before the real offer is even considered.`,
    decisionTiming === "late"
      ? `That means the business is entering the decision after confidence is already leaning elsewhere.`
      : `That means the business is being noticed without being strongly prioritized.`,
    `The issue is not just visibility. The issue is that trust is showing up too late to shape the choice.`
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
  const topCompetitor = safeText_(m.comp_1_name || "");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const hasNamedCompetitor = hasUsableCompetitorName_(topCompetitor);

  if (pressure === "High") {
    const avgScale = getReviewScaleLabel_(compAvg);
    const leaderScale = getReviewScaleLabel_(topCompetitorReviews || compMax);

    return [
      `In ${location}, buyers are not evaluating every dealership from scratch.`,
      `They are shortlisting quickly based on who looks more established before inventory, pricing, financing, or service get a full comparison.`,
      compAvg > 0
        ? `This is already a heavy-proof market: the visible trust benchmark sits in ${avgScale}, and the strongest operators are playing in ${leaderScale}.`
        : `This is already a heavy-proof market, where the stronger operators carry materially heavier public trust.`,
      hasNamedCompetitor && (topCompetitorReviews || compMax) > 0
        ? `${topCompetitor} is one of the dealers helping set that standard${topCompetitorReviews ? ` at roughly ${topCompetitorReviews} reviews` : ""}.`
        : `That means buyers already have stronger trust anchors before the first serious conversation even starts.`,
      `So the market is not neutral. It is already tilted toward the dealerships that look more proven on the surface.`
    ].join(" ");
  }

  if (pressure === "Medium") {
    return [
      `In ${location}, buyers still rely heavily on visible proof when deciding where to trust first.`,
      compAvg > 0
        ? `The trust benchmark is already meaningful, with the market sitting around ${compAvg} reviews on average.`
        : `The trust benchmark is already meaningful, and stronger operators are still being evaluated first.`,
      `That does not guarantee they are better. It means they are being treated as more credible earlier.`
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
function buildConsequenceSummary_(m, diagnosisState, marketTier, pressure, decisionTiming) {
  let openingLine = "";

  if (decisionTiming === "late") {
    openingLine = "You are competing from behind.";
  } else if (decisionTiming === "mid") {
    openingLine = "You are competing, but not from the strongest position.";
  } else {
    openingLine = "You are competing early, but not locking the outcome cleanly enough.";
  }

  if (pressure === "High") {
    if (String(m.category || "").toLowerCase().indexOf("car") !== -1 || String(m.category || "").toLowerCase().indexOf("dealer") !== -1) {
      return [
        openingLine,
        `That means cleaner first-contact opportunities are going elsewhere, more shoppers stay in comparison mode, and gross gets pressured harder than it should.`,
        `The inventory may be competitive, but it has to work harder because the store is not starting from the strongest position.`,
        `This is not just a visibility problem. It is a deal-quality problem.`
      ].join(" ");
    }

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
    return `The priority is to stop starting the sale from behind by giving buyers enough confidence to take this business seriously earlier.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is not more generic presence. It is to make the business feel established sooner so buyers stop pushing it into comparison mode by default.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to turn credibility into first-choice preference so the business is not forced to keep winning deals through heavier comparison.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The priority is to stop letting operational value arrive too late and make the visible proof strong enough that buyers feel more confident earlier in the process.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The priority is to close the gap between what the business can support operationally and what the market feels confident buying from early.`;
  }

  return `The priority is to strengthen visible proof so the market assigns trust earlier and the business stops selling from a weaker position.`;
}