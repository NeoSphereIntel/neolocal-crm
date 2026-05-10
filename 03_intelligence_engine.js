/**
 * File: 03_intelligence_engine.gs
 */

/* ============================================================================
   INTELLIGENCE ENGINE
============================================================================ */

function buildMarketContext_(leads) {
  const ranked = leads
    .slice()
    .sort((a, b) => {
      if ((b.reviews_count || 0) !== (a.reviews_count || 0)) {
        return (b.reviews_count || 0) - (a.reviews_count || 0);
      }
      return (b.rating || 0) - (a.rating || 0);
    });

  return {
    ranked_competitors: ranked
  };
}

function calculateCompetitorSignals_(lead, marketContext) {
  const competitors = (marketContext.ranked_competitors || [])
    .filter(c => c.lead_signature !== lead.lead_signature)
    .slice(0, APP.TOP_COMPETITOR_COUNT);

  const c1 = competitors[0] || {};
  const c2 = competitors[1] || {};
  const c3 = competitors[2] || {};

  const compReviews = competitors.map(c => parseInt(c.reviews_count, 10) || 0);
  const compAvg = compReviews.length ? round1_(avg_(compReviews)) : 0;
  const compMax = compReviews.length ? Math.max.apply(null, compReviews) : 0;
  const reviewGap = compAvg - (parseInt(lead.reviews_count, 10) || 0);
  const gapRatio = compAvg > 0
    ? round2_((parseInt(lead.reviews_count, 10) || 0) / compAvg)
    : 0;

  return {
    comp_1_name: c1.business_name || "",
    comp_1_reviews: c1.reviews_count || 0,
    comp_2_name: c2.business_name || "",
    comp_2_reviews: c2.reviews_count || 0,
    comp_3_name: c3.business_name || "",
    comp_3_reviews: c3.reviews_count || 0,
    comp_avg_reviews: compAvg,
    comp_max_reviews: compMax,
    review_gap: reviewGap,
    gap_ratio: gapRatio,
    market_review_pressure: classifyMarketPressure_(compAvg, compMax)
  };
}

function generateSnapshot_(lead, competitorSignals) {
  const metrics = buildSnapshotMetrics_(lead, competitorSignals);
  const scores = calculateLeadScores_(metrics);
  const diagnosis = determineDiagnosisState_(metrics, scores);
  const narrative = buildSnapshotNarrativePackage_(metrics, scores, diagnosis);

  return {
    market_maturity: diagnosis.market_maturity,
    authority_position: diagnosis.authority_position,
    base_presence_score: scores.base_presence_score,
    trust_score: scores.trust_score,
    competitive_pressure_score: scores.competitive_pressure_score,
    opportunity_score: scores.opportunity_score,
    difficulty_score: scores.difficulty_score,
    priority_score: scores.priority_score,
    momentum_score: metrics.momentum_score,
    momentum_state: metrics.momentum_state,
    is_undervalued: metrics.is_undervalued,
    diagnosis_state: diagnosis.diagnosis_state,
    market_position_summary: narrative.market_position_summary,
    strategic_gap_summary: narrative.strategic_gap_summary,
    action_implication_summary: narrative.action_implication_summary,
    snapshot_narrative: narrative.snapshot_narrative,
    snapshot_version: APP.SNAPSHOT_VERSION,
    priority_bucket: diagnosis.priority_bucket
  };
}

function getInternalOperatorData_(lead, includeInternal) {
  if (!includeInternal) return {};

  return {
    operator_scale_band: String(lead.operator_scale_band || "").trim(),
    operator_monthly_volume: String(lead.operator_monthly_volume || "").trim(),
    operator_service_capacity: String(lead.operator_service_capacity || "").trim(),
    operator_location_count: String(lead.operator_location_count || "").trim(),
    operator_business_model: String(lead.operator_business_model || "").trim(),
    operator_context_notes: String(lead.operator_context_notes || "").trim()
  };
}

function buildSnapshotMetrics_(lead, competitorSignals) {
  var operatorDataInternal = getInternalOperatorData_(lead, true);
	
  var baseMetrics = {
    business_name: lead.business_name,
    category: lead.category,
    city: lead.city,
    province_state: lead.province_state,
    country: lead.country,
    reviews_count: parseInt(lead.reviews_count, 10) || 0,
    rating: parseFloat(lead.rating) || 0,
    website_present: String(lead.website_present || "").trim() || (lead.website ? "Yes" : "No"),
    phone_present: String(lead.phone_present || "").trim() || (lead.phone ? "Yes" : "No"),
    operator_data_internal: operatorDataInternal,

    comp_1_name: String(competitorSignals.comp_1_name || ""),
    comp_1_reviews: parseInt(competitorSignals.comp_1_reviews, 10) || 0,
    comp_2_name: String(competitorSignals.comp_2_name || ""),
    comp_2_reviews: parseInt(competitorSignals.comp_2_reviews, 10) || 0,
    comp_3_name: String(competitorSignals.comp_3_name || ""),
    comp_3_reviews: parseInt(competitorSignals.comp_3_reviews, 10) || 0,

    comp_avg_reviews: parseFloat(competitorSignals.comp_avg_reviews) || 0,
    comp_max_reviews: parseFloat(competitorSignals.comp_max_reviews) || 0,
    review_gap: parseFloat(competitorSignals.review_gap) || 0,
    gap_ratio: parseFloat(competitorSignals.gap_ratio) || 0,
    market_review_pressure: String(competitorSignals.market_review_pressure || "").trim() || "Unknown"
  };

  // 🔥 NEW LAYER (SAFE EXTENSION)
  var compAvgSafe = baseMetrics.comp_avg_reviews || 0;
  var momentum = computeMomentumSignal_(baseMetrics.reviews_count, compAvgSafe);
  var isUndervalued = computeUndervalued_(baseMetrics);

  baseMetrics.momentum_score = momentum.momentum_score;
  baseMetrics.momentum_state = momentum.momentum_state;
  baseMetrics.is_undervalued = isUndervalued === true;

  return baseMetrics;
}

