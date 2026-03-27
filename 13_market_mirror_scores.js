/**
 * File: 13_market_mirror_scores.js
 * NeoLocal Market Mirror — scoring / classification layer
 */
var MM = typeof MM !== "undefined" ? MM : {};

MM.SCORING = {
  photoBand: {
    none: 0,
    light: 35,
    healthy: 70,
    strong: 90,
    unknown: 40
  },
  categoryMatch: {
    weak: 20,
    partial: 60,
    strong: 100,
    unknown: 50
  },
  mapPack: {
    no: 20,
    unknown: 50,
    yes: 90
  },
  inventoryBand: {
    "<40": 25,
    "40-100": 60,
    "100+": 90,
    unknown: 45
  },
  rooftopCount: {
    "1": 35,
    "2-3": 65,
    "4+": 90,
    unknown: 45
  },
  salesTeamBand: {
    "1-3": 25,
    "4-8": 60,
    "9+": 90,
    unknown: 45
  },
  truckCountBand: {
    "1-2": 25,
    "3-6": 60,
    "7+": 90,
    unknown: 45
  },
  crewCountBand: {
    "1-2": 25,
    "3-6": 60,
    "7+": 90,
    unknown: 45
  },
  marketDensity: {
    light: 25,
    moderate: 55,
    heavy: 85
  },
  merchandisingQuality: {
    weak: 25,
    average: 60,
    strong: 90
  },
  visualProofQuality: {
    weak: 25,
    average: 60,
    strong: 90
  },
  estimateProcessStrength: {
    weak: 25,
    average: 60,
    strong: 90
  },
  dispatcherCapacity: {
    low: 25,
    medium: 60,
    strong: 90,
    unknown: 45
  },
  urgency: {
    low: 30,
    medium: 60,
    high: 90
  },
  seasonality: {
    low: 35,
    moderate: 60,
    high: 85
  }
};

function calculateMarketMirrorDerived_(normalized) {
  var o = normalized.observed;
  var r = normalized.rep;
  var vertical = normalized.vertical_key;
  var profile = getMarketMirrorVerticalProfile_(vertical);

  var trust_gap = round0_((o.competitor_avg_reviews || 0) - (o.reviews_count || 0));
  var gap_ratio = safeDiv_(o.reviews_count || 0, o.competitor_avg_reviews || 0);

  var review_strength = scoreReviewStrength_(o.reviews_count, o.competitor_avg_reviews, vertical);
  var rating_strength = scoreRatingStrength_(o.rating);
  var completeness = scorePresenceCompleteness_(o);
  var proof = scoreProofOfWork_(o, r, vertical);
  var market_weight = scoreMarketWeight_(o, r, vertical);
  var buyer_confidence = scoreBuyerConfidence_(o, r, vertical, review_strength, rating_strength, completeness);
  var pressure = scoreVisibilityPressure_(vertical, gap_ratio, trust_gap, completeness, proof, market_weight, r);
  var acceleration = scoreAccelerationPotential_(vertical, pressure, completeness, proof, market_weight, r);

  var derived = {
    trust_gap: trust_gap,
    gap_ratio: round0_(gap_ratio * 100),
    review_strength: review_strength,
    rating_strength: rating_strength,
    presence_completeness: completeness,
    proof_of_work_signal: proof,
    market_weight: market_weight,
    buyer_confidence: buyer_confidence,
    visibility_pressure: pressure,
    acceleration_potential: acceleration,

    trust_band: bandFromScore_(review_strength, [35, 60, 80], ["weak", "emerging", "competitive", "strong"]),
    completeness_band: bandFromScore_(completeness, [40, 65, 85], ["thin", "partial", "solid", "strong"]),
    proof_band: bandFromScore_(proof, [35, 60, 80], ["light", "developing", "visible", "strong"]),
    pressure_band: bandFromScoreReverse_(pressure, [40, 60, 80], ["low", "moderate", "high", "severe"]),
    acceleration_band: bandFromScore_(acceleration, [40, 60, 80], ["slow_build", "gradual", "moderate", "fast"]),
    buyer_confidence_band: bandFromScore_(buyer_confidence, [40, 60, 80], ["fragile", "developing", "solid", "strong"]),
    market_weight_band: bandFromScore_(market_weight, [35, 60, 80], ["light", "emerging", "substantial", "heavy"]),
    comparison_scope: deriveComparisonScope_(vertical, r),
    position_band: derivePositionBand_(vertical, market_weight, pressure, buyer_confidence, review_strength),
    market_density_band: r.market_density || "moderate"
  };

  derived.metric_explanations = getMetricExplanations_(derived, profile);
  return derived;
}

function scoreReviewStrength_(reviewsCount, competitorAvg, vertical) {
  var gapRatio = safeDiv_(reviewsCount || 0, competitorAvg || 0);
  var base = clamp_(round0_(gapRatio * 100), 0, 100);

  if (vertical === "roofing" || vertical === "hvac") base += 5;
  if (vertical === "auto_retail") base -= 5; // reviews matter, but inventory / merchandising matter more
  return clamp_(base, 0, 100);
}

