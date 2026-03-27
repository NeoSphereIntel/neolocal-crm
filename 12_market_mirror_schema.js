/**
 * File: 11_market_mirror_schema.js
 * NeoLocal Market Mirror — schema / normalization layer
 * Apps Script compatible
 */
var MM = typeof MM !== "undefined" ? MM : {};

MM.DEFAULTS = {
  observed: {
    business_name: "",
    niche: "",
    city: "",
    neighborhood: "",
    rating: 0,
    reviews_count: 0,
    competitor_avg_reviews: 0,
    competitor_max_reviews: 0,
    competitor_count_sampled: 0,
    has_website: false,
    has_phone: false,
    has_hours: false,
    has_services: false,
    has_posts: false,
    photo_count_band: "unknown", // none | light | healthy | strong | unknown
    secondary_categories_count: 0,
    has_attributes: false,
    business_model_visible: "",
    map_pack_presence: "unknown", // yes | no | unknown
    primary_category_match: "unknown", // strong | partial | weak | unknown
    offers_service: false
  },
  rep: {
    client_scale: "unknown",      // small | mid | large | enterprise | unknown
    market_scale: "unknown",      // local | metro | regional | major_metro | unknown
    operator_type: "unknown",
    service_breadth: "unknown",
    capacity_band: "unknown",
    team_band: "unknown",
    market_density: "moderate",   // light | moderate | heavy
    quality_positioning: "mainstream",
    urgency_characteristic: "medium",
    repeat_business_characteristic: "medium",

    // Auto retail
    inventory_band: "unknown",    // <40 | 40-100 | 100+ | unknown
    rooftop_count: "unknown",     // 1 | 2-3 | 4+ | unknown
    sales_team_band: "unknown",   // 1-3 | 4-8 | 9+ | unknown
    business_type: "unknown",     // independent | small_group | large_group
    service_department: "unknown",// yes | no | unknown
    financing_model: "unknown",   // standard | special_finance | mixed
    inventory_positioning: "unknown", // budget | mainstream | premium | mixed
    merchandising_quality: "average", // weak | average | strong
    language_market_fit: "unknown", // single-language | bilingual | strong bilingual

    // HVAC
    truck_count_band: "unknown",  // 1-2 | 3-6 | 7+ | unknown
    service_mix: "unknown",       // residential | commercial | both
    emergency_service: "unknown", // yes | no
    maintenance_plans: "unknown", // yes | no
    install_focus: "unknown",     // yes | no
    service_focus: "unknown",     // yes | no
    financing_available: "unknown", // yes | no
    territory_breadth: "unknown", // local | metro | regional
    seasonality_pressure: "moderate", // low | moderate | high
    dispatcher_capacity: "unknown", // low | medium | strong
    brand_positioning: "mainstream", // budget | mid | premium | mixed

    // Roofing
    crew_count_band: "unknown",   // 1-2 | 3-6 | 7+ | unknown
    residential_or_commercial: "unknown", // residential | commercial | both
    emergency_response: "unknown", // yes | no
    insurance_claim_support: "unknown", // yes | no
    storm_dependency: "moderate", // low | moderate | high
    visual_proof_quality: "average", // weak | average | strong
    estimate_process_strength: "average" // weak | average | strong
  }
};

function normalizeMarketMirrorInput_(input) {
  input = input || {};
  var observed = cloneObject_(MM.DEFAULTS.observed);
  var rep = cloneObject_(MM.DEFAULTS.rep);

  mergeObject_(observed, input.observed || {});
  mergeObject_(rep, input.rep || {});

  var vertical_key = input.vertical_key || determineMarketMirrorVertical_(observed, rep);
  return {
    vertical_key: vertical_key,
    observed: observed,
    rep: rep
  };
}

function determineMarketMirrorVertical_(observed, rep) {
  var raw = [
    observed.niche,
    observed.business_name,
    observed.business_model_visible,
    rep.operator_type
  ].join(" ").toLowerCase();

  if (raw.indexOf("dealership") !== -1 || raw.indexOf("used car") !== -1 ||
      raw.indexOf("auto") !== -1 || raw.indexOf("dealer") !== -1 ||
      rep.inventory_band !== "unknown" || rep.rooftop_count !== "unknown") {
    return "auto_retail";
  }
  if (raw.indexOf("hvac") !== -1 || raw.indexOf("heating") !== -1 ||
      raw.indexOf("air conditioning") !== -1 || raw.indexOf("furnace") !== -1 ||
      rep.emergency_service !== "unknown" || rep.truck_count_band !== "unknown") {
    return "hvac";
  }
  if (raw.indexOf("roof") !== -1 || raw.indexOf("roofer") !== -1 ||
      rep.crew_count_band !== "unknown" || rep.insurance_claim_support !== "unknown") {
    return "roofing";
  }
  return "local_service";
}

function cloneObject_(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function mergeObject_(target, source) {
  target = target || {};
  source = source || {};
  Object.keys(source).forEach(function(k) {
    if (source[k] !== undefined && source[k] !== null && source[k] !== "") target[k] = source[k];
  });
  return target;
}

function boolScore_(value) {
  return value ? 100 : 0;
}

function bandScore_(value, map, fallback) {
  if (map.hasOwnProperty(value)) return map[value];
  return fallback === undefined ? 0 : fallback;
}

function clamp_(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round0_(n) {
  return Math.round(Number(n || 0));
}

function safeDiv_(a, b) {
  a = Number(a || 0);
  b = Number(b || 0);
  if (!b) return 0;
  return a / b;
}