function parseOperatorNumber_(value) {
  var n = parseInt(value, 10);
  return isNaN(n) ? 0 : n;
}

function rankDiagnosisState_(state) {
  switch (String(state || "").trim()) {
    case "Invisible":
      return 1;
    case "Outgunned":
      return 2;
    case "Emerging":
      return 2;
    case "Undersignaled":
      return 3;
    case "Contender":
      return 4;
    case "Anchor":
      return 5;
    default:
      return 0;
  }
}

function buildOperatorExpectationLayer_(m) {
  var op = (m && m.operator_data_internal) || {};
  var scaleBand = String(op.operator_scale_band || "").trim().toLowerCase();
  var businessModel = String(op.operator_business_model || "").trim().toLowerCase();
  var monthlyVolume = parseOperatorNumber_(op.operator_monthly_volume);
  var serviceCapacity = parseOperatorNumber_(op.operator_service_capacity);
  var locationCount = parseOperatorNumber_(op.operator_location_count);

  var signalsPresent = 0;
  if (scaleBand) signalsPresent += 1;
  if (monthlyVolume > 0) signalsPresent += 1;
  if (serviceCapacity > 0) signalsPresent += 1;
  if (locationCount > 0) signalsPresent += 1;
  if (businessModel) signalsPresent += 1;

  if (!signalsPresent) {
    return {
      has_operator_data: false,
      expectation_score: 0,
      expected_posture: "",
      confidence: "none",
      signals_present: 0
    };
  }

  var score = 0;

  if (scaleBand === "high") score += 30;
  else if (scaleBand === "mid") score += 18;
  else if (scaleBand === "low") score += 8;

  if (monthlyVolume >= 120) score += 24;
  else if (monthlyVolume >= 60) score += 16;
  else if (monthlyVolume >= 25) score += 10;
  else if (monthlyVolume >= 10) score += 5;

  if (serviceCapacity >= 20) score += 18;
  else if (serviceCapacity >= 10) score += 12;
  else if (serviceCapacity >= 5) score += 6;
  else if (serviceCapacity >= 2) score += 3;

  if (locationCount >= 3) score += 18;
  else if (locationCount === 2) score += 10;
  else if (locationCount === 1) score += 4;

  if (businessModel === "mixed") score += 8;
  else if (businessModel === "commercial") score += 6;
  else if (businessModel === "industrial") score += 6;
  else if (businessModel === "residential") score += 3;

  var expectedPosture = "Emerging";
  if (score >= 65) expectedPosture = "Anchor";
  else if (score >= 40) expectedPosture = "Contender";
  else if (score >= 20) expectedPosture = "Undersignaled";

  var confidence = "low";
  if (signalsPresent >= 4) confidence = "high";
  else if (signalsPresent >= 2) confidence = "medium";

  return {
    has_operator_data: true,
    expectation_score: score,
    expected_posture: expectedPosture,
    confidence: confidence,
    signals_present: signalsPresent,
    scale_band: scaleBand,
    monthly_volume: monthlyVolume,
    service_capacity: serviceCapacity,
    location_count: locationCount,
    business_model: businessModel
  };
}

function detectOperatorMismatch_(m, diagnosisState) {
  var expectation = buildOperatorExpectationLayer_(m);

  if (!expectation.has_operator_data) {
    return {
      has_mismatch: false,
      severity: "",
      expected_posture: "",
      actual_posture: diagnosisState || "",
      posture_gap: 0,
      expectation: expectation
    };
  }

  var actualRank = rankDiagnosisState_(diagnosisState);
  var expectedRank = rankDiagnosisState_(expectation.expected_posture);
  var postureGap = expectedRank - actualRank;

  var hardMismatch = postureGap >= 1;

  return {
    has_mismatch: postureGap > 0,
    severity: postureGap >= 1 ? "hard" : "",
    expected_posture: expectation.expected_posture,
    actual_posture: diagnosisState || "",
    posture_gap: postureGap,
    expectation: expectation
  };
}

function calculateLeadScores_(m) {
  const basePresenceScore = scoreBasePresence_(m);
  const trustScore = scoreTrust_(m);
  const competitivePressureScore = scoreCompetitivePressure_(m);
  const opportunityScore = scoreOpportunity_(m, basePresenceScore, trustScore, competitivePressureScore);
  const difficultyScore = scoreDifficulty_(m, competitivePressureScore);
  const priorityScore = scorePriority_(opportunityScore, difficultyScore, trustScore, basePresenceScore);

  return {
    base_presence_score: basePresenceScore,
    trust_score: trustScore,
    competitive_pressure_score: competitivePressureScore,
    opportunity_score: opportunityScore,
    difficulty_score: difficultyScore,
    priority_score: priorityScore
  };
}

