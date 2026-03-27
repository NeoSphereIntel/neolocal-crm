/**
 * File: 14_market_mirror_narratives.js
 * NeoLocal Market Mirror — narrative generation
 */
var MM = typeof MM !== "undefined" ? MM : {};

function generateMarketMirrorNarrative_(payload) {
  var vertical = payload.vertical_key;
  if (vertical === "auto_retail") return generateAutoRetailNarrative_(payload);
  if (vertical === "hvac") return generateHVACNarrative_(payload);
  if (vertical === "roofing") return generateRoofingNarrative_(payload);
  return generateGenericNarrative_(payload);
}

function generateAutoRetailNarrative_(payload) {
  var o = payload.observed;
  var r = payload.rep;
  var d = payload.derived;
  var profile = payload.profile;

  var market = [
    "Buyers compare dealers quickly.",
    "Visible confidence often shapes the shortlist before inventory is compared seriously.",
    "Stores that feel active, credible, and current tend to earn trust faster."
  ];

  var mirror = [
    positionPhrase_(d.position_band, {
      underweighted: "The dealership reads as real, but lighter than it should for the operation behind it.",
      credible: "The dealership looks credible, but not yet like the obvious default choice.",
      competitive: "The dealership is in the competitive set, but not fully carrying dominant weight.",
      strong: "The dealership has visible strength, but staying ahead still depends on signal consistency."
    }),
    marketWeightLine_("dealership", d.market_weight_band),
    buyerConfidenceLine_("dealership", d.buyer_confidence_band)
  ];

  var cost = [
    "Some buyers likely never make it to the call.",
    "Lower first-glance trust usually means harder selling later.",
    "Underweighted stores often end up competing on price or financing sooner than they should."
  ];

  var shift = [
    "Inventory alone is no longer enough.",
    "Google, Maps, and AI-driven discovery compress trust signals fast.",
    "Dealers with stronger visible proof and cleaner public signals compound confidence over time."
  ];

  var path = [
    "NeoLocal turns real dealership activity into stronger public signal.",
    "That helps visible position catch up to operational reality.",
    "The goal is not hype — it is to make the dealership feel as strong online as it is on the ground."
  ];

  var traditional = payload.profile.traditional_effort;

  return {
    headline: buildHeadline_(vertical, d),
    subhead: buildSubhead_(vertical, d),
    sections: {
      market: market,
      mirror: compactUnique_(mirror),
      cost: cost,
      shift: shift,
      path: path,
      traditional: traditional
    }
  };
}

function generateHVACNarrative_(payload) {
  var d = payload.derived;
  var market = [
    "In HVAC, trust is often formed under pressure.",
    "The companies that feel established and ready win confidence faster.",
    "Visible service clarity matters before the first call."
  ];

  var mirror = [
    positionPhrase_(d.position_band, {
      underweighted: "The company appears legitimate, but lighter than the operation likely deserves.",
      credible: "The company looks credible, but not yet weighted like a strong default local choice.",
      competitive: "The company is competitive, but not yet carrying full market authority.",
      strong: "The company has visible strength, but consistency still matters to stay ahead."
    }),
    marketWeightLine_("company", d.market_weight_band),
    buyerConfidenceLine_("company", d.buyer_confidence_band)
  ];

  var cost = [
    "Some urgent or high-intent calls likely go elsewhere first.",
    "Lower trust speed means you can end up competing later and harder.",
    "Weaker visibility often reduces maintenance-plan and higher-value opportunity capture."
  ];

  var shift = [
    "Buyers and Google reward clarity, proof, and consistency.",
    "Completed service activity can strengthen local trust — if it becomes visible.",
    "Operators with stronger public signal earn faster confidence more often."
  ];

  var path = [
    "NeoLocal turns real field activity into stronger local visibility.",
    "That helps service breadth, readiness, and operational legitimacy become easier to trust.",
    "The objective is simple: visible position should reflect the actual seriousness of the operation."
  ];

  return {
    headline: buildHeadline_("hvac", d),
    subhead: buildSubhead_("hvac", d),
    sections: {
      market: market,
      mirror: compactUnique_(mirror),
      cost: cost,
      shift: shift,
      path: path,
      traditional: payload.profile.traditional_effort
    }
  };
}