function scoreRatingStrength_(rating) {
  rating = Number(rating || 0);
  if (rating <= 0) return 35;
  if (rating < 4.2) return 40;
  if (rating < 4.5) return 65;
  if (rating < 4.7) return 80;
  return 92;
}

function scorePresenceCompleteness_(o) {
  var score = 0;
  score += boolScore_(o.has_website) * 0.16;
  score += boolScore_(o.has_phone) * 0.12;
  score += boolScore_(o.has_hours) * 0.12;
  score += boolScore_(o.has_services) * 0.12;
  score += boolScore_(o.has_posts) * 0.08;
  score += bandScore_(o.photo_count_band, MM.SCORING.photoBand, 40) * 0.16;
  score += clamp_(Number(o.secondary_categories_count || 0) * 20, 0, 100) * 0.08;
  score += boolScore_(o.has_attributes) * 0.06;
  score += bandScore_(o.primary_category_match, MM.SCORING.categoryMatch, 50) * 0.06;
  score += bandScore_(o.map_pack_presence, MM.SCORING.mapPack, 50) * 0.04;
  return clamp_(round0_(score), 0, 100);
}

function scoreProofOfWork_(o, r, vertical) {
  var score = 0;
  score += bandScore_(o.photo_count_band, MM.SCORING.photoBand, 40) * 0.35;
  score += boolScore_(o.has_posts) * 0.15;
  score += boolScore_(o.has_services) * 0.10;
  score += boolScore_(o.has_attributes) * 0.05;
  score += bandScore_(o.primary_category_match, MM.SCORING.categoryMatch, 50) * 0.10;

  if (vertical === "auto_retail") {
    score += bandScore_(r.merchandising_quality, MM.SCORING.merchandisingQuality, 60) * 0.25;
  } else if (vertical === "roofing") {
    score += bandScore_(r.visual_proof_quality, MM.SCORING.visualProofQuality, 60) * 0.25;
  } else if (vertical === "hvac") {
    score += boolScore_(r.emergency_service === "yes") * 0.12;
    score += boolScore_(r.maintenance_plans === "yes") * 0.08;
    score += bandScore_(r.dispatcher_capacity, MM.SCORING.dispatcherCapacity, 45) * 0.05;
  }
  return clamp_(round0_(score), 0, 100);
}

function scoreMarketWeight_(o, r, vertical) {
  var review_strength = scoreReviewStrength_(o.reviews_count, o.competitor_avg_reviews, vertical);
  var score = review_strength * 0.25;

  if (vertical === "auto_retail") {
    score += bandScore_(r.inventory_band, MM.SCORING.inventoryBand, 45) * 0.35;
    score += bandScore_(r.rooftop_count, MM.SCORING.rooftopCount, 45) * 0.20;
    score += bandScore_(r.sales_team_band, MM.SCORING.salesTeamBand, 45) * 0.20;
  } else if (vertical === "hvac") {
    score += bandScore_(r.truck_count_band, MM.SCORING.truckCountBand, 45) * 0.35;
    score += bandScore_(r.team_band, MM.SCORING.salesTeamBand, 45) * 0.20;
    score += boolScore_(r.emergency_service === "yes") * 0.10;
    score += boolScore_(r.financing_available === "yes") * 0.10;
  } else if (vertical === "roofing") {
    score += bandScore_(r.crew_count_band, MM.SCORING.crewCountBand, 45) * 0.30;
    score += bandScore_(r.truck_count_band, MM.SCORING.truckCountBand, 45) * 0.15;
    score += boolScore_(r.financing_available === "yes") * 0.10;
    score += boolScore_(r.insurance_claim_support === "yes") * 0.10;
    score += bandScore_(r.visual_proof_quality, MM.SCORING.visualProofQuality, 60) * 0.10;
  }
  return clamp_(round0_(score), 0, 100);
}

function scoreBuyerConfidence_(o, r, vertical, reviewStrength, ratingStrength, completeness) {
  var score = 0;
  score += ratingStrength * 0.25;
  score += reviewStrength * 0.20;
  score += completeness * 0.20;
  score += bandScore_(o.photo_count_band, MM.SCORING.photoBand, 40) * 0.10;
  score += boolScore_(o.has_website) * 0.05;
  score += boolScore_(o.has_phone) * 0.05;
  score += boolScore_(o.has_hours) * 0.05;

  if (vertical === "auto_retail") {
    score += bandScore_(r.merchandising_quality, MM.SCORING.merchandisingQuality, 60) * 0.10;
  } else if (vertical === "hvac") {
    score += boolScore_(r.emergency_service === "yes") * 0.05;
    score += boolScore_(r.financing_available === "yes") * 0.05;
  } else if (vertical === "roofing") {
    score += bandScore_(r.estimate_process_strength, MM.SCORING.estimateProcessStrength, 60) * 0.05;
    score += boolScore_(r.financing_available === "yes") * 0.05;
  }
  return clamp_(round0_(score), 0, 100);
}

