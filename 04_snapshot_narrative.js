/**
 * Snapshot Narrative Engine v6.4 — Anchor Discipline
 * Rules enforced:
 * - ONE full competitor anchor per snapshot
 * - NO repeated review counts
 * - NO repeated full names across paragraphs
 * - Paragraph 2 must ADVANCE (not restate)
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const pressure = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const ctx = buildNarrativeContext_(m);

  const mirror = buildMirrorSummary_(m, diagnosisState, ctx);
  const market = buildMarketSummary_(m, diagnosisState, ctx);
  const consequence = buildConsequenceSummary_(m, diagnosisState);
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
 * CONTEXT (STATEFUL)
 * =========================
 */
function buildNarrativeContext_(m) {
  return {
    anchorUsed: false,
    anchorName: "",
    anchorReviews: 0
  };
}

function getPrimaryCompetitor_(m) {
  const name = String(m.comp_1_name || "").trim();
  const reviews = Math.round(m.comp_1_reviews || 0);

  if (!name || name.toLowerCase() === "unknown") return null;

  return { name, reviews };
}

function getFullAnchor_(comp) {
  if (!comp) return "";
  if (comp.reviews > 0) {
    return `${comp.name} at roughly ${comp.reviews} reviews`;
  }
  return comp.name;
}

/**
 * =========================
 * MIRROR (ONLY PLACE FULL ANCHOR CAN FIRE)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, ctx) {
  const comp = getPrimaryCompetitor_(m);
  const isAuto = isAutoRetailCategory_(m);

  if (diagnosisState === "Constrained Operator") {
    if (comp && !ctx.anchorUsed) {
      ctx.anchorUsed = true;
      ctx.anchorName = comp.name;
      ctx.anchorReviews = comp.reviews;

      return `This is not a weak store. But stronger dealerships like ${getFullAnchor_(comp)} are winning buyer confidence before this store gets a fair shot. That is forcing the sale to start from behind.`;
    }

    return `This is not a weak store. But stronger dealerships are winning buyer confidence before this store gets a fair shot, forcing the sale to start from behind.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    if (comp && !ctx.anchorUsed) {
      ctx.anchorUsed = true;
      ctx.anchorName = comp.name;

      return `This store is already in the serious consideration set. The problem is that it is not the dealership buyers default to first, especially when stores like ${comp.name} are setting the safer first impression.`;
    }

    return `This store is already in the serious consideration set, but it is not the default choice buyers commit to without comparison.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `There is more substance here than the market is currently giving this store credit for. The operation looks lighter than it really is, which means buyers are seeing it as one option in the mix instead of a dealership that deserves stronger consideration early.`;
  }

  return `The business is not positioned strongly enough early in the decision process.`;
}

/**
 * =========================
 * MARKET (NO FULL ANCHOR, ONLY CONCEPTUAL ESCALATION)
 * =========================
 */
function buildMarketSummary_(m, diagnosisState, ctx) {
  const location = buildMarketLabel_(m);

  if (diagnosisState === "Constrained Operator") {
    return `In ${location}, this is a heavy-proof market. Once a dealership reaches that level of visible trust, it starts shaping how buyers interpret the rest of the field. By the time this store enters serious consideration, the standard has already been set.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `In ${location}, several dealerships already clear the credibility bar. At that point, buyers are not just looking for a legitimate option — they are leaning toward the one that feels most established and easiest to trust without further comparison.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `In ${location}, buyers already have enough visible trust signals guiding where they look first. The issue is not missing proof — it is that this store is not carrying enough weight inside that layer to be prioritized early.`;
  }

  return `In ${location}, visible trust strongly influences who gets considered first.`;
}

/**
 * =========================
 * CONSEQUENCE
 * =========================
 */
function buildConsequenceSummary_(m, diagnosisState) {

  if (diagnosisState === "Constrained Operator") {
    return `This store is losing deals it should be winning. Instead of letting inventory and sales process work from a neutral position, the shopper is already leaning elsewhere. That creates more comparison, more price pressure, and weaker gross.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `Deals are being won, but not as cleanly as they should be. Buyers are still comparing heavily, which compresses margins and reduces first-choice conversion.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The store is doing enough business to be credible, but not getting the return it should from that activity. Too many opportunities turn into comparisons instead of clean wins.`;
  }

  return `The business is not converting its position into strong commercial outcomes.`;
}

/**
 * =========================
 * DIRECTION
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to take back the early position so stronger competitors stop setting the tone before you.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to become the obvious choice so buyers stop comparing as heavily.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is to make the market recognize the true weight of the operation earlier.`;
  }

  return `The priority is to strengthen early positioning in the market.`;
}

/**
 * =========================
 * SHARED HELPERS
 * =========================
 */
function isAutoRetailCategory_(m) {
  const s = String(m.category || "").toLowerCase();
  return s.indexOf("car") !== -1 || s.indexOf("dealer") !== -1 || s.indexOf("auto") !== -1;
}