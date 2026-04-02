/**
 * File: 04_snapshot_narrative.gs
 * Snapshot Narrative Engine
 * - Full custom path for auto retail
 * - Generic vertical-aware fallback for all other niches
 */

/* ============================================================================
   AUTO RETAIL — FULL CUSTOM SNAPSHOT
============================================================================ */

function buildAutoRetailSnapshotNarrativePackage_(m, scores, diagnosis, profile) {
  const verticalKey = determineVerticalType_(m);
  const diagnosisLabel = getDiagnosisDisplayLabel_(diagnosis.diagnosis_state, verticalKey);

  const part1 = buildAutoRetailMarketPressureSummary_(m, diagnosis.diagnosis_state, profile);
  const part2 = buildAutoRetailPerceptionGapSummary_(m, diagnosis.diagnosis_state, profile);
  const part3 = buildAutoRetailCommercialRiskSummary_(m, diagnosis.diagnosis_state, profile);
  const part4 = buildAutoRetailStrategicOpeningSummary_(m, diagnosis.diagnosis_state, profile);

  return {
    market_position_summary: part1,
    strategic_gap_summary: part2,
    action_implication_summary: part3,
    snapshot_narrative: [
      diagnosisLabel + ".",
      part1,
      part2,
      part3,
      part4
    ].join("\n\n")
  };
}

function buildAutoRetailMarketPressureSummary_(m, diagnosisState, profile) {
  const location = buildMarketLabel_(m);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);
  const topCompetitor = safeText_(m.comp_1_name || "a stronger visible dealership");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (compAvg <= 0) {
    return `In the used car market in ${location}, buyers are still making fast trust decisions even when no single dealership fully dominates visible authority.

That matters because shoppers do not evaluate stores from scratch. They usually narrow the field first based on which dealership feels safer, more active, and more proven before inventory gets a full comparison.`;
  }

  return `In the used car market in ${location}, buyer confidence is already being shaped by visible proof before the first conversation happens.

The sampled market appears to cluster around roughly ${compAvg} reviews, while stronger visible operators such as ${topCompetitor} are projecting closer to ${topCompetitorReviews || compMax}. In auto retail, that does not just influence visibility. It influences which dealership feels like the safer place to buy from before vehicles are weighed on their own merits.`;
}

function buildAutoRetailPerceptionGapSummary_(m, diagnosisState, profile) {
  const reviews = Math.round(m.reviews_count || 0);
  const reviewGap = Math.round(m.review_gap || 0);
  const ratio = Number(m.gap_ratio || 0);
  const topCompetitor = safeText_(m.comp_1_name || "the strongest visible dealership");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (diagnosisState === "Invisible") {
    return `At roughly ${reviews} reviews, the dealership is not yet projecting enough visible buyer experience to feel established at first glance.

That does not automatically mean the operation is weak. It means the market is still reading it as under-proven, especially beside stores like ${topCompetitor}${topCompetitorReviews ? ` with around ${topCompetitorReviews} visible reviews` : ""}.`;
  }

  if (diagnosisState === "Outgunned") {
    return `The dealership is being read against a stronger visible market standard and is still trailing that trust layer by roughly ${reviewGap} reviews.

In used car retail, this usually means the store can be credible in reality while still feeling less purchase-safe than competing lots at the exact moment shoppers are filtering options.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `At roughly ${reviews} reviews, the dealership is present enough to be taken seriously, but not yet strong enough to control how it is interpreted.

This is the zone where the business can be legitimate, active, and capable, while still being read as in the mix rather than like the store buyers default to when they want the safest-looking option.`;
  }

  if (diagnosisState === "Contender") {
    return `At roughly ${reviews} reviews, the dealership is no longer under-proven. It is competing.

The gap now is more subtle: the store looks credible, but not yet inevitable. In auto retail, that difference matters because buyers often treat slightly stronger visible proof as a shortcut for deciding where to trust the transaction.`;
  }

  return `At roughly ${reviews} reviews, the dealership is operating with meaningful visible trust in market.

The challenge at this level is no longer basic credibility. It is defending enough visible authority to keep feeling like the safer and more established option as other dealerships continue building momentum.`;
}

function buildAutoRetailCommercialRiskSummary_(m, diagnosisState, profile) {
  const topCompetitor = safeText_(m.comp_1_name || "stronger competing dealerships");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (diagnosisState === "Invisible") {
    return `Commercially, this means the dealership can be filtered out before serious comparison begins.

Shoppers may assign more default trust to ${topCompetitor}${topCompetitorReviews ? ` and similar stores showing around ${topCompetitorReviews} reviews` : ""}, which means opportunities can be lost before inventory, financing flexibility, staff quality, or pricing strategy get a fair read.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This creates a structural sales disadvantage.

Competing dealerships are shaping buyer confidence earlier in the path, so by the time a shopper starts comparing inventory, this store may already feel like the less certain option. That weakens leverage before the vehicles themselves are fully evaluated.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `The commercial cost here is not just fewer leads. It is weaker position inside the deal.

If the dealership looks credible but not fully proven, more buyers hesitate, more comparisons stay open longer, and pricing pressure tends to get harder because trust has not been won early enough.`;
  }

  if (diagnosisState === "Contender") {
    return `At this stage, the risk shifts from being overlooked to being edged out.

The dealership is in the conversation, but small differences in visible confidence can still redirect high-intent shoppers toward the lot that feels slightly safer or more established. In used car retail, close still loses margin.`;
  }

  return `At the top end, the commercial risk becomes defensive rather than foundational.

Once a dealership is already trusted, the issue is protecting default preference so competitors do not gradually narrow the confidence gap and weaken first-choice status over time.`;
}