function determineDiagnosisState_(m, scores) {
  const marketMaturity = classifyMarketMaturity_(m);
  const authorityPosition = classifyAuthorityPosition_(m, scores.trust_score);
  const verticalKey = determineVerticalType_(m);

  let diagnosisState;

  if (verticalKey === "auto_retail") {
    diagnosisState = determineAutoRetailDiagnosisState_(m, scores, authorityPosition);
  } else {
    diagnosisState = classifyDiagnosisState_({
      trustScore: scores.trust_score,
      basePresenceScore: scores.base_presence_score,
      competitivePressureScore: scores.competitive_pressure_score,
      opportunityScore: scores.opportunity_score,
      difficultyScore: scores.difficulty_score,
      reviews_count: m.reviews_count,
      gap_ratio: m.gap_ratio,
      authority_position: authorityPosition
    });
  }

  let priorityBucket;

  if (verticalKey === "auto_retail") {
    priorityBucket = classifyAutoRetailPriority_(m, scores, diagnosisState);
  } else {
    priorityBucket = classifyPriorityBucket_(scores.priority_score, diagnosisState);
  }

  return {
    market_maturity: marketMaturity,
    authority_position: authorityPosition,
    diagnosis_state: diagnosisState,
    priority_bucket: priorityBucket
  };
}

function determineAutoRetailDiagnosisState_(m, scores, authorityPosition) {
  const reviews = parseInt(m.reviews_count, 10) || 0;
  const compAvg = parseFloat(m.comp_avg_reviews) || 0;
  const compMax = parseFloat(m.comp_max_reviews) || 0;
  const gapRatio = parseFloat(m.gap_ratio) || 0;
  const reviewGap = parseFloat(m.review_gap) || 0;
  const trustScore = parseFloat(scores.trust_score) || 0;
  const presenceScore = parseFloat(scores.base_presence_score) || 0;
  const pressureScore = parseFloat(scores.competitive_pressure_score) || 0;

  // 1) Very weak visible trust / barely read by market
  if (reviews < 20 && trustScore < 30) {
    return "Invisible";
  }

  // 2) Strong market pressure + dealership clearly behind visible standard
  if (
    (compAvg >= 90 || compMax >= 180 || pressureScore >= 68) &&
    gapRatio < 0.45 &&
    reviews < 120
  ) {
    return "Outgunned";
  }

  // 3) Credible enough to be present, but still under-read versus market weight
  if (
    reviews >= 20 &&
    reviews < 120 &&
    trustScore >= 25 &&
    trustScore < 58 &&
    gapRatio >= 0.45 &&
    gapRatio < 0.90
  ) {
    return "Undersignaled";
  }

  // 4) In the mix and commercially credible, but not yet default-safe
  if (
    reviews >= 80 &&
    trustScore >= 50 &&
    gapRatio >= 0.70 &&
    (gapRatio < 1.15 || reviewGap <= 40)
  ) {
    return "Contender";
  }

  // 5) Strong visible trust + enough proof to influence buyer confidence
  if (
    reviews >= 180 &&
    trustScore >= 68 &&
    presenceScore >= 55 &&
    (gapRatio >= 1.00 || authorityPosition === "High")
  ) {
    return "Anchor";
  }

  // Fallback logic:
  // - if market is weak, even moderate proof can make a store competitive
  if (compAvg < 50 && reviews >= 60 && trustScore >= 45) {
    return "Contender";
  }

  // - otherwise default to under-read rather than over-crediting dominance
  if (reviews >= 20) {
    return "Undersignaled";
  }

  return "Invisible";
}

function getDiagnosisDisplayLabel_(diagnosisState, verticalKey) {
  if (verticalKey === "auto_retail") {
    switch (diagnosisState) {
      case "Invisible":
        return "Not Trusted Yet";
      case "Outgunned":
        return "Trust Deficit";
      case "Undersignaled":
        return "Considered But Not Safe";
      case "Contender":
        return "Competing But Not Default";
      case "Anchor":
        return "Default Candidate";
      default:
        return diagnosisState;
    }
  }

  return diagnosisState;
}


/* ============================================================================
   BACKWARD-COMPATIBILITY WRAPPERS
============================================================================ */

function buildSnapshotForLeadRow_(lead) {
  const competitorSignals = {
    comp_avg_reviews: parseFloat(lead.comp_avg_reviews) || 0,
    comp_max_reviews: parseFloat(lead.comp_max_reviews) || 0,
    review_gap: parseFloat(lead.review_gap) || 0,
    gap_ratio: parseFloat(lead.gap_ratio) || 0,
    market_review_pressure: String(lead.market_review_pressure || "").trim() || "Unknown"
  };

  return generateSnapshot_(lead, competitorSignals);
}