function generateRoofingNarrative_(payload) {
  var d = payload.derived;
  var market = [
    "Roofing buyers compare risk, not just price.",
    "Visible proof and trust shape who gets shortlisted first.",
    "Stronger local proof tends to win confidence faster, especially when demand spikes."
  ];

  var mirror = [
    positionPhrase_(d.position_band, {
      underweighted: "The business appears real, but lighter and less proven than it probably should.",
      credible: "The company looks credible, but not yet like the safe default shortlist choice.",
      competitive: "The company is competitive, but not yet visibly dominant enough to carry full confidence.",
      strong: "The company has visible strength, but continued proof still matters to hold position."
    }),
    marketWeightLine_("roofing company", d.market_weight_band),
    buyerConfidenceLine_("roofing company", d.buyer_confidence_band)
  ];

  var cost = [
    "Some estimates likely go elsewhere before contact ever happens.",
    "Thin visible proof can create friction on trust and premium pricing.",
    "Weaker public legitimacy reduces shortlist rate in a category where confidence matters early."
  ];

  var shift = [
    "Visible project proof now matters more than generic marketing language.",
    "Platforms and buyers summarize trust quickly.",
    "Roofers who consistently make completed work visible compound local authority faster."
  ];

  var path = [
    "NeoLocal turns completed roofing work into stronger public trust signal.",
    "That helps visual proof, local relevance, and market weight compound over time.",
    "The goal is to make visible position catch up to operational reality."
  ];

  return {
    headline: buildHeadline_("roofing", d),
    subhead: buildSubhead_("roofing", d),
    sections: {
      market: market,
      mirror: compactUnique_(mirror),
      cost: cost,
      shift: shift,
      path: path,
      traditional: payload.profile.traditional_effort
    }
  };
}

function generateGenericNarrative_(payload) {
  var d = payload.derived;
  return {
    headline: buildHeadline_("local_service", d),
    subhead: buildSubhead_("local_service", d),
    sections: {
      market: [
        "Visibility shapes trust faster than most operators realize.",
        "The businesses that look more established usually earn attention first."
      ],
      mirror: [
        "The operation appears credible, but the visible footprint may still be lighter than it should be."
      ],
      cost: [
        "Some opportunities are likely being lost before first contact."
      ],
      shift: [
        "Consistency and visible proof now shape local confidence."
      ],
      path: [
        "NeoLocal turns real activity into stronger public signal."
      ],
      traditional: payload.profile.traditional_effort
    }
  };
}

function buildHeadline_(vertical, derived) {
  if (vertical === "auto_retail") {
    if (derived.pressure_band === "severe") return "The dealership is visible — but not carrying full buyer weight.";
    if (derived.position_band === "competitive") return "The dealership is in the mix — but not yet the obvious default choice.";
    return "Visible trust is forming faster than most dealers realize.";
  }
  if (vertical === "hvac") {
    if (derived.pressure_band === "severe") return "The operation is credible — but not yet winning trust fast enough.";
    if (derived.position_band === "competitive") return "The company is competitive — but not fully weighted like a market leader.";
    return "In HVAC, visible trust often decides the first call.";
  }
  if (vertical === "roofing") {
    if (derived.pressure_band === "severe") return "The business is real — but not yet carrying the proof weight buyers look for.";
    if (derived.position_band === "competitive") return "The company is competitive — but not yet visibly dominant enough to feel like the safe default.";
    return "In roofing, trust and visible proof shape the shortlist early.";
  }
  return "Strong operators do not always win. Strong visible operators do.";
}

function buildSubhead_(vertical, derived) {
  var acceleration = {
    fast: "The good news: the position looks movable once signal structure improves.",
    moderate: "The position is workable, but consistency matters.",
    gradual: "The position can improve, but the climb will be more gradual.",
    slow_build: "This is fixable, but it is likely a slower build."
  }[derived.acceleration_band] || "The position is workable, but consistency matters.";

  if (vertical === "auto_retail") return acceleration;
  if (vertical === "hvac") return acceleration;
  if (vertical === "roofing") return acceleration;
  return acceleration;
}

function positionPhrase_(positionBand, map) {
  return map[positionBand] || map.credible;
}

function marketWeightLine_(entity, marketWeightBand) {
  var map = {
    light: "Relative to comparable operators, the visible market weight still feels light.",
    emerging: "Relative to comparable operators, the market weight is emerging but not yet convincing enough.",
    substantial: "Relative to comparable operators, the market weight is substantial enough to compete seriously.",
    heavy: "Relative to comparable operators, the market weight already reads strong."
  };
  return map[marketWeightBand] || map.emerging;
}

function buyerConfidenceLine_(entity, confidenceBand) {
  var map = {
    fragile: "First-glance confidence still looks too fragile.",
    developing: "First-glance confidence is developing, but not yet decisive.",
    solid: "First-glance confidence reads solid.",
    strong: "First-glance confidence reads strong."
  };
  return map[confidenceBand] || map.developing;
}

function compactUnique_(arr) {
  var out = [];
  var seen = {};
  (arr || []).forEach(function(v) {
    var key = String(v || "").trim();
    if (key && !seen[key]) {
      seen[key] = true;
      out.push(key);
    }
  });
  return out;
}