function scoreVisibilityPressure_(vertical, gapRatio, trustGap, completeness, proof, marketWeight, r) {
  var density = bandScore_(r.market_density, MM.SCORING.marketDensity, 55);
  var pressure = 100 - clamp_(round0_(gapRatio * 100), 0, 100);
  pressure = pressure * 0.35 + (100 - completeness) * 0.20 + (100 - proof) * 0.20 + (100 - marketWeight) * 0.10 + density * 0.15;

  if (vertical === "hvac" && r.emergency_service === "yes") pressure -= 4;
  if (vertical === "roofing" && r.visual_proof_quality === "strong") pressure -= 5;
  if (vertical === "auto_retail" && r.inventory_band === "100+") pressure -= 4;

  if (trustGap > 150) pressure += 6;
  if (trustGap < 0) pressure -= 8;

  return clamp_(round0_(pressure), 0, 100);
}

function scoreAccelerationPotential_(vertical, pressure, completeness, proof, marketWeight, r) {
  var capacity = 45;
  if (vertical === "auto_retail") {
    capacity =
      bandScore_(r.inventory_band, MM.SCORING.inventoryBand, 45) * 0.45 +
      bandScore_(r.sales_team_band, MM.SCORING.salesTeamBand, 45) * 0.25 +
      bandScore_(r.rooftop_count, MM.SCORING.rooftopCount, 45) * 0.30;
  } else if (vertical === "hvac") {
    capacity =
      bandScore_(r.truck_count_band, MM.SCORING.truckCountBand, 45) * 0.45 +
      bandScore_(r.team_band, MM.SCORING.salesTeamBand, 45) * 0.25 +
      boolScore_(r.emergency_service === "yes") * 0.15 +
      boolScore_(r.maintenance_plans === "yes") * 0.15;
  } else if (vertical === "roofing") {
    capacity =
      bandScore_(r.crew_count_band, MM.SCORING.crewCountBand, 45) * 0.40 +
      bandScore_(r.truck_count_band, MM.SCORING.truckCountBand, 45) * 0.15 +
      bandScore_(r.visual_proof_quality, MM.SCORING.visualProofQuality, 60) * 0.25 +
      boolScore_(r.insurance_claim_support === "yes") * 0.10 +
      boolScore_(r.financing_available === "yes") * 0.10;
  }

  var readiness = completeness * 0.45 + proof * 0.55;
  var marketFavorability = 100 - bandScore_(r.market_density, MM.SCORING.marketDensity, 55);

  var score = capacity * 0.40 + readiness * 0.30 + (100 - pressure) * 0.20 + marketFavorability * 0.10;
  return clamp_(round0_(score), 0, 100);
}

function bandFromScore_(score, thresholds, labels) {
  if (score < thresholds[0]) return labels[0];
  if (score < thresholds[1]) return labels[1];
  if (score < thresholds[2]) return labels[2];
  return labels[3];
}

function bandFromScoreReverse_(score, thresholds, labels) {
  if (score < thresholds[0]) return labels[0];
  if (score < thresholds[1]) return labels[1];
  if (score < thresholds[2]) return labels[2];
  return labels[3];
}

function deriveComparisonScope_(vertical, r) {
  if (vertical === "auto_retail") {
    var bt = r.business_type || "independent";
    if (bt === "large_group") return "large-group vs large-group";
    if (bt === "small_group") return "small-group vs small-group";
    return "independent vs independent";
  }
  if (vertical === "hvac") {
    if (r.service_mix === "commercial") return "commercial-focused HVAC peers";
    if (r.service_mix === "both") return "mixed residential / commercial HVAC peers";
    return "residential-focused HVAC peers";
  }
  if (vertical === "roofing") {
    if (r.residential_or_commercial === "commercial") return "commercial roofing peers";
    if (r.residential_or_commercial === "both") return "mixed roofing peers";
    return "residential roofing peers";
  }
  return "comparable local operators";
}

function derivePositionBand_(vertical, marketWeight, pressure, buyerConfidence, reviewStrength) {
  var composite = round0_(marketWeight * 0.35 + buyerConfidence * 0.35 + reviewStrength * 0.10 + (100 - pressure) * 0.20);
  if (composite < 40) return "underweighted";
  if (composite < 60) return "credible";
  if (composite < 80) return "competitive";
  return "strong";
}

function getMetricExplanations_(derived, profile) {
  return {
    trust_gap: "How far the visible trust footprint sits behind comparable competitors in this market.",
    presence_completeness: "How complete and buyer-ready the public presence appears.",
    proof_of_work_signal: "How much visible evidence the market is getting that this business is active, current, and credible.",
    market_weight: "How substantial the business appears relative to comparable operators.",
    buyer_confidence: "How trustworthy and ready-to-contact the business feels at first glance.",
    visibility_pressure: "How much competitive pressure is coming from stronger visible competitors in the local market.",
    acceleration_potential: "How quickly visible position could improve once real activity is translated into stronger public signal."
  };
}
