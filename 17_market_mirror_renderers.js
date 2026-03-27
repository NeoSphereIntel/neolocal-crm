/**
 * File: 16_market_mirror_renderers.js
 * NeoLocal Market Mirror — branded HTML renderers
 * Styling direction intentionally preserved: premium, readable, not flattened.
 */
var MM = typeof MM !== "undefined" ? MM : {};

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
