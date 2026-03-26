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
  const category = safeText_(m.category || "used car dealership");
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);
  const topCompetitor = safeText_(m.comp_1_name || "a stronger visible dealership");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (compAvg <= 0) {
    return `In the ${category} market in ${location}, buyer trust does not appear fully consolidated yet.

That usually means shoppers are deciding quickly based on which dealership feels safest and most credible first. In auto retail, that matters because trust often forms before inventory gets a fair comparison.`;
  }

  return `In the used car market in ${location}, shoppers are not evaluating dealerships from a neutral starting point.

Visible trust is already clustering around dealerships that look proven, established, and safer to transact with. The visible market average sits around ${compAvg} reviews, while stronger trust anchors such as ${topCompetitor} are already projecting closer to ${topCompetitorReviews || compMax} reviews.

At that stage, buyers are no longer just comparing cars. They are pre-sorting dealerships by perceived purchase safety.`;
}

function buildAutoRetailPerceptionGapSummary_(m, diagnosisState, profile) {
  const reviews = Math.round(m.reviews_count || 0);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const reviewGap = Math.round(m.review_gap || 0);
  const ratio = Number(m.gap_ratio || 0);
  const topCompetitor = safeText_(m.comp_1_name || "the strongest visible dealership");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (reviews <= 10) {
    return `At ${reviews} reviews, the dealership is not yet projecting enough visible customer experience to feel like a default-safe place to buy.

That does not automatically mean the dealership is weak operationally. It means the market is still reading it as under-proven, especially beside stores like ${topCompetitor}${topCompetitorReviews ? ` with roughly ${topCompetitorReviews} visible reviews` : ""}.`;
  }

  if (ratio < 0.50) {
    return `With ${reviews} reviews against a visible market average near ${compAvg}, the dealership is materially underweighted in buyer trust.

That creates a perception gap wide enough that shoppers can interpret competing dealers as more established, more reliable, and less risky before inventory quality is seriously compared.`;
  }

  if (ratio < 1.00) {
    return `At ${reviews} reviews, the dealership is in the conversation, but still trailing the visible market standard by roughly ${reviewGap} reviews.

That sounds moderate on paper, but in used car retail, small trust gaps often decide which dealership feels safer at the exact moment the buyer has to commit.`;
  }

  return `At ${reviews} reviews, the dealership is operating at a competitive trust level in its market.

The issue here is no longer basic credibility. It is maintaining enough visible authority to continue feeling like the safer dealership choice as competitors keep building momentum.`;
}

function buildAutoRetailCommercialRiskSummary_(m, diagnosisState, profile) {
  const topCompetitor = safeText_(m.comp_1_name || "stronger competing dealerships");
  const topCompetitorReviews = Math.round(m.comp_1_reviews || 0);

  if (diagnosisState === "Invisible") {
    return `Commercially, this means the dealership is likely being screened out before serious dealership comparison even begins.

In practical terms, shoppers can assign more default trust to ${topCompetitor}${topCompetitorReviews ? ` and similar dealerships with review counts around ${topCompetitorReviews}` : ""}, which means opportunities may be lost before financing options, inventory quality, pricing, warranty confidence, or staff experience are ever weighed properly.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This creates a structural disadvantage.

Right now, competing dealerships are shaping buyer confidence earlier in the decision path. By the time a shopper starts comparing inventory, this dealership may already feel less safe than operators like ${topCompetitor}. That means the deal is being weakened before the vehicles themselves are fully evaluated.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `This creates a costly mismatch between what the dealership may actually deliver and how the market currently reads it.

The store may be stronger than it looks, but the public trust layer is too thin for buyers to assign it the same confidence they give more visibly validated dealerships. When that happens, real inventory and sales capability remain commercially underweighted.`;
  }

  if (diagnosisState === "Contender") {
    return `At this stage, the risk becomes subtle but expensive.

The dealership is no longer invisible, but small differences in perceived safety can still redirect high-intent shoppers toward the lot that feels slightly more proven. In used car retail, “close” still loses gross.`;
  }

  return `At this level, the risk shifts from being ignored to losing comparative edge.

Once a dealership becomes competitive, slower trust accumulation can gradually let other dealers narrow the confidence gap and weaken default preference over time.`;
}

function buildAutoRetailStrategicOpeningSummary_(m, diagnosisState, profile) {
  if (diagnosisState === "Invisible") {
    return `The upside is that this is still highly movable.

Because the weakness appears concentrated in visible buyer trust rather than necessarily in the underlying business, a stronger proof layer can change how the dealership is read by the market much faster than a full operational rebuild would.`;
  }

  if (diagnosisState === "Outgunned") {
    return `This is still recoverable, but it requires density, not cosmetic polish.

The dealership does not simply need more visibility. It needs enough public trust reinforcement to close a buyer-confidence deficit that is already influencing shopping behavior. If that gap narrows, the store can re-enter serious comparison much more consistently.`;
  }

  if (diagnosisState === "Undersignaled") {
    return `This is a high-leverage opening because the problem appears to be translation more than capability.

If the dealership’s real strengths are converted into denser public proof, the market can begin assigning more of the confidence the business may already deserve operationally.`;
  }

  if (diagnosisState === "Contender") {
    return `The opening here is precision.

The dealership does not need reinvention. It needs enough additional trust reinforcement to stop being merely credible and start feeling like the safer place to buy more consistently.`;
  }

  return `The opportunity now is both defensive and expansionary.

Maintaining authority while continuing to widen the visible trust gap is what keeps the dealership from being pulled back into the competitive pack.`;
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

    The business is no longer being ignored, but small trust differences can still redirect high-intent buyers toward the option that feels marginally more proven. In markets like this, “close” still loses share.`;
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