function buildSnapshotFromMetrics_(m) {
  const lead = {
    business_name: m.business_name,
    category: m.category,
    city: m.city,
    province_state: m.province_state,
    country: m.country,
    reviews_count: m.reviews_count,
    rating: m.rating,
    website_present: m.website_present,
    phone_present: m.phone_present,
    website: "",
    phone: ""
  };

  const competitorSignals = {
    comp_avg_reviews: m.comp_avg_reviews,
    comp_max_reviews: m.comp_max_reviews,
    review_gap: m.review_gap,
    gap_ratio: m.gap_ratio,
    market_review_pressure: m.market_review_pressure
  };

  return generateSnapshot_(lead, competitorSignals);
}

/* ============================================================================
   SCORE / CLASSIFY HELPERS
============================================================================ */

function scoreBasePresence_(m) {
  let score = 20;
  if (String(m.website_present).toLowerCase() === "yes") score += 45;
  if (String(m.phone_present).toLowerCase() === "yes") score += 20;
  if ((m.reviews_count || 0) > 0) score += 15;
  return clamp_(Math.round(score), 0, 100);
}

function scoreTrust_(m) {
  const reviews = m.reviews_count || 0;
  const rating = m.rating || 0;

  let reviewComponent = 0;
  if (reviews >= 300) reviewComponent = 75;
  else if (reviews >= 150) reviewComponent = 64;
  else if (reviews >= 80) reviewComponent = 54;
  else if (reviews >= 40) reviewComponent = 42;
  else if (reviews >= 20) reviewComponent = 32;
  else if (reviews >= 10) reviewComponent = 24;
  else if (reviews >= 1) reviewComponent = 12;

  let ratingComponent = 0;
  if (rating >= 4.9) ratingComponent = 25;
  else if (rating >= 4.7) ratingComponent = 22;
  else if (rating >= 4.5) ratingComponent = 18;
  else if (rating >= 4.2) ratingComponent = 12;
  else if (rating >= 3.8) ratingComponent = 8;
  else if (rating > 0) ratingComponent = 4;

  return clamp_(Math.round(reviewComponent + ratingComponent), 0, 100);
}

function scoreCompetitivePressure_(m) {
  const compAvg = m.comp_avg_reviews || 0;
  const compMax = m.comp_max_reviews || 0;

  let score = 0;
  if (compAvg >= 300 || compMax >= 600) score = 92;
  else if (compAvg >= 180 || compMax >= 350) score = 82;
  else if (compAvg >= 100 || compMax >= 180) score = 70;
  else if (compAvg >= 45 || compMax >= 90) score = 54;
  else if (compAvg >= 15 || compMax >= 35) score = 36;
  else score = 22;

  return clamp_(Math.round(score), 0, 100);
}

function scoreOpportunity_(m, basePresenceScore, trustScore, competitivePressureScore) {
  const reviews = m.reviews_count || 0;
  const gapRatio = m.gap_ratio || 0;
  const hasWebsite = String(m.website_present).toLowerCase() === "yes";

  let score = 0;

  if (reviews <= 3) score += 30;
  else if (reviews <= 15) score += 25;
  else if (reviews <= 40) score += 18;
  else score += 10;

  if (gapRatio < 0.20) score += 28;
  else if (gapRatio < 0.40) score += 23;
  else if (gapRatio < 0.70) score += 15;
  else score += 8;

  if (competitivePressureScore >= 70) score += 18;
  else if (competitivePressureScore >= 50) score += 13;
  else score += 8;

  if (hasWebsite) score += 10;
  else score += 4;

  if (trustScore >= 20) score += 9;
  if (basePresenceScore >= 50) score += 7;

  return clamp_(Math.round(score), 0, 100);
}

function scoreDifficulty_(m, competitivePressureScore) {
  const gapRatio = m.gap_ratio || 0;
  const reviews = m.reviews_count || 0;

  let score = competitivePressureScore * 0.68;

  if (gapRatio < 0.15) score += 24;
  else if (gapRatio < 0.35) score += 18;
  else if (gapRatio < 0.65) score += 10;
  else score += 4;

  if (reviews === 0) score += 10;
  else if (reviews < 10) score += 8;
  else if (reviews < 25) score += 5;

  return clamp_(Math.round(score), 0, 100);
}

function scorePriority_(opportunityScore, difficultyScore, trustScore, basePresenceScore) {
  const score =
    (opportunityScore * 0.45) +
    ((100 - difficultyScore) * 0.20) +
    (trustScore * 0.20) +
    (basePresenceScore * 0.15);

  return clamp_(Math.round(score), 0, 100);
}

function classifyMarketMaturity_(m) {
  const compAvg = m.comp_avg_reviews || 0;
  const compMax = m.comp_max_reviews || 0;

  if (compAvg >= 180 || compMax >= 350) return "Entrenched";
  if (compAvg >= 70 || compMax >= 150) return "Developed";
  if (compAvg >= 20 || compMax >= 50) return "Active";
  return "Open";
}

function classifyAuthorityPosition_(m, trustScore) {
  const ratio = m.gap_ratio || 0;
  const reviews = m.reviews_count || 0;

  if (trustScore >= 70 && ratio >= 0.95) return "Leader";
  if (trustScore >= 45 && ratio >= 0.60) return "Competitive";
  if (reviews > 0 && ratio >= 0.25) return "Present";
  if (reviews > 0) return "Thin";
  return "Absent";
}

