/**
 * Snapshot Narrative Engine v5.1 — Texture Pass
 * Same structure, improved realism:
 * - varied sentence rhythm
 * - grounded lines
 * - less template feel
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const pressure = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const mirror = buildMirrorSummary_(m, diagnosisState, marketTier);
  const market = buildMarketSummary_(m, diagnosisState, pressure);
  const consequence = buildConsequenceSummary_(m, diagnosisState, pressure);
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
 * HELPERS
 * =========================
 */
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
 * MIRROR (TEXTURED)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier) {
  const category = safeText_(m.category || "market");

  if (diagnosisState === "Invisible Operator") {
    return `Right now, this business is not getting seriously considered early enough in the ${category} market. Buyers are making decisions before they have enough reason to trust it. In practice, that means it is being filtered out before the real offer is even evaluated.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `You are not a weak operator in this ${category} market. But you should be winning more of these opportunities, and stronger stores are taking the early position instead. This is where a good operation still ends up losing ground.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The business is solid, but it is not showing up with enough weight. In practice, it is better than how it is currently being perceived by the market. You’re doing enough business to be taken seriously, but not enough to shape how buyers decide.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `You are already competing at a high level in this ${category} market, but you are not the default choice. Buyers include you early, but they are not committing without comparison. You’re in the shortlist, but not the easy choice.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The business likely has competitive inventory, but buyers are not reaching it with enough confidence. The vehicles are there, but the trust needed to engage with them is not strong enough early.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The business is capable of handling more demand than it is currently capturing. The work exists, but it is not being absorbed at the level it should be.`;
  }

  return `The business is not positioned strongly enough early in the decision process.`;
}

/**
 * =========================
 * MARKET (TEXTURED)
 * =========================
 */
function buildMarketSummary_(m, diagnosisState, pressure) {
  const location = buildMarketLabel_(m);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);

  const avgScale = getReviewScaleLabel_(compAvg);
  const leaderScale = getReviewScaleLabel_(compMax);

  if (diagnosisState === "Constrained Operator") {
    return `In ${location}, stronger operators are already shaping buyer confidence early. This is a heavy-proof market where leading dealerships are operating in ${leaderScale}. By the time your business enters the conversation, the tone is often already set.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `In ${location}, the market already has enough visible trust signals to guide decisions. The issue is not that trust is missing — it is that your business is not contributing enough to that layer to stand out early.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `In ${location}, several operators already meet the trust threshold. Buyers are not just looking for a credible option — they are leaning toward the one that feels like the most established choice.`;
  }

  if (diagnosisState === "Invisible Operator") {
    return `In ${location}, buyers shortlist quickly based on visible proof. Businesses without enough public trust signals are filtered out early, before full comparison even begins.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `In ${location}, buyers decide who to trust before they explore inventory. That means inventory only matters if the business has already earned enough confidence to be explored.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `In ${location}, demand exists, but it is not evenly captured. Businesses that establish stronger trust earlier tend to absorb more of that demand.`;
  }

  return `In ${location}, visible trust plays a central role in who gets considered first.`;
}

/**
 * =========================
 * CONSEQUENCE (TEXTURED)
 * =========================
 */
function buildConsequenceSummary_(m, diagnosisState, pressure) {

  if (diagnosisState === "Invisible Operator") {
    return `Opportunities are being lost before conversations even start. Stronger competitors are getting the first contact, which means better opportunities never reach this business at all.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `You are losing deals you should be winning. Instead of starting from a neutral position, your deals are forced into comparison, which increases price pressure and weakens your position in the sale.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `You’re doing the work, but not getting the return you should from it. Activity is there, but too many opportunities turn into comparisons instead of clean wins.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `You are winning deals, but not efficiently. Buyers are still comparing heavily, which compresses margins and makes strong opportunities harder to close cleanly.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `Inventory is not performing to its potential. Vehicles are not getting the level of attention they should because buyers are not engaging deeply enough early on.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The business is not capturing the full demand available to it. Stronger-positioned competitors are absorbing more opportunities simply because they are trusted earlier.`;
  }

  return `The business is not converting its position into strong commercial outcomes.`;
}

/**
 * =========================
 * DIRECTION (TEXTURED)
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {

  if (diagnosisState === "Invisible Operator") {
    return `The priority is to become visible enough to be considered early.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to take back the early position so stronger competitors stop setting the tone before you.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is to make the market see what is already there, so the business is recognized earlier.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to become the obvious choice so buyers stop comparing as heavily.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The priority is to bring inventory into the trust layer earlier so it can influence decisions sooner.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The priority is to align trust with capacity so the business captures more of the available demand.`;
  }

  return `The priority is to strengthen early positioning in the market.`;
}