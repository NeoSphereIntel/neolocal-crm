/**
 * File: 04_snapshot_narrative.js
 * Snapshot Narrative Engine v3
 * Tier-aware narrative mapping:
 * market_tier -> perspective
 * diagnosis_state -> tension
 * market_pressure_band -> intensity
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const verticalKey = determineVerticalType_(m);
  const profile = getVerticalProfile_(verticalKey);

  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const marketPressureBand = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const marketPositionSummary = buildTierAwareMarketPositionSummary_(
    m,
    profile,
    verticalKey,
    diagnosisState,
    marketTier,
    marketPressureBand
  );

  const strategicGapSummary = buildTierAwareStrategicGapSummary_(
    m,
    profile,
    verticalKey,
    diagnosisState,
    marketTier,
    marketPressureBand
  );

  const actionImplicationSummary = buildTierAwareActionImplicationSummary_(
    m,
    profile,
    verticalKey,
    diagnosisState,
    marketTier,
    marketPressureBand
  );

  const strategicDirectionSummary = buildTierAwareStrategicDirectionSummary_(
    m,
    profile,
    verticalKey,
    diagnosisState,
    marketTier,
    marketPressureBand
  );

  return {
    market_position_summary: marketPositionSummary,
    strategic_gap_summary: strategicGapSummary,
    action_implication_summary: actionImplicationSummary,
    snapshot_narrative: [
      diagnosisState + ".",
      marketPositionSummary,
      strategicGapSummary,
      actionImplicationSummary,
      strategicDirectionSummary
    ].join("\n\n")
  };
}

function buildTierAwareMarketPositionSummary_(m, profile, verticalKey, diagnosisState, marketTier, marketPressureBand) {
  const location = buildMarketLabel_(m);
  const category = safeText_(m.category || profile.label || "market");
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const topCompetitor = safeText_(m.comp_1_name || "a stronger visible operator");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const modifierLine = buildAutoRetailModifierLine_(m, diagnosisState, verticalKey);

  if (marketTier === "Dominant Operators") {
    return [
      `In the ${category} market in ${location}, this business is already operating at a scale where the issue is not basic credibility. It is control.`,
      `The market is still assigning visible authority quickly, and stronger operators like ${topCompetitor}${topCompetitorReviews ? ` at roughly ${topCompetitorReviews} reviews` : ""} are shaping what buyers read as the safe default before direct comparison begins.`,
      modifierLine
    ].filter(Boolean).join(" ");
  }

  if (marketTier === "Competitive Independents") {
    return [
      `In the ${category} market in ${location}, this business is not being read like a fringe operator. It is in the competitive set.`,
      `The problem is that visible authority is consolidating faster around stronger signals. With the market clustering around roughly ${compAvg || "an established"} review level, buyers are still being nudged toward operators such as ${topCompetitor}${topCompetitorReviews ? ` showing around ${topCompetitorReviews} reviews` : ""} before the real offer gets weighed fairly.`,
      modifierLine
    ].filter(Boolean).join(" ");
  }

  return [
    `In the ${category} market in ${location}, buyers are still making fast trust decisions from surface proof.`,
    `Right now, the business does not appear to be carrying enough visible weight to feel established early in the decision path, especially against operators like ${topCompetitor}${topCompetitorReviews ? ` with roughly ${topCompetitorReviews} visible reviews` : ""}.`,
    modifierLine
  ].filter(Boolean).join(" ");
}

function buildTierAwareStrategicGapSummary_(m, profile, verticalKey, diagnosisState, marketTier, marketPressureBand) {
  const reviews = Math.round(m.reviews_count || 0);
  const reviewGap = Math.round(m.review_gap || 0);

  if (diagnosisState === "Invisible Operator") {
    return `The current gap is basic market legibility. At roughly ${reviews} reviews, the business is still not projecting enough visible proof to be read as established before buyers start filtering options.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `This is not a beginner problem. It is a pressure problem. The business can be credible in reality, but in a harder market it is still being compressed by stronger visible operators, which leaves it commercially under-positioned despite having real operating substance.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The structural gap appears to be translation, not only trust. Inventory exists, but it is not being converted into enough visible market weight to change how the business is read relative to stronger dealerships already shaping buyer confidence.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The business appears to have more operating depth than the market is currently rewarding. That means existing demand is not being absorbed at the level the underlying operation should support, because the visible trust layer is still too thin at the moment buyers decide who feels safest.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The business is no longer invisible. The gap is that real structure is still being under-amplified in public. Buyers can see that it exists, but not yet strongly enough to assign it the confidence given to more visibly reinforced competitors.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `This is now a share and preference gap, not a legitimacy gap. The business is competing, but it is still short of becoming the option the market defaults to first. In practical terms, it is credible, but not yet decisive.`;
  }

  return `The visible trust layer is still underweight relative to the market standard, and that is shaping how buyers interpret the business before the underlying offer is properly considered.`;
}

function buildTierAwareActionImplicationSummary_(m, profile, verticalKey, diagnosisState, marketTier, marketPressureBand) {
  const topCompetitor = safeText_(m.comp_1_name || "stronger competitors");

  if (marketPressureBand === "High") {
    if (marketTier === "Competitive Independents") {
      return `Because this is a high-pressure market, the commercial cost is not just fewer leads. It is weaker position inside the deal. When operators like ${topCompetitor} lock in buyer confidence earlier, comparisons become harder, objections get stickier, and margin tends to compress.`;
    }

    if (marketTier === "Emerging Operators") {
      return `Because this is a high-pressure market, the business can be filtered out before serious comparison even starts. That means losses happen upstream, before service quality, inventory, pricing, or operational strengths get a fair read.`;
    }

    return `Because this is a high-pressure market, small visible gaps do not stay small for long. If authority is not reinforced, competitors can steadily narrow first-choice preference even when the operation itself remains strong.`;
  }

  if (marketPressureBand === "Medium") {
    return `In a medium-pressure market, the cost is more selective but still meaningful. The business can remain active while still losing the cleaner, higher-intent opportunities to competitors who look slightly safer or more proven at first glance.`;
  }

  return `In a lower-pressure market, the business still has room to move, but the current gap continues to suppress how often it becomes the obvious choice rather than one option among many.`;
}

function buildTierAwareStrategicDirectionSummary_(m, profile, verticalKey, diagnosisState, marketTier, marketPressureBand) {
  if (diagnosisState === "Invisible Operator") {
    return `The strategic move is to establish visible legitimacy fast enough that the market stops reading the business as under-proven. This is still highly movable because the weakness is concentrated in interpretation, not necessarily in the operation itself.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The strategic move is not cosmetic polish. It is pressure relief. The business needs enough visible reinforcement to stop stronger operators from setting the confidence frame before it gets properly compared.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The strategic move is to turn inventory depth into clearer public weight. Right now, operational substance is not being translated into enough market authority to influence buyer choice early enough.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The strategic move is to make the market pay the business for the strength it already has. That means densifying proof, strengthening trust transfer, and reducing the gap between operating depth and perceived purchase safety.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The strategic move is amplification, not reinvention. The business already has enough structure to be taken seriously. What it lacks is enough reinforced proof to shift from being seen to being favored.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The strategic move is precision. At this level, the goal is not to prove the business exists. It is to increase default preference and harden first-choice status before competitors keep closing the confidence gap.`;
  }

  return `The strategic move is to strengthen visible authority until the market assigns the business more of the confidence its underlying operation should already deserve.`;
}

function buildAutoRetailModifierLine_(m, diagnosisState, verticalKey) {
  if (verticalKey !== "auto_retail") return "";

  const inventoryLevel = String(m.inventory_level || "").trim().toLowerCase();
  const hasServiceDepartment = /^(yes|true|1)$/i.test(String(m.service_department || "").trim());

  const parts = [];

  if (inventoryLevel === "low" || inventoryLevel === "limited") {
    parts.push("Inventory depth appears constrained, which makes visible trust even more important because the lot has less room to win purely on selection breadth.");
  }

  if (hasServiceDepartment) {
    parts.push("The presence of a service department suggests more operating depth than a basic lot profile alone would imply, which increases the cost of being under-read by the market.");
  }

  return parts.join(" ");
}