function classifyDiagnosisState_(x) {
  const reviews = x.reviews_count || 0;
  const gapRatio = x.gap_ratio || 0;
  const trust = x.trustScore || 0;
  const presence = x.basePresenceScore || 0;
  const pressure = x.competitivePressureScore || 0;
  const authority = x.authority_position || "";

  if (reviews <= 2 && trust < 18 && presence < 55) return "Invisible";
  if (authority === "Leader") return "Anchor";
  if (pressure >= 70 && gapRatio < 0.35) return "Outgunned";
  if (presence >= 60 && trust >= 18 && trust < 42 && gapRatio < 0.75) return "Undersignaled";
  if (trust >= 42 && gapRatio >= 0.40 && gapRatio < 0.95) return "Contender";
  if (reviews > 0 || trust >= 18) return "Emerging";
  return "Invisible";
}

function classifyPriorityBucket_(priorityScore, diagnosisState) {
  if (priorityScore >= 75) return "Tier 1";
  if (priorityScore >= 55) return "Tier 2";
  if (diagnosisState === "Anchor") return "Tier 3";
  return "Tier 3";
}

function classifyAutoRetailPriority_(m, scores, diagnosisState) {
  const reviews = parseInt(m.reviews_count, 10) || 0;
  const compAvg = parseFloat(m.comp_avg_reviews) || 0;
  const compMax = parseFloat(m.comp_max_reviews) || 0;
  const gapRatio = parseFloat(m.gap_ratio) || 0;
  const reviewGap = parseFloat(m.review_gap) || 0;

  const trustScore = parseFloat(scores.trust_score) || 0;
  const pressureScore = parseFloat(scores.competitive_pressure_score) || 0;

  let priorityScore = 0;

  // 🔥 BIG MARKET PRESSURE = MORE VALUE
  if (compAvg >= 80) priorityScore += 20;
  if (compMax >= 150) priorityScore += 20;

  // 🔥 TRUST GAP = LOST DEALS
  if (gapRatio < 0.5) priorityScore += 25;
  else if (gapRatio < 0.8) priorityScore += 20;
  else if (gapRatio < 1.0) priorityScore += 10;

  // 🔥 CLOSE BUT LOSING = BEST TARGET
  if (reviews >= 40 && gapRatio < 1.0 && gapRatio > 0.5) {
    priorityScore += 25;
  }

  // 🔥 INVISIBLE = LOW CONVERSION (lower priority)
  if (reviews <= 10) {
    priorityScore -= 15;
  }

  // 🔥 HIGH PRESSURE MARKET
  if (pressureScore >= 60) {
    priorityScore += 15;
  }

  // 🔥 STRONG BUT NOT DOMINANT
  if (trustScore >= 45 && gapRatio < 1.0) {
    priorityScore += 20;
  }

  // Normalize
  priorityScore = Math.max(0, Math.min(100, priorityScore));

  // Convert to bucket
  if (priorityScore >= 75) return "High";
  if (priorityScore >= 50) return "Medium";
  return "Low";
}

function computeMomentumSignal_(reviews, compAvg) {
  if (!compAvg) {
    return { momentum_score: 0, momentum_state: "unknown" };
  }

  const safeReviews = reviews || 0;
  const ratio = safeReviews / compAvg;

  if (ratio < 0.3) return { momentum_score: 2, momentum_state: "stagnant" };
  if (ratio < 0.7) return { momentum_score: 4, momentum_state: "slow" };
  if (ratio < 1.2) return { momentum_score: 7, momentum_state: "active" };

  return { momentum_score: 9, momentum_state: "aggressive" };
}

function computeUndervalued_(m) {
  if (!m) return false;

  const strongRating = (m.rating || 0) >= 4.5;
  const closeToTop = (m.gap_ratio || 0) >= 0.7;
  const weakMarket = (m.comp_avg_reviews || 0) < 150;

  return strongRating && closeToTop && weakMarket;
}

/* ============================================================================
   PEER BAND CALCULATOR
============================================================================ */

/**
 * Calculates peer band averages for a target lead against the full import batch.
 * @returns {Object} peer_avg_reviews, peer_avg_rating, peer_avg_photos, peer_count,
 *                   leader_avg_reviews, leader_avg_photos
 */