function buildAutoRetailStrategicOpeningSummary_(m, diagnosisState, profile) {
  if (diagnosisState === "Invisible") {
    return `The upside is that this is still highly movable.

The weakness appears concentrated in visible buyer trust, not necessarily in the underlying business. A stronger proof layer can change how the dealership is read much faster than a full operational rebuild would.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This is recoverable, but it requires density rather than cosmetic polish.

The dealership does not simply need more visibility. It needs enough visible proof and trust reinforcement to reduce a buyer-confidence deficit that is already affecting shopping behavior before contact.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `This is a high-leverage opening because the gap appears to be translation more than capability.

If the dealership’s real strengths are converted into denser public proof, the market can start assigning more of the confidence the business may already deserve operationally.`;
  }

  if (diagnosisState === "Contender") {
    return `The opening here is precision.

The dealership is already credible enough to compete, which means tighter proof density, stronger visible consistency, and better market reading can shift it from being considered to being chosen more often.`;
  }

  return `The opening here is reinforcement.

Once a dealership becomes a visible market anchor, the strategy is no longer about proving legitimacy. It is about hardening leadership signals so the store remains the default-safe option as the market around it keeps evolving.`;
}

/* ============================================================================
   GENERIC VERTICAL-AWARE FALLBACK
============================================================================ */

function buildMarketPressureSummary_(m, diagnosisState, profile) {
  const location = buildMarketLabel_(m);
  const category = safeText_(m.category || profile.label || "market");
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);
  const topCompetitor = safeText_(m.comp_1_name || "a visible competitor");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const proofLanguage = profile.proof_language || "visible public proof";
  const trustDriver = profile.trust_driver || "visible trust and legitimacy";

  if (compAvg <= 0) {
    return `In the ${category} market in ${location}, visible trust does not appear deeply established yet.

That usually means buyers are deciding quickly based on who appears credible fastest. In markets where ${trustDriver} matter, early authority formation becomes especially important.`;
  }

  return `In the ${category} market in ${location}, buyers are not choosing from a blank slate.

Visible trust is already consolidating around businesses that project stronger ${proofLanguage}. The visible market average sits around ${compAvg} reviews, while stronger trust anchors such as ${topCompetitor} are already projecting closer to ${topCompetitorReviews || compMax} reviews.

At that point, the market is no longer just comparing offers. It is pre-sorting businesses by perceived safety.`;
}

function buildPerceptionGapSummary_(m, diagnosisState, profile) {
  const reviews = Math.round(m.reviews_count || 0);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const reviewGap = Math.round(m.review_gap || 0);
  const ratio = Number(m.gap_ratio || 0);
  const topCompetitor = safeText_(m.comp_1_name || "the strongest visible competitor");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const defaultChoice = profile.default_choice_language || "safer local choice";

  if (reviews <= 10) {
    return `At ${reviews} reviews, the business is not yet projecting enough visible experience to feel like the ${defaultChoice}.

That does not necessarily mean the operation is weak. It means the market is still reading it as under-proven, especially beside businesses like ${topCompetitor}${topCompetitorReviews ? ` with roughly ${topCompetitorReviews} visible reviews` : ""}.`;
  }

  if (ratio < 0.50) {
    return `With ${reviews} reviews against a visible market average near ${compAvg}, the business is not just slightly behind — it is materially underweighted in public trust.

The perception gap is wide enough that buyers can interpret competitors as more established before the real offer is seriously compared.`;
  }

  if (ratio < 1.00) {
    return `At ${reviews} reviews, the business is in the conversation, but still trailing the visible market standard by roughly ${reviewGap} reviews.

That sounds modest on paper, but in practice it often changes who feels like the ${defaultChoice} at the decision point.`;
  }

  return `At ${reviews} reviews, the business is operating at a competitive trust level within its market.

The issue here is no longer basic credibility. It is staying weighted enough to remain the ${defaultChoice} as competitors continue reinforcing their proof layer.`;
}

function buildCommercialRiskSummary_(m, diagnosisState, profile) {
  const topCompetitor = safeText_(m.comp_1_name || "stronger competitors");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);
  const primaryRisk = profile.primary_risk || "filtered out before serious consideration";
  const offerLanguage = profile.offer_language || "the real offer";

  if (diagnosisState === "Invisible") {
    return `Commercially, this means the business is likely being ${primaryRisk}.

In practical terms, buyers can assign more default trust to ${topCompetitor}${topCompetitorReviews ? ` and similar competitors with review counts around ${topCompetitorReviews}` : ""}, which means opportunities may be lost before ${offerLanguage} are ever weighed properly.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This creates a structural disadvantage.

Right now, competitors are shaping buyer confidence upstream. By the time a buyer reaches comparison mode, the business may already be carrying less perceived safety than operators like ${topCompetitor}. That means the decision frame is being tilted before the real value is fully considered.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `This creates a costly mismatch between capability and market perception.

The business may be stronger than it looks, but the visible trust layer is too thin for buyers to assign it the same confidence they give more visibly validated competitors. When that happens, strong operators remain commercially underweighted.`;
  }

  if (diagnosisState === "Contender") {
    return `At this stage, the risk is subtle but expensive.

    The business is no longer being ignored, but small trust differences can still redirect high-intent buyers toward the option that feels marginally more proven. In markets like this, close still loses share.`;
  }

  return `At this level, the risk shifts from being overlooked to losing comparative edge.

Once a business becomes competitive, slower proof accumulation can gradually let other competitors close the trust gap and weaken default preference over time.`;
}

