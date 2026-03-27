/**
 * File: 17_market_mirror_renderers.js
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

  var html = [];
  html.push('<!DOCTYPE html>');
  html.push('<html lang="en"><head><meta charset="UTF-8">');
  html.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  html.push('<title>NeoLocal Market Mirror</title>');
  html.push('<style>');
  html.push(getMarketMirrorCss_());
  html.push('</style></head><body>');
  html.push('<div class="mm-shell">');

  html.push('<header class="mm-header">');
  html.push('<div class="mm-logo-pill">NeoLocal™</div>');
  html.push('<div class="mm-eyebrow">NeoLocal Market Mirror</div>');
  html.push('<h1 class="mm-title">' + escapeHtml_(n.headline) + '</h1>');
  html.push('<p class="mm-subhead">' + escapeHtml_(n.subhead) + '</p>');
  html.push('<div class="mm-chip-row">');
  html.push(renderChip_("Business", businessName));
  html.push(renderChip_("Vertical", escapeHtml_(p.label)));
  html.push(renderChip_("Position", escapeHtml_(humanizeToken_(d.position_band))));
  html.push(renderChip_("Comparison Scope", escapeHtml_(d.comparison_scope)));
  html.push(renderChip_("Pressure", escapeHtml_(humanizeToken_(d.pressure_band))));
  html.push(renderChip_("Acceleration", escapeHtml_(humanizeToken_(d.acceleration_band))));
  html.push('</div></header>');

  html.push('<section class="mm-grid mm-grid-top">');
  html.push(renderBulletCard_("The Market", n.sections.market, "accent"));
  html.push(renderBulletCard_("The Mirror", n.sections.mirror, ""));
  html.push(renderBulletCard_("What This Costs", n.sections.cost, "red"));
  html.push(renderBulletCard_("What Is Changing", n.sections.shift, ""));
  html.push(renderBulletCard_("The NeoLocal Path", n.sections.path, "green"));
  html.push(renderBulletCard_("Traditional Approach", n.sections.traditional, ""));
  html.push('</section>');

  html.push('<section class="mm-grid mm-grid-metrics">');
  html.push(renderMetricCard_(labels.trust_gap, d.trust_gap, d.metric_explanations.trust_gap, d.trust_band));
  html.push(renderMetricCard_(labels.presence_completeness, d.presence_completeness, d.metric_explanations.presence_completeness, d.completeness_band));
  html.push(renderMetricCard_(labels.proof_of_work_signal, d.proof_of_work_signal, d.metric_explanations.proof_of_work_signal, d.proof_band));
  html.push(renderMetricCard_(labels.market_weight, d.market_weight, d.metric_explanations.market_weight, d.market_weight_band));
  html.push(renderMetricCard_(labels.buyer_confidence, d.buyer_confidence, d.metric_explanations.buyer_confidence, d.buyer_confidence_band));
  html.push(renderMetricCard_(labels.visibility_pressure, d.visibility_pressure, d.metric_explanations.visibility_pressure, d.pressure_band));
  html.push(renderMetricCard_(labels.acceleration_potential, d.acceleration_potential, d.metric_explanations.acceleration_potential, d.acceleration_band));
  html.push('</section>');

  html.push('<section class="mm-meaning">');
  html.push('<h3>What This Means</h3>');
  html.push('<ul>');
  html.push('<li>These scores are proprietary, but built from real public and operational signals.</li>');
  html.push('<li>The scoring exists to clarify position — not to impress with random numbers.</li>');
  html.push('<li>Reviews matter, but never stand alone.</li>');
  html.push('<li>Scale-aware comparisons are built into the engine.</li>');
  html.push('</ul>');
  html.push('</section>');

  html.push('<footer class="mm-footer">');
  html.push('Strong operators do not need more hype. They need visible position that reflects the work they already do.');
  html.push('</footer>');

  html.push('</div></body></html>');
  return html.join("");
}

function renderRepSupportSheetHtml_(payload) {
  var rep = payload.rep_sheet;
  var businessName = escapeHtml_(payload.observed.business_name || "This business");
  var html = [];

  html.push('<!DOCTYPE html>');
  html.push('<html lang="en"><head><meta charset="UTF-8">');
  html.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  html.push('<title>NeoLocal Rep Support Sheet</title>');
  html.push('<style>');
  html.push(getMarketMirrorCss_());
  html.push('</style></head><body>');
  html.push('<div class="mm-shell rep-shell">');

  html.push('<header class="mm-header">');
  html.push('<div class="mm-logo-pill">NeoLocal™</div>');
  html.push('<div class="mm-eyebrow">NeoLocal Rep Support Sheet</div>');
  html.push('<h1 class="mm-title">Guide the conversation.</h1>');
  html.push('<p class="mm-subhead">Do not read the slide.</p>');
  html.push('<p class="mm-subhead">Account: ' + businessName + '. Use the mirror to trigger agreement, surface friction, and lead naturally toward the deal.</p>');
  html.push('</header>');

  html.push(renderTextListCard_("Rep posture", rep.intro || []));
  html.push(renderTextListCard_("Validation prompts", rep.validation_prompts || []));
  html.push(renderTextListCard_("Metric bridge lines", rep.metric_bridge_lines || []));

  var groups = rep.prompt_groups || [];
  for (var i = 0; i < groups.length; i++) {
    html.push(renderTextListCard_(groups[i].title, groups[i].items || []));
  }

  html.push('<section class="mm-meaning">');
  html.push('<h3>Close transition</h3>');
  html.push('<p>' + escapeHtml_(rep.close_transition || "") + '</p>');
  html.push('</section>');

  html.push('</div></body></html>');
  return html.join("");
}

function renderBulletCard_(title, items, accentClass) {
  var cls = 'mm-card';
  if (accentClass) cls += ' mm-' + accentClass;

  var html = [];
  html.push('<article class="' + cls + '">');
  html.push('<h3>' + escapeHtml_(title) + '</h3>');
  html.push('<ul>');
  for (var i = 0; i < (items || []).length; i++) {
    html.push('<li>' + escapeHtml_(items[i]) + '</li>');
  }
  html.push('</ul></article>');
  return html.join("");
}

function renderMetricCard_(label, value, explanation, band) {
  var html = [];
  html.push('<article class="mm-card mm-metric">');
  html.push('<div class="mm-metric-value">' + escapeHtml_(String(value)) + '</div>');
  html.push('<div class="mm-metric-label">' + escapeHtml_(label) + '</div>');
  html.push('<div class="mm-band">' + escapeHtml_(humanizeToken_(band)) + '</div>');
  html.push('<p>' + escapeHtml_(explanation || "") + '</p>');
  html.push('</article>');
  return html.join("");
}

function renderTextListCard_(title, items) {
  var html = [];
  html.push('<section class="mm-card">');
  html.push('<h3>' + escapeHtml_(title) + '</h3>');
  html.push('<ul>');
  for (var i = 0; i < (items || []).length; i++) {
    html.push('<li>' + escapeHtml_(items[i]) + '</li>');
  }
  html.push('</ul></section>');
  return html.join("");
}

function renderChip_(label, value) {
  return '<span class="mm-chip"><strong>' + escapeHtml_(label) + ':</strong> ' + escapeHtml_(value) + '</span>';
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function humanizeToken_(token) {
  return String(token || "").replace(/_/g, " ").replace(/\b\w/g, function(m) { return m.toUpperCase(); });
}

function getMarketMirrorCss_() {
  return [
    "body{margin:0;background:#080e22;color:#f4f3ef;font-family:Arial,sans-serif;}",
    ".mm-shell{max-width:1200px;margin:0 auto;padding:40px 24px 60px;}",
    ".mm-header{text-align:center;margin-bottom:32px;}",
    ".mm-logo-pill{display:inline-block;background:#fff;color:#00195c;border-radius:8px;padding:10px 18px;margin-bottom:14px;font-weight:700;box-shadow:0 2px 16px rgba(0,0,0,.25);}",
    ".mm-eyebrow{color:#ed8220;text-transform:uppercase;letter-spacing:2px;font-size:12px;font-weight:700;margin-bottom:8px;}",
    ".mm-title{font-size:40px;line-height:1.05;margin:0 0 12px;}",
    ".mm-subhead{color:#c7ccda;max-width:900px;margin:8px auto;line-height:1.6;}",
    ".mm-chip-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px;}",
    ".mm-chip{background:#0f1738;border:1px solid #23305d;border-radius:999px;padding:8px 12px;font-size:12px;color:#f4f3ef;}",
    ".mm-grid{display:grid;gap:18px;}",
    ".mm-grid-top{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-bottom:24px;}",
    ".mm-grid-metrics{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-bottom:24px;}",
    ".mm-card{background:#0f1738;border:1px solid #23305d;border-radius:14px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.18);}",
    ".mm-card h3{margin:0 0 14px;color:#f4f3ef;font-size:18px;}",
    ".mm-card ul{margin:0;padding-left:18px;line-height:1.7;color:#d7dbea;}",
    ".mm-card p{margin:10px 0 0;line-height:1.6;color:#d7dbea;}",
    ".mm-accent{border-top:4px solid #ed8220;}",
    ".mm-red{border-top:4px solid #bd0e20;}",
    ".mm-green{border-top:4px solid #1a6640;}",
    ".mm-metric-value{font-size:34px;font-weight:700;color:#fff;margin-bottom:6px;}",
    ".mm-metric-label{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ed8220;margin-bottom:8px;}",
    ".mm-band{display:inline-block;background:#00195c;color:#fff;border-radius:999px;padding:6px 10px;font-size:11px;margin-bottom:12px;}",
    ".mm-meaning{background:#0f1738;border:1px solid #23305d;border-radius:14px;padding:22px;margin-bottom:24px;}",
    ".mm-meaning h3{margin-top:0;}",
    ".mm-meaning ul{margin:0;padding-left:18px;line-height:1.7;color:#d7dbea;}",
    ".mm-footer{text-align:center;color:#c7ccda;padding:10px 20px 0;line-height:1.7;}",
    ".rep-shell .mm-card{margin-bottom:18px;}"
  ].join("");
}