function calculatePeerBand_(leads, targetLead) {
  const isAutoRetail = determineVerticalType_(targetLead) === "auto_retail";
  const scaleBand = estimateScaleBand_(targetLead, isAutoRetail);
  const peerRange = getPeerReviewRange_(targetLead, scaleBand);

  // Direct peers: exclude self, filter to review range
  const peers = leads.filter(l => {
    if (l.lead_signature === targetLead.lead_signature) return false;
    const r = parseInt(l.reviews_count, 10) || 0;
    return r >= peerRange.min && r <= peerRange.max;
  });

  // Market leaders: top 3 by maps_position (position 1 = best rank)
  const leaders = leads
    .filter(l => l.lead_signature !== targetLead.lead_signature)
    .filter(l => parseInt(l.maps_position, 10) > 0)
    .sort((a, b) => (parseInt(a.maps_position, 10) || 99) - (parseInt(b.maps_position, 10) || 99))
    .slice(0, 3);

  const peerReviews = peers.map(p => parseInt(p.reviews_count, 10) || 0);
  const peerRatings = peers.map(p => parseFloat(p.rating) || 0).filter(v => v > 0);
  const peerPhotos  = peers.map(p => parseInt(p.photo_count, 10) || 0);

  const leaderReviews = leaders.map(l => parseInt(l.reviews_count, 10) || 0);
  const leaderPhotos  = leaders.map(l => parseInt(l.photo_count, 10) || 0);

  return {
    peer_avg_reviews: peerReviews.length ? round1_(avg_(peerReviews)) : 0,
    peer_avg_rating:  peerRatings.length ? round2_(avg_(peerRatings)) : 0,
    peer_avg_photos:  peerPhotos.length  ? round1_(avg_(peerPhotos))  : 0,
    peer_count:       peers.length,
    leader_avg_reviews: leaderReviews.length ? round1_(avg_(leaderReviews)) : 0,
    leader_avg_photos:  leaderPhotos.length  ? round1_(avg_(leaderPhotos))  : 0
  };
}

/**
 * Returns estimated scale band label for peer band determination.
 * Uses locked operator_scale_band when present; falls back to review heuristic.
 * Auto-retail thresholds are 3x higher than general trades per SCORING-SPEC §4.
 */
function estimateScaleBand_(lead, isAutoRetail) {
  const operatorBand = safeText_(lead.operator_scale_band).toLowerCase();
  if (operatorBand) return operatorBand;

  const reviews = parseInt(lead.reviews_count, 10) || 0;
  const m = isAutoRetail ? 3 : 1;

  if (reviews < 30  * m) return "small";
  if (reviews < 150 * m) return "mid-size";
  if (reviews < 500 * m) return "large";
  return "multi-location";
}

/**
 * Returns {min, max} review count range for direct peer filtering.
 * Locked ranges come from operator_scale_band; estimated uses ±3x review volume.
 */
function getPeerReviewRange_(lead, scaleBand) {
  const operatorBand = safeText_(lead.operator_scale_band).toLowerCase();

  if (operatorBand === "solo")           return { min: 0,   max: 20 };
  if (operatorBand === "small team")     return { min: 10,  max: 60 };
  if (operatorBand === "mid-size")       return { min: 40,  max: 200 };
  if (operatorBand === "large")          return { min: 150, max: 600 };
  if (operatorBand === "multi-location") return { min: 400, max: Infinity };

  // Estimated: ±3x review volume
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  if (!reviews) return { min: 0, max: 30 };
  return { min: Math.floor(reviews / 3), max: reviews * 3 };
}

/* ============================================================================
   DIMENSION SCORERS — SHARED HELPERS
============================================================================ */

/**
 * Returns whole days elapsed since an ISO date string. Returns Infinity if missing/invalid.
 */