function buildStrategicOpeningSummary_(m, diagnosisState, profile) {
  const proofLanguage = profile.proof_language || "visible public proof";

  if (diagnosisState === "Invisible") {
    return `The upside is that this is still highly movable.

Because the weakness is concentrated in visible trust rather than necessarily in operations, a stronger authority layer and denser ${proofLanguage} can change how the business is read by the market much faster than a full business overhaul would.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This is still recoverable, but it requires density, not cosmetic polish.

The business does not simply need more visibility. It needs enough visible proof to close a trust deficit that is already influencing buyer behavior. If that gap is reduced, the business can re-enter serious consideration far more consistently.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `This is a high-leverage opening because the problem appears to be translation more than capability.

If existing strengths are converted into denser ${proofLanguage}, the market can begin assigning more of the trust the business may already deserve operationally.`;
  }

  if (diagnosisState === "Contender") {
    return `The opening here is precision.

The business does not need reinvention. It needs enough additional trust reinforcement to stop being merely credible and start feeling like the safer default choice more consistently.`;
  }

  return `The opportunity now is defensive and expansionary at the same time.

Maintaining authority while continuing to widen the visible proof gap is what keeps the business from being normalized back into the competitive pack.`;
}

/* ============================================================================
   FINAL SNAPSHOT ROUTER
============================================================================ */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const verticalKey = determineVerticalType_(m);
  const profile = getVerticalProfile_(verticalKey);

  if (profile.template_family === "auto_retail") {
    return buildAutoRetailSnapshotNarrativePackage_(m, scores, diagnosis, profile);
  }

  const part1 = buildMarketPressureSummary_(m, diagnosis.diagnosis_state, profile);
  const part2 = buildPerceptionGapSummary_(m, diagnosis.diagnosis_state, profile);
  const part3 = buildCommercialRiskSummary_(m, diagnosis.diagnosis_state, profile);
  const part4 = buildStrategicOpeningSummary_(m, diagnosis.diagnosis_state, profile);

  return {
    market_position_summary: part1,
    strategic_gap_summary: part2,
    action_implication_summary: part3,
    snapshot_narrative: [
      part1,
      part2,
      part3,
      part4
    ].join("\n\n")
  };
}