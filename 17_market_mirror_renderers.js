/**
 * File: 17_market_mirror_renderers.js
 * NeoLocal Market Mirror — branded HTML renderers
 * Styling direction intentionally preserved: premium, readable, not flattened.
 */
var MM = typeof MM !== "undefined" ? MM : {};

/* ============================================================
   V3 TEMPLATE RENDERER
   Reads neolocal-market-mirror-v3-template.html and replaces
   every {{token}} with data from the lead record.
============================================================ */

function renderMarketMirrorV3Html_(lead) {
  var html = HtmlService.createHtmlOutputFromFile('neolocal-market-mirror-v3-template').getContent();
  var tokens = buildV3TokenMap_(lead);
  return replaceV3Tokens_(html, tokens);
}

function replaceV3Tokens_(html, tokens) {
  var keys = Object.keys(tokens);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = escapeHtml_(String(tokens[key] == null ? '' : tokens[key]));
    html = html.split('{{' + key + '}}').join(value);
  }
  return html;
}

function v3DimColor_(score) {
  score = Number(score) || 0;
  return score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
}

function v3VerticalLabel_(vertical) {
  var labels = {
    auto_retail:   'Automotive Retail',
    hvac:          'HVAC & Mechanical',
    roofing:       'Roofing & Exteriors',
    local_service: 'Local Service'
  };
  return labels[vertical] || 'Local Business';
}