function daysSince_(isoDateStr) {
  if (!isoDateStr) return Infinity;
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/**
 * Parses the review_topics JSON string (stored by enrichment pipeline).
 * Returns empty array on missing or malformed input.
 */
function parseReviewTopics_(topicsJson) {
  if (!topicsJson) return [];
  try {
    const parsed = JSON.parse(topicsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Orchestrates all five dimension scorers for a single lead.
 * @returns {Object} five score fields, each 0–100 integer
 */
function calculateDimensionScores_(lead, peerBand) {
  return {
    discovery_position_score:       scoreDiscoveryPosition_(parseInt(lead.maps_position, 10) || 0),
    profile_authority_score:        scoreProfileAuthority_(lead),
    trust_surface_score:            scoreTrustSurface_(lead, peerBand),
    owner_engagement_score:         scoreOwnerEngagement_(lead),
    competitive_displacement_score: scoreCompetitiveDisplacement_(lead, peerBand)
  };
}

/* ============================================================================
   DIMENSION SCORER — DISCOVERY POSITION
   Weight: 30% of Market Capture score.
   Measures where the business appears in the local search results surface.
============================================================================ */

/**
 * Scores discovery position from maps_position (1 = top of results).
 * Returns 0 for unranked leads. SCORING-SPEC §5.1 lookup table.
 */
function scoreDiscoveryPosition_(mapsPosition) {
  const pos = parseInt(mapsPosition, 10) || 0;
  if (pos <= 0) return 0;
  switch (pos) {
    case 1:  return 100;
    case 2:  return 95;
    case 3:  return 88;
    case 4:  return 78;
    case 5:  return 70;
    case 6:  return 62;
    case 7:  return 55;
    case 8:  return 45;
    case 9:  return 38;
    case 10: return 30;
    default:
      if (pos <= 15) return 20;
      if (pos <= 20) return 10;
      return 0;
  }
}

/* ============================================================================
   DIMENSION SCORER — PROFILE AUTHORITY
   Weight: 20% of Market Capture score.
   Additive signal set — measures how completely the business has built its
   discoverable profile footprint. All signals from Place Details enrichment.
============================================================================ */

/**
 * Scores profile completeness/authority from enriched lead fields.
 * Maximum possible: 100. Missing enrichment fields score 0 for that signal.
 */
function scoreProfileAuthority_(lead) {
  let score = 0;

  // Owner photos (0–20)
  const ownerPhotos = parseInt(lead.owner_photos, 10) || 0;
  if (ownerPhotos >= 30)      score += 20;
  else if (ownerPhotos >= 16) score += 15;
  else if (ownerPhotos >= 6)  score += 10;
  else if (ownerPhotos >= 1)  score += 5;

  // Total photos (0–15)
  const totalPhotos = parseInt(lead.total_photos, 10) || 0;
  if (totalPhotos >= 100)     score += 15;
  else if (totalPhotos >= 31) score += 11;
  else if (totalPhotos >= 11) score += 7;
  else if (totalPhotos >= 1)  score += 3;

  // Description / editorial summary present (0–10)
  if (safeText_(lead.description)) score += 10;

  // Hours filled (0–10)
  if (safeText_(lead.hours)) score += 10;

  // Service options declared (0–10)
  if (safeText_(lead.service_options)) score += 10;

  // Category breadth (0–10)
  const cats = safeText_(lead.categories_full)
    .split(",").map(s => s.trim()).filter(Boolean);
  if (cats.length >= 3)       score += 10;
  else if (cats.length === 2) score += 6;
  else if (cats.length === 1) score += 3;

  // Website present (0–10)
  if (safeText_(lead.website_present).toLowerCase() === "yes") score += 10;

  // Booking link present (0–5)
  if (safeText_(lead.has_booking_link).toLowerCase() === "yes") score += 5;

  // Extensions / highlights present (0–5)
  if (safeText_(lead.extensions)) score += 5;

  // Phone present (0–5)
  if (safeText_(lead.phone_present).toLowerCase() === "yes") score += 5;

  return clamp_(Math.round(score), 0, 100);
}

/* ============================================================================
   DIMENSION SCORER — TRUST SURFACE
   Weight: 20% of Market Capture score.
   Peer-adjusted — compares review volume to peer band average, not raw market.
   Uses review intelligence fields from the Reviews API enrichment.
============================================================================ */

/**
 * Scores trust signals relative to peer band. Never uses raw review counts alone.
 * Five components: volume ratio (0–30), rating (0–25), recency (0–20),
 * topic diversity (0–15), rating trend (0–10). Max 100.
 */
function scoreTrustSurface_(lead, peerBand) {
  let score = 0;

  // Review volume vs peer avg (0–30)
  const peerAvgReviews = parseFloat((peerBand || {}).peer_avg_reviews) || 0;
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  if (peerAvgReviews > 0) {
    const ratio = reviews / peerAvgReviews;
    if (ratio >= 2.0)      score += 30;
    else if (ratio >= 1.5) score += 25;
    else if (ratio >= 1.0) score += 20;
    else if (ratio >= 0.7) score += 14;
    else if (ratio >= 0.4) score += 8;
    else                   score += 3;
  } else {
    score += 10; // no peer baseline — neutral
  }

  // Rating strength (0–25)
  const rating = parseFloat(lead.rating) || 0;
  if (rating >= 4.7)      score += 25;
  else if (rating >= 4.5) score += 22;
  else if (rating >= 4.2) score += 18;
  else if (rating >= 4.0) score += 14;
  else if (rating >= 3.5) score += 8;
  else if (rating > 0)    score += 3;

  // Review recency (0–20)
  const reviewAge = daysSince_(safeText_(lead.latest_review_date));
  if (reviewAge < 7)        score += 20;
  else if (reviewAge < 30)  score += 16;
  else if (reviewAge < 90)  score += 10;
  else if (reviewAge < 180) score += 5;

  // Topic diversity — topics with ≥ 3 mentions (0–15)
  const topics = parseReviewTopics_(lead.review_topics);
  const richTopics = topics.filter(t => (parseInt(t.mentions, 10) || 0) >= 3).length;
  if (richTopics >= 5)      score += 15;
  else if (richTopics >= 3) score += 10;
  else if (richTopics >= 1) score += 5;

  // Rating trend (0–10)
  const trend = safeText_(lead.rating_trend).toLowerCase();
  if (trend === "improving")      score += 10;
  else if (trend === "stable")    score += 6;
  else if (trend === "declining") score += 2;
  else                            score += 5; // no data — neutral middle

  return clamp_(Math.round(score), 0, 100);
}

/* ============================================================================
   DIMENSION SCORER — OWNER ENGAGEMENT
   Weight: 15% of Market Capture score.
   Measures how actively the owner manages their discovery presence.
============================================================================ */

/**
 * Scores owner engagement from response rate, review recency, and rating trend.
 * Response rate (0–40) + recency (0–35) + trend (0–25) = max 100.
 */
function scoreOwnerEngagement_(lead) {
  let score = 0;

  // Owner response rate (0–40)
  const responseRate = parseFloat(lead.owner_response_rate) || 0;
  if (responseRate >= 0.8)      score += 40;
  else if (responseRate >= 0.6) score += 32;
  else if (responseRate >= 0.4) score += 22;
  else if (responseRate >= 0.2) score += 12;
  else if (responseRate > 0)    score += 5;

  // Latest review date recency — proxy for ongoing customer activity (0–35)
  const reviewAge = daysSince_(safeText_(lead.latest_review_date));
  if (reviewAge < 7)        score += 35;
  else if (reviewAge < 30)  score += 28;
  else if (reviewAge < 90)  score += 18;
  else if (reviewAge < 180) score += 8;

  // Rating trend (0–25)
  const trend = safeText_(lead.rating_trend).toLowerCase();
  if (trend === "improving")      score += 25;
  else if (trend === "stable")    score += 15;
  else if (trend === "declining") score += 5;
  else                            score += 10; // no data — neutral middle

  return clamp_(Math.round(score), 0, 100);
}

/* ============================================================================
   COMPOSITE CALCULATOR — MARKET CAPTURE
============================================================================ */

/**
 * Computes the weighted Market Capture composite score, diagnosis state, and
 * optional operator fit. Pure function — reads inputs, returns object, no side effects.
 *
 * Weights: Discovery 30%, Trust 25%, Displacement 20%, Authority 15%, Engagement 10%.
 *
 * @param {Object} dimensionScores  Five dimension score fields (0–100 each)
 * @param {Object} operatorContext  Lead fields used for operator fit; may be empty/null
 * @returns {{ market_capture_score, diagnosis, operator_fit, dimension_scores }}
 */
function calculateMarketCapture_(dimensionScores, operatorContext) {
  const d = dimensionScores || {};
  const discovery    = clamp_(parseInt(d.discovery_position_score,       10) || 0, 0, 100);
  const trust        = clamp_(parseInt(d.trust_surface_score,            10) || 0, 0, 100);
  const displacement = clamp_(parseInt(d.competitive_displacement_score, 10) || 0, 0, 100);
  const authority    = clamp_(parseInt(d.profile_authority_score,        10) || 0, 0, 100);
  const engagement   = clamp_(parseInt(d.owner_engagement_score,         10) || 0, 0, 100);

  const marketCaptureScore = clamp_(Math.round(
    discovery    * 0.30 +
    trust        * 0.25 +
    displacement * 0.20 +
    authority    * 0.15 +
    engagement   * 0.10
  ), 0, 100);

  let diagnosis;
  if (marketCaptureScore >= 80)      diagnosis = "Anchor";
  else if (marketCaptureScore >= 60) diagnosis = "Contender";
  else if (marketCaptureScore >= 40) diagnosis = "Underdog";
  else if (marketCaptureScore >= 20) diagnosis = "Outgunned";
  else                               diagnosis = "Ghost";

  // Operator fit — null when no operator context fields are present
  const ctx = operatorContext || {};
  const hasOperatorContext = !!(
    safeText_(ctx.operator_scale_band) ||
    safeText_(ctx.operator_monthly_volume) ||
    safeText_(ctx.operator_business_model)
  );

  let operatorFit = null;
  if (hasOperatorContext) {
    const peerAvgReviews = parseFloat(ctx.peer_avg_reviews) || 0;
    const reviews        = parseInt(ctx.reviews_count, 10) || 0;
    // Neutral ratio of 1.0 when no peer baseline exists yet
    const reviewRatio    = peerAvgReviews > 0 ? reviews / peerAvgReviews : 1.0;

    const rawFit = (
      reviewRatio          * 0.40 +
      (authority  / 100)   * 0.30 +
      (engagement / 100)   * 0.30
    ) * 100;

    operatorFit = clamp_(Math.round(rawFit), 0, 100);
  }

  return {
    market_capture_score: marketCaptureScore,
    diagnosis:            diagnosis,
    operator_fit:         operatorFit,
    dimension_scores: {
      discovery_position_score:       discovery,
      trust_surface_score:            trust,
      competitive_displacement_score: displacement,
      profile_authority_score:        authority,
      owner_engagement_score:         engagement
    }
  };
}

/* ============================================================================
   DIMENSION SCORER — COMPETITIVE DISPLACEMENT
   Weight: 20% of Market Capture score.
   Higher score = LESS displaced (better position). Directionally consistent
   with other dimensions — higher is always better. SCORING-SPEC §5.5 note.
============================================================================ */

/**
 * Scores competitive position from maps_position and review volume vs market leaders.
 * Position component (0–50) + leader review ratio component (0–50) = max 100.
 */
function scoreCompetitiveDisplacement_(lead, peerBand) {
  let score = 0;

  // Maps position component (0–50)
  const pos = parseInt(lead.maps_position, 10) || 0;
  if (pos === 1)      score += 50;
  else if (pos === 2) score += 44;
  else if (pos === 3) score += 38;
  else if (pos === 4) score += 30;
  else if (pos === 5) score += 24;
  else if (pos === 6) score += 18;
  else if (pos === 7) score += 13;
  else if (pos <= 10) score += 8;
  else if (pos <= 15) score += 4;
  else if (pos > 15)  score += 1;

  // Review volume vs market leaders (0–50)
  const leaderAvg = parseFloat((peerBand || {}).leader_avg_reviews) || 0;
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  if (leaderAvg > 0) {
    const ratio = reviews / leaderAvg;
    if (ratio >= 2.0)      score += 50;
    else if (ratio >= 1.5) score += 43;
    else if (ratio >= 1.0) score += 35;
    else if (ratio >= 0.7) score += 25;
    else if (ratio >= 0.4) score += 15;
    else                   score += 5;
  } else {
    score += 25; // no leader baseline — neutral middle
  }

  return clamp_(Math.round(score), 0, 100);
}