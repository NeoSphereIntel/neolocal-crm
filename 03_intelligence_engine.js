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
    diagnosis_state: diagnosis.diagnosis_state,
    market_position_summary: narrative.market_position_summary,
    strategic_gap_summary: narrative.strategic_gap_summary,
    action_implication_summary: narrative.action_implication_summary,
    snapshot_narrative: narrative.snapshot_narrative,
    snapshot_version: APP.SNAPSHOT_VERSION,
    priority_bucket: diagnosis.priority_bucket
  };
}

function buildSnapshotMetrics_(lead, competitorSignals) {
  return {
    business_name: lead.business_name,
    category: lead.category,
    city: lead.city,
    province_state: lead.province_state,
    country: lead.country,
    reviews_count: parseInt(lead.reviews_count, 10) || 0,
    rating: parseFloat(lead.rating) || 0,
    website_present: String(lead.website_present || "").trim() || (lead.website ? "Yes" : "No"),
    phone_present: String(lead.phone_present || "").trim() || (lead.phone ? "Yes" : "No"),

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

  // 1) Very weak public trust
  if (reviews <= 15 && trustScore < 25) {
    return "Invisible";
  }

  // 2) Market is strong and dealership is far behind
  if (
    (compAvg >= 80 || compMax >= 150 || pressureScore >= 65) &&
    gapRatio < 0.40
  ) {
    return "Outgunned";
  }

  // 3) Operationally plausible, but not safe enough yet
  if (
    reviews >= 15 &&
    reviews < 75 &&
    gapRatio >= 0.40 &&
    gapRatio < 0.85 &&
    trustScore >= 20 &&
    trustScore < 55
  ) {
    return "Undersignaled";
  }

  // 4) Competitive enough to be considered, but still not default-safe
  if (
    reviews >= 60 &&
    gapRatio >= 0.65 &&
    gapRatio < 1.00 &&
    trustScore >= 45
  ) {
    return "Contender";
  }

  // 5) Strong visible position
  if (
    authorityPosition === "Leader" ||
    (reviews >= 120 && gapRatio >= 1.00 && trustScore >= 60)
  ) {
    return "Anchor";
  }

  // fallback logic
  if (reviews <= 20) return "Invisible";
  if (gapRatio < 0.50) return "Outgunned";
  if (trustScore < 45 || presenceScore < 70) return "Undersignaled";
  if (gapRatio < 1.00) return "Contender";
  return "Anchor";
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

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const marketPositionSummary = buildMarketPositionSummary_(m, diagnosis.diagnosis_state, {
    basePresenceScore: scores.base_presence_score,
    trustScore: scores.trust_score,
    competitivePressureScore: scores.competitive_pressure_score,
    market_maturity: diagnosis.market_maturity,
    authority_position: diagnosis.authority_position
  });

  const strategicGapSummary = buildStrategicGapSummary_(m, diagnosis.diagnosis_state, {
    basePresenceScore: scores.base_presence_score,
    trustScore: scores.trust_score,
    competitivePressureScore: scores.competitive_pressure_score,
    market_maturity: diagnosis.market_maturity,
    authority_position: diagnosis.authority_position
  });

  const actionImplicationSummary = buildActionImplicationSummary_(m, diagnosis.diagnosis_state, {
    opportunityScore: scores.opportunity_score,
    difficultyScore: scores.difficulty_score,
    competitivePressureScore: scores.competitive_pressure_score,
    market_maturity: diagnosis.market_maturity,
    authority_position: diagnosis.authority_position
  });

  return {
    market_position_summary: marketPositionSummary,
    strategic_gap_summary: strategicGapSummary,
    action_implication_summary: actionImplicationSummary,
    snapshot_narrative: [
      marketPositionSummary,
      strategicGapSummary,
      actionImplicationSummary
    ].join(" ")
  };
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