function buildV3TokenMap_(lead) {
  var mcs   = Number(lead.marketCaptureScore)          || 0;
  var disc  = Number(lead.discoveryPositionScore)       || 0;
  var prof  = Number(lead.profileAuthorityScore)        || 0;
  var trust = Number(lead.trustSurfaceScore)            || 0;
  var eng   = Number(lead.ownerEngagementScore)         || 0;
  var disp  = Number(lead.competitiveDisplacementScore) || 0;

  var diagDisplay = String(lead.diagnosisState || '');
  var diagClass   = diagDisplay.toLowerCase();

  var reviews = Number(lead.reviews) || 0;
  var rating  = Number(lead.rating)  || 0;

  var vertical  = detectVerticalFromCategory_(lead.category);
  var vertLabel = v3VerticalLabel_(vertical);

  var dims = [
    { label: 'Discovery',            score: disc  },
    { label: 'Profile Authority',    score: prof  },
    { label: 'Trust Surface',        score: trust },
    { label: 'Owner Engagement',     score: eng   },
    { label: 'Competitive Position', score: disp  }
  ];
  var weakest    = dims.reduce(function(min, d) { return d.score < min.score ? d : min; }, dims[0]);
  var sortedDims = dims.slice().sort(function(a, b) { return a.score - b.score; });

  function tier(score, high, mid, low) {
    return score >= 70 ? high : score >= 40 ? mid : low;
  }

  var pathActions = sortedDims.slice(0, 3).map(function(d) {
    return 'Strengthen ' + d.label + ' surface (currently ' + d.score + '/100)';
  });

  var heroCopy = String(lead.marketPositionSummary || '').trim() ||
    'See how ' + (lead.businessName || 'this business') + ' reads in the local market — and where visible position can be strengthened.';

  var vt = v3VerticalTokens_(vertical, lead);

  return {
    business_name:  lead.businessName || '',
    vertical_label: vertLabel,
    hero_copy:      heroCopy,

    market_capture_score: mcs,
    diagnosis_state:      diagDisplay,
    diagnosis_class:      diagClass,

    weakest_dimension_label:   weakest.label,
    weakest_dimension_insight: 'This is the highest-leverage surface for improvement.',

    discovery_position_score:       disc,
    profile_authority_score:        prof,
    trust_surface_score:            trust,
    owner_engagement_score:         eng,
    competitive_displacement_score: disp,

    discovery_color:    v3DimColor_(disc),
    profile_color:      v3DimColor_(prof),
    trust_color:        v3DimColor_(trust),
    engagement_color:   v3DimColor_(eng),
    displacement_color: v3DimColor_(disp),

    review_count:          reviews,
    rating:                rating || '—',
    peer_avg_reviews:      '—',
    peer_avg_rating:       '—',
    rating_trend:          '—',
    review_topics_summary: 'Key service and experience themes',
    reviews_sampled:       reviews,
    latest_review_date:    '—',

    owner_response_rate:  '—',
    latest_response_date: '—',
    engagement_insight:   tier(eng,
      'Owner actively manages customer conversations.',
      'Inconsistent review response patterns detected.',
      'Low owner response activity — trust signal at risk.'),

    photo_count:              '—',
    owner_photos:             '—',
    total_photos:             '—',
    service_options_summary:  '—',
    photo_categories_summary: '—',
    profile_insight: tier(prof,
      'Profile is well-completed and clearly signals credibility.',
      'Several profile fields missing — adding them would strengthen authority.',
      'Thin profile — significant credibility signal missing from the market.'),

    maps_position:          '—',
    similar_places_count:   '—',
    competitor_1_name:      'Not identified',
    also_search_for_summary:'—',
    competitive_insight: tier(disp,
      'Leading vs comparable nearby operators.',
      'Competing but not separating from the pack.',
      'Losing visibility to stronger nearby operators.'),

    discovery_insight_1: tier(disc,
      'Appearing consistently in primary local map results.',
      'Partial map presence — not appearing for all key terms.',
      'Not appearing in local map pack for primary search terms.'),
    discovery_insight_2: disc >= 40
      ? 'Category and keyword alignment is present.'
      : 'Category signals may be misaligned with how customers search.',

    discovery_card_title:   tier(disc,  'Strong local search presence',      'Moderate search visibility',       'Low search visibility — gap opportunity'),
    trust_card_title:       tier(trust, 'Solid trust footprint vs peers',    'Developing trust signal',          'Trust gap vs peer average'),
    engagement_card_title:  tier(eng,   'Active owner presence',             'Partial owner engagement',         'Low owner responsiveness detected'),
    profile_card_title:     tier(prof,  'Well-optimized profile',            'Profile has growth opportunity',   'Profile needs strengthening'),
    competitive_card_title: tier(disp,  'Holding strong vs the market',      'Mid-market position',              'Under competitive pressure'),
    neolocal_card_title:    'Where NeoLocal accelerates this',

    profile_authority_detail:        tier(prof, 'Complete, well-signaled profile.',      'Partial profile — key fields missing.',       'Thin profile — significant signal gap.'),
    competitive_displacement_detail: tier(disp, 'Leading vs comparable nearby operators.','Competing but not separating from the pack.',     'Losing ground to stronger nearby operators.'),

    path_action_1: pathActions[0] || '—',
    path_action_2: pathActions[1] || '—',
    path_action_3: pathActions[2] || '—',

    hero_headline_line1: vt.hero_headline_line1,
    hero_headline_line2: vt.hero_headline_line2,
    comparison_sub:      vt.comparison_sub,
    trad_point_1: vt.trad_point_1, trad_point_2: vt.trad_point_2,
    trad_point_3: vt.trad_point_3, trad_point_4: vt.trad_point_4,
    trad_point_5: vt.trad_point_5, trad_point_6: vt.trad_point_6,
    neo_point_1:  vt.neo_point_1,  neo_point_2:  vt.neo_point_2,
    neo_point_3:  vt.neo_point_3,  neo_point_4:  vt.neo_point_4,
    neo_point_5:  vt.neo_point_5,  neo_point_6:  vt.neo_point_6,
    footer_statement: vt.footer_statement
  };
}

function v3VerticalTokens_(vertical, lead) {
  // Placeholder tokens — will be replaced by proper vertical config in the next phase.
  var name = String(lead.businessName || 'This Business');
  return {
    hero_headline_line1: name,
    hero_headline_line2: 'Market Position',
    comparison_sub:      'Two paths to local market position. One compounds over time. One stays invisible.',
    trad_point_1: 'Rely on word-of-mouth without a systematic approach',
    trad_point_2: 'Inconsistent or incomplete online profile',
    trad_point_3: 'Slow or absent response to customer reviews',
    trad_point_4: 'Low visibility in local search for primary terms',
    trad_point_5: 'No data on competitive position or peer benchmarks',
    trad_point_6: 'Visible presence does not reflect real operational quality',
    neo_point_1:  'Structured review cadence compounds trust over time',
    neo_point_2:  'Profile completeness drives discovery in local search',
    neo_point_3:  'Competitive position tracked and benchmarked monthly',
    neo_point_4:  'Market signals translated into clear, actionable steps',
    neo_point_5:  'Visible position grows systematically — not by accident',
    neo_point_6:  'Real-world quality becomes visible market position',
    footer_statement: 'Strong operators do not need more hype. They need visible position that reflects the work they already do.'
  };
}

function renderMarketMirrorHtml_(payload) {
  var n = payload.narrative;
  var d = payload.derived;
  var p = payload.profile;
  var labels = p.metric_labels;
  var businessName = escapeHtml_(payload.observed.business_name || "This business");

  return [
'<!DOCTYPE html>',
'<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">',
'<title>NeoLocal Market Mirror</title>',
'<style>',
'@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&family=Barlow+Condensed:wght@300;400;600;700&display=swap");',
':root{--navy:#00195c;--navy-deep:#000e38;--orange:#ed8220;--red:#bd0e20;--white:#ffffff;--off:#f4f3ef;--off2:#e4e2db;--gray:#5a6378;--dark:#080e22;--green:#1a6640;}',
'body{margin:0;background:var(--off);color:var(--dark);font-family:"Barlow",sans-serif;-webkit-font-smoothing:antialiased;}',
'.mm-wrap{max-width:1180px;margin:0 auto;padding:40px 20px 70px;}',
'.mm-hero{background:var(--navy-deep);border-radius:14px;padding:32px 36px 34px;position:relative;overflow:hidden;box-shadow:0 18px 42px rgba(0,14,56,.16);}',
'.mm-hero:before{content:"";position:absolute;top:-15%;right:-8%;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(237,130,32,.18) 0%,transparent 68%);pointer-events:none;}',
'.mm-logo-pill{position:relative;z-index:2;background:#fff;border-radius:8px;padding:10px 18px 8px 14px;display:inline-flex;align-items:center;box-shadow:0 4px 24px rgba(0,0,0,.25);margin-bottom:18px;}',
'.mm-logo-text{font-family:"Barlow Condensed",sans-serif;font-size:24px;font-weight:700;color:var(--navy);letter-spacing:.5px;}',
'.mm-eyebrow{position:relative;z-index:2;font-family:"Barlow Condensed",sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:14px;}',
'.mm-title{position:relative;z-index:2;font-family:"Bebas Neue",sans-serif;font-size:58px;line-height:.92;letter-spacing:1px;color:#fff;margin:0 0 12px;}',
'.mm-sub{position:relative;z-index:2;max-width:760px;font-size:17px;line-height:1.65;color:rgba(255,255,255,.72);border-left:3px solid var(--orange);padding-left:16px;}',
'.mm-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:24px;position:relative;z-index:2;}',
'.mm-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px 14px;}',
'.mm-chip-l{font-family:"Barlow Condensed",sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:5px;}',
'.mm-chip-v{font-size:14px;color:#fff;}',
'.mm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:22px;}',
'.mm-card{background:#fff;border-radius:10px;padding:24px 24px 22px;box-shadow:0 6px 20px rgba(0,25,92,.06);border-top:4px solid var(--navy);}',
'.mm-card.accent{border-top-color:var(--orange);}',
'.mm-card.green{border-top-color:var(--green);}',
'.mm-card.red{border-top-color:var(--red);}',
'.mm-card h3{margin:0 0 10px;font-family:"Barlow Condensed",sans-serif;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--gray);}',
'.mm-bullets{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;}',
'.mm-bullets li{font-size:15px;line-height:1.55;color:var(--dark);}',
'.mm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:20px;}',
'.mm-metric{background:#fff;border-radius:10px;padding:22px 22px 18px;box-shadow:0 6px 20px rgba(0,25,92,.06);border-left:4px solid var(--orange);}',
'.mm-metric:nth-child(2){border-left-color:var(--navy);} .mm-metric:nth-child(3){border-left-color:var(--green);} .mm-metric:nth-child(4){border-left-color:var(--red);}',
'.mm-score{font-family:"Bebas Neue",sans-serif;font-size:44px;line-height:.95;color:var(--navy);margin:0 0 8px;}',
'.mm-mlabel{font-family:"Barlow Condensed",sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gray);margin-bottom:8px;}',
'.mm-mdesc{font-size:14px;line-height:1.55;color:var(--gray);}',
'.mm-mband{display:inline-block;margin-top:12px;background:var(--off);border-radius:999px;padding:6px 10px;font-family:"Barlow Condensed",sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--navy);}',
'.mm-foot{margin-top:22px;background:var(--navy);border-radius:10px;padding:24px 26px;color:#fff;}',
'.mm-foot h3{margin:0 0 12px;font-family:"Barlow Condensed",sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.55);}',
'.mm-foot ul{margin:0;padding-left:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;}',
'.mm-foot li{color:rgba(255,255,255,.88);font-size:14px;line-height:1.5;}',
'.mm-close{margin-top:18px;text-align:center;font-size:15px;color:var(--gray);}',
'@media (max-width: 900px){.mm-grid{grid-template-columns:1fr;}.mm-foot ul{grid-template-columns:1fr;}.mm-title{font-size:42px;}}',
'</style></head><body>',
'<div class="mm-wrap">',
'<section class="mm-hero">',
'<div class="mm-logo-pill"><div class="mm-logo-text">NeoLocal<span style="font-size:12px;vertical-align:top;">™</span></div></div>',
'<div class="mm-eyebrow">NeoLocal Market Mirror</div>',
'<h1 class="mm-title">' + escapeHtml_(n.headline) + '</h1>',
'<div class="mm-sub">' + escapeHtml_(n.subhead) + '</div>',
'<div class="mm-meta">',
renderChip_("Business", businessName),
renderChip_("Vertical", escapeHtml_(p.label)),
renderChip_("Position", escapeHtml_(humanizeToken_(d.position_band))),
renderChip_("Comparison Scope", escapeHtml_(d.comparison_scope)),
renderChip_("Pressure", escapeHtml_(humanizeToken_(d.pressure_band))),
renderChip_("Acceleration", escapeHtml_(humanizeToken_(d.acceleration_band))),
'</div></section>',

'<section class="mm-grid">',
renderBulletCard_("The Market", n.sections.market, "accent"),
renderBulletCard_("The Mirror", n.sections.mirror, ""),
renderBulletCard_("What This Costs", n.sections.cost, "red"),
renderBulletCard_("What Is Changing", n.sections.shift, ""),
renderBulletCard_("The NeoLocal Path", n.sections.path, "green"),
renderBulletCard_("Traditional Approach", n.sections.traditional, ""),
'</section>',

'<section class="mm-metrics">',
renderMetricCard_(labels.trust_gap, d.trust_gap, d.metric_explanations.trust_gap, d.trust_band),
renderMetricCard_(labels.presence_completeness, d.presence_completeness, d.metric_explanations.presence_completeness, d.completeness_band),
renderMetricCard_(labels.proof_of_work_signal, d.proof_of_work_signal, d.metric_explanations.proof_of_work_signal, d.proof_band),
renderMetricCard_(labels.market_weight, d.market_weight, d.metric_explanations.market_weight, d.market_weight_band),
renderMetricCard_(labels.buyer_confidence, d.buyer_confidence, d.metric_explanations.buyer_confidence, d.buyer_confidence_band),
renderMetricCard_(labels.visibility_pressure, d.visibility_pressure, d.metric_explanations.visibility_pressure, d.pressure_band),
renderMetricCard_(labels.acceleration_potential, d.acceleration_potential, d.metric_explanations.acceleration_potential, d.acceleration_band),
'</section>',

'<section class="mm-foot"><h3>What This Means</h3><ul>',
'<li>These scores are proprietary, but built from real public and operational signals.</li>',
'<li>The scoring exists to clarify position — not to impress with random numbers.</li>',
'<li>Reviews matter, but never stand alone.</li>',
'<li>Scale-aware comparisons are built into the engine.</li>',
'</ul></section>',

'<div class="mm-close">Strong operators do not need more hype. They need visible position that reflects the work they already do.</div>',
'</div></body></html>'
  ].join("");
}

function renderRepSupportSheetHtml_(payload) {
  var rep = payload.rep_sheet;
  var businessName = escapeHtml_(payload.observed.business_name || "This business");
  function renderPromptGroup(title, items) {
    return [
      '<section class="rs-card">',
      '<h3>' + escapeHtml_(title) + '</h3>',
      '<ul>' + (items || []).map(function(x){return '<li>' + escapeHtml_(x) + '</li>';}).join("") + '</ul>',
      '</section>'
    ].join("");
  }

  return [
'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>NeoLocal Rep Support Sheet</title>',
'<style>',
'@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&family=Barlow+Condensed:wght@300;400;600;700&display=swap");',
':root{--navy:#00195c;--navy-deep:#000e38;--orange:#ed8220;--white:#fff;--off:#f4f3ef;--off2:#e4e2db;--gray:#5a6378;--dark:#080e22;--green:#1a6640;}',
'body{margin:0;background:var(--off);color:var(--dark);font-family:"Barlow",sans-serif;}',
'.rs-wrap{max-width:1100px;margin:0 auto;padding:36px 20px 60px;}',
'.rs-hero{background:var(--navy-deep);color:#fff;border-radius:14px;padding:28px 32px 30px;margin-bottom:18px;}',
'.rs-eyebrow{font-family:"Barlow Condensed",sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:10px;}',
'.rs-title{font-family:"Bebas Neue",sans-serif;font-size:52px;line-height:.92;margin:0 0 8px;}',
'.rs-sub{max-width:760px;font-size:16px;line-height:1.6;color:rgba(255,255,255,.74);} .rs-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}',
'.rs-card{background:#fff;border-radius:10px;padding:22px 22px 18px;box-shadow:0 6px 18px rgba(0,25,92,.06);border-top:4px solid var(--orange);} .rs-card:nth-child(even){border-top-color:var(--navy);}',
'.rs-card h3{margin:0 0 10px;font-family:"Barlow Condensed",sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--gray);}',
'.rs-card ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;} .rs-card li{font-size:15px;line-height:1.55;}',
'.rs-mini{margin-top:18px;background:#fff;border-radius:10px;padding:22px 22px 18px;box-shadow:0 6px 18px rgba(0,25,92,.06);} .rs-mini h3{margin:0 0 10px;font-family:"Barlow Condensed",sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--gray);} .rs-mini ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;}',
'@media (max-width:900px){.rs-grid{grid-template-columns:1fr;}.rs-title{font-size:40px;}}',
'</style></head><body><div class="rs-wrap">',
'<section class="rs-hero"><div class="rs-eyebrow">NeoLocal Rep Support Sheet</div><h1 class="rs-title">Guide the conversation.<br>Do not read the slide.</h1><div class="rs-sub">Account: ' + businessName + '. Use the mirror to trigger agreement, surface friction, and lead naturally toward the deal.</div></section>',
'<section class="rs-grid">',
renderPromptGroup("Intro rules", rep.intro),
renderPromptGroup("Validation prompts", rep.validation_prompts),
renderPromptGroup("Market prompts", rep.prompt_groups.market),
renderPromptGroup("Mirror prompts", rep.prompt_groups.mirror),
renderPromptGroup("Cost prompts", rep.prompt_groups.cost),
renderPromptGroup("Close prompts", rep.prompt_groups.close),
'</section>',
'<section class="rs-mini"><h3>Metric bridge lines</h3><ul>' + rep.metric_bridge_lines.map(function(x){return '<li>' + escapeHtml_(x) + '</li>';}).join("") + '</ul></section>',
'<section class="rs-mini"><h3>Close transition</h3><ul><li>' + escapeHtml_(rep.close_transition) + '</li></ul></section>',
'</div></body></html>'
  ].join("");
}

function renderChip_(label, value) {
  return '<div class="mm-chip"><div class="mm-chip-l">' + label + '</div><div class="mm-chip-v">' + value + '</div></div>';
}

function renderBulletCard_(title, bullets, extraClass) {
  return '<article class="mm-card ' + (extraClass || '') + '"><h3>' + escapeHtml_(title) + '</h3><ul class="mm-bullets">' +
    (bullets || []).map(function(x){ return '<li>' + escapeHtml_(x) + '</li>'; }).join("") +
    '</ul></article>';
}

function renderMetricCard_(label, score, desc, band) {
  return [
    '<article class="mm-metric">',
    '<div class="mm-score">' + escapeHtml_(String(score)) + '</div>',
    '<div class="mm-mlabel">' + escapeHtml_(label) + '</div>',
    '<div class="mm-mdesc">' + escapeHtml_(desc) + '</div>',
    '<div class="mm-mband">' + escapeHtml_(humanizeToken_(band)) + '</div>',
    '</article>'
  ].join("");
}

function escapeHtml_(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function humanizeToken_(s) {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, function(m){ return m.toUpperCase(); });
}
