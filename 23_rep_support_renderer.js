/**
 * File: 23_rep_support_renderer.js
 * Generates the Rep Support teleprompter HTML from lead data + rep-support-doc-config.js.
 * Light theme — opposite palette from the Market Mirror.
 */

function renderRepSupportDocHtml_(lead) {
  var cfg  = getRepSupportConfig_();
  var secs = cfg.sections;

  // Vertical terms
  var vertKey   = verticalToConfigKey_(detectVerticalFromCategory_(lead.category));
  var terms     = cfg._vertical_terms[vertKey] || cfg._vertical_terms['used_car_dealerships'];
  var vTerm     = terms.vertical_term;
  var vTermPlur = terms.vertical_term_plural;

  // Diagnosis — normalise to known keys
  var diagRaw  = String(lead.diagnosisState || '').toLowerCase();
  var diagKeys = ['anchor', 'contender', 'underdog', 'outgunned', 'ghost'];
  var diag     = diagKeys.indexOf(diagRaw) !== -1 ? diagRaw : 'ghost';
  var diagDisplay = diagRaw ? (diagRaw.charAt(0).toUpperCase() + diagRaw.slice(1)) : 'Unknown';

  // Scores
  var mcs   = Number(lead.marketCaptureScore)          || 0;
  var disc  = Number(lead.discoveryPositionScore)       || 0;
  var prof  = Number(lead.profileAuthorityScore)        || 0;
  var trust = Number(lead.trustSurfaceScore)            || 0;
  var eng   = Number(lead.ownerEngagementScore)         || 0;
  var disp  = Number(lead.competitiveDisplacementScore) || 0;

  function tier(score) { return score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low'; }

  var dims = [
    { label: 'Discovery',            score: disc },
    { label: 'Profile Authority',    score: prof },
    { label: 'Trust Surface',        score: trust },
    { label: 'Owner Engagement',     score: eng },
    { label: 'Competitive Position', score: disp }
  ];
  var weakest = dims.reduce(function(min, d) { return d.score < min.score ? d : min; }, dims[0]);

  // Token map — resolved before HTML insertion
  var tokens = {
    city:                    String(lead.city            || '—'),
    business_name:           String(lead.businessName    || '—'),
    vertical_term:           vTerm,
    vertical_term_plural:    vTermPlur,
    market_capture_score:    String(mcs),
    maps_position:           String(lead.mapsPosition    || '—'),
    review_count:            String(lead.reviews         || '—'),
    rating:                  String(lead.rating          || '—'),
    peer_avg_reviews:        String(lead.peerAvgReviews  || '—'),
    peer_avg_rating:         String(lead.peerAvgRating   || '—'),
    similar_places_count:    String(lead.similarPlacesCount || '—'),
    competitor_1_name:       String(lead.competitor1Name || 'your top competitor'),
    owner_response_rate:     String(lead.ownerResponseRate  || '—'),
    latest_response_date:    String(lead.latestResponseDate || '—'),
    photo_count:             String(lead.photoCount      || '—'),
    owner_photos:            String(lead.ownerPhotos     || '—'),
    service_options_summary: String(lead.serviceOptionsSummary || '—'),
    weakest_dimension_label: weakest.label,
    weakest_dimension_score: String(weakest.score),
    footer_statement:        String(lead.strategicGapSummary || lead.marketPositionSummary || '')
  };

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fill(text) {
    var r = String(text || '');
    var keys = Object.keys(tokens);
    for (var i = 0; i < keys.length; i++) {
      r = r.split('{{' + keys[i] + '}}').join(esc(tokens[keys[i]]));
    }
    return r;
  }

  // ── HTML block helpers ──────────────────────────────────────

  function hScript(text) {
    return '<div class="rsd-script-block"><p class="rsd-script-text">' + fill(text) + '</p></div>';
  }
  function hPause(text) {
    return '<div class="rsd-pause"><div class="rsd-pause-label">⏸ Pause Point</div><p class="rsd-pause-text">' + esc(text) + '</p></div>';
  }
  function hDelivery(text) {
    return '<div class="rsd-delivery"><div class="rsd-delivery-label">→ Delivery Note</div><p class="rsd-delivery-text">' + esc(text) + '</p></div>';
  }
  function hMindset(text) {
    return '<div class="rsd-mindset"><span class="rsd-mindset-label">Mindset: </span>' + esc(text) + '</div>';
  }
  function hReaction(text) {
    return '<div class="rsd-reaction"><span class="rsd-reaction-label">Anticipated: </span>' + esc(text) + '</div>';
  }
  function hLeadIn(text) {
    return '<p class="rsd-lead-in">' + fill(text) + '</p>';
  }
  function hTransition(text) {
    return '<div class="rsd-divider"></div><p class="rsd-transition">' + esc(text) + '</p>';
  }
  function hLabel(text) {
    return '<div class="rsd-label">' + esc(text) + '</div>';
  }
  function hSection(num, title, mirrorRef, instructions, bodyHtml) {
    var mirror = mirrorRef ? '<div class="rsd-mirror-ref">Mirror: ' + esc(mirrorRef) + '</div>' : '';
    var instrs = instructions ? '<div class="rsd-instructions">' + esc(instructions) + '</div>' : '';
    return [
      '<div class="rsd-section" id="s' + num + '">',
        '<div class="rsd-section-header">',
          '<div class="rsd-section-number">Section ' + num + '</div>',
          '<div class="rsd-section-title">' + esc(title) + '</div>',
          mirror,
        '</div>',
        '<div class="rsd-section-body">',
          instrs,
          bodyHtml,
        '</div>',
      '</div>'
    ].join('');
  }

  // ── Section 00: Pre-call prep ────────────────────────────────

  var s0 = secs['00_pre_call_prep'];
  var s0opener = s0.openers[diag];
  var s0body = [
    hLabel('Your Opening Line'),
    hScript(s0opener.opener),
    hMindset(s0opener.mindset),
    '<div class="rsd-pacing">Pacing: ' + esc(s0opener.pacing) + '</div>',
    hLabel('Universal Rules'),
    '<ul class="rsd-rules">' + s0.universal_rules.map(function(r){ return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
  ].join('');
  var sec00 = hSection('00', s0.title, null, s0.instructions, s0body);

  // ── Section 01: MCS Reveal ───────────────────────────────────

  var s1 = secs['01_hero_mcs_reveal'];
  var s1track = s1.talk_tracks[diag];
  var s1body = [
    '<div class="rsd-mcs-callout">',
      '<div class="rsd-mcs-num">' + mcs + '</div>',
      '<div><div class="rsd-mcs-label">Market Capture Score</div><div class="rsd-diag-badge rsd-diag-' + diag + '">' + esc(diagDisplay) + '</div></div>',
    '</div>',
    hLabel('Script'),
    hScript(s1track.script),
    hPause(s1track.pause_point),
    hReaction(s1track.anticipated_reaction),
    hTransition(s1.dimension_transition)
  ].join('');
  var sec01 = hSection('01', s1.title, s1.mirror_section, s1.instructions, s1body);

  // ── Section 02: Cannot Control ──────────────────────────────

  var s2 = secs['02_what_they_cannot_control'];
  var s2body = [
    hLeadIn(s2.lead_in),
    hLabel('Discovery (Maps Position)'),
    hScript(s2.discovery.script.replace('{{discovery_insight}}', esc(fill(s2.discovery.insights[tier(disc)])))),
    hPause(s2.discovery.pause_point),
    hLabel('Trust Surface (Reviews)'),
    hScript(s2.trust.script.replace('{{trust_insight}}', esc(fill(s2.trust.insights[tier(trust)])))),
    hPause(s2.trust.pause_point),
    hLabel('Competitive Displacement'),
    hScript(s2.competitive.script.replace('{{competitive_insight}}', esc(fill(s2.competitive.insights[tier(disp)])))),
    hPause(s2.competitive.pause_point),
    hTransition(s2.transition)
  ].join('');
  var sec02 = hSection('02', s2.title, s2.mirror_section, s2.instructions, s2body);

  // ── Section 03: Not Doing ────────────────────────────────────

  var s3 = secs['03_what_they_are_not_doing'];
  var s3body = [
    hLeadIn(s3.lead_in),
    hLabel('Owner Engagement'),
    hScript(s3.engagement.script.replace('{{engagement_insight}}', esc(fill(s3.engagement.insights[tier(eng)])))),
    hDelivery(s3.engagement.delivery_note),
    hPause(s3.engagement.pause_point),
    hLabel('Profile Authority'),
    hScript(s3.profile.script.replace('{{profile_insight}}', esc(fill(s3.profile.insights[tier(prof)])))),
    hDelivery(s3.profile.delivery_note),
    hPause(s3.profile.pause_point),
    hTransition(s3.transition)
  ].join('');
  var sec03 = hSection('03', s3.title, s3.mirror_section, s3.instructions, s3body);

  // ── Section 04: Should Be Doing ─────────────────────────────

  var s4 = secs['04_what_they_should_be_doing'];
  var s4body = [
    hLeadIn('Here\'s the question — and I\'m asking it seriously: ' + s4.lead_ins[diag]),
    hLabel('Weakest Dimension'),
    hScript(s4.dimension_walk.script),
    hDelivery(s4.dimension_walk.delivery_note),
    hLabel('The Two Paths'),
    hScript(s4.comparison_box.script),
    hDelivery(s4.comparison_box.delivery_note),
    hPause(s4.comparison_box.pause_point),
    hTransition(s4.transition)
  ].join('');
  var sec04 = hSection('04', s4.title, s4.mirror_section, s4.instructions, s4body);

  // ── Section 05: The Close ────────────────────────────────────

  var s5 = secs['05_the_close'];
  var s5objHtml = s5.objections.map(function(obj) {
    return [
      '<div class="rsd-objection">',
        '<div class="rsd-objection-trigger">"' + esc(obj.trigger) + '"</div>',
        '<div class="rsd-objection-bridge">' + esc(obj.bridge) + '</div>',
      '</div>'
    ].join('');
  }).join('');

  var s5body = [
    hLabel('Read From the Mirror'),
    hScript(s5.footer_read.script),
    hDelivery(s5.footer_read.delivery_note),
    hLabel('Founding Member Bridge'),
    '<div class="rsd-instructions">' + esc(s5.founding_member.note) + '</div>',
    hScript(s5.founding_member.script),
    hDelivery(s5.founding_member.delivery_note),
    hPause(s5.founding_member.pause_point),
    hLabel('Standard Close'),
    hScript(s5.standard_close.script),
    hDelivery(s5.standard_close.delivery_note),
    hLabel('If They Say Yes'),
    hScript(s5.if_yes.script),
    hDelivery(s5.if_yes.delivery_note),
    hLabel('If They Say Not Yet'),
    hScript(s5.if_not_yet.script),
    hDelivery(s5.if_not_yet.delivery_note),
    '<div class="rsd-divider"></div>',
    hLabel('Objection Bridges'),
    s5objHtml
  ].join('');
  var sec05 = hSection('05', s5.title, s5.mirror_section, s5.instructions, s5body);

  // ── Section 06: Post-call ────────────────────────────────────

  var s6 = secs['06_post_call'];
  var s6body = '<ol class="rsd-steps">' +
    s6.steps.map(function(step) { return '<li>' + esc(step) + '</li>'; }).join('') +
    '</ol>';
  var sec06 = hSection('06', s6.title, null, s6.instructions, s6body);

  // ── Nav items ────────────────────────────────────────────────

  var navSections = [
    { num:'00', label:'Prep' },
    { num:'01', label:'MCS' },
    { num:'02', label:'Cannot Control' },
    { num:'03', label:'Not Doing' },
    { num:'04', label:'Should Do' },
    { num:'05', label:'Close' },
    { num:'06', label:'Post-Call' }
  ];
  var navHtml = navSections.map(function(n) {
    return '<a href="#s' + n.num + '" class="rsd-nav-item">' + n.num + ' ' + esc(n.label) + '</a>';
  }).join('');

  // ── Assemble ─────────────────────────────────────────────────

  return [
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
'<title>Rep Support — ' + esc(lead.businessName || '') + '</title>',
'<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">',
'<style>',
'*{box-sizing:border-box;margin:0;padding:0;}',
'body{font-family:"Barlow",sans-serif;font-weight:300;background:#f4f3ef;color:#5a6378;line-height:1.7;font-size:15px;}',
'a{color:#00195c;text-decoration:none;}',

/* Header */
'.rsd-header{background:#00195c;padding:14px 24px;position:sticky;top:0;z-index:100;border-bottom:3px solid #ed8220;}',
'.rsd-header-inner{max-width:820px;margin:0 auto;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;gap:16px;flex-wrap:wrap;}',
'.rsd-wordmark{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);}',
'.rsd-header-biz{font-family:"Bebas Neue",sans-serif;font-size:22px;color:#fff;line-height:1;-webkit-flex:1;flex:1;}',
'.rsd-diag-badge{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:3px;}',
'.rsd-diag-anchor{background:#1a6640;color:#fff;}',
'.rsd-diag-contender{background:#003080;color:#fff;}',
'.rsd-diag-underdog{background:#ed8220;color:#fff;}',
'.rsd-diag-outgunned{background:#5a6378;color:#fff;}',
'.rsd-diag-ghost{background:#bd0e20;color:#fff;}',

/* Nav */
'.rsd-nav{background:#fff;border-bottom:1px solid #e4e2db;overflow-x:auto;white-space:nowrap;}',
'.rsd-nav-inner{max-width:820px;margin:0 auto;display:-webkit-flex;display:flex;gap:0;}',
'.rsd-nav-item{display:inline-block;padding:10px 16px;font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5a6378;border-right:1px solid #e4e2db;white-space:nowrap;}',
'.rsd-nav-item:hover{background:#f4f3ef;color:#00195c;}',

/* Container */
'.rsd-container{max-width:820px;margin:0 auto;padding:28px 20px 80px;}',

/* Section card */
'.rsd-section{background:#fff;border:1px solid #e4e2db;border-radius:8px;margin-bottom:20px;overflow:hidden;}',
'.rsd-section-header{padding:18px 24px 14px;border-bottom:1px solid #e4e2db;border-left:4px solid #ed8220;}',
'.rsd-section-number{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ed8220;margin-bottom:2px;}',
'.rsd-section-title{font-family:"Bebas Neue",sans-serif;font-size:26px;color:#00195c;line-height:1;}',
'.rsd-mirror-ref{font-size:12px;color:#5a6378;font-style:italic;margin-top:5px;}',
'.rsd-section-body{padding:20px 24px;}',

/* Instructions */
'.rsd-instructions{font-size:13px;font-style:italic;color:#5a6378;padding:10px 14px;border-left:3px solid #ed8220;background:#fdf9f5;margin-bottom:20px;border-radius:0 4px 4px 0;line-height:1.6;}',

/* Labels */
'.rsd-label{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#00195c;margin-bottom:8px;margin-top:20px;}',
'.rsd-label:first-child{margin-top:0;}',

/* Lead-in */
'.rsd-lead-in{font-size:16px;color:#5a6378;margin-bottom:20px;line-height:1.75;}',

/* Script block */
'.rsd-script-block{background:#f4f3ef;border-radius:6px;padding:18px 22px;margin-bottom:12px;}',
'.rsd-script-text{font-size:17px;font-weight:400;color:#080e22;line-height:1.85;}',

/* Mindset */
'.rsd-mindset{background:#f4f3ef;border-radius:4px;padding:10px 14px;margin-bottom:12px;font-size:13px;font-style:italic;color:#5a6378;line-height:1.6;}',
'.rsd-mindset-label{font-weight:700;font-style:normal;color:#00195c;}',

/* Pacing */
'.rsd-pacing{display:inline-block;font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a6378;padding:3px 8px;border:1px solid #e4e2db;border-radius:3px;margin-bottom:16px;}',

/* Pause point */
'.rsd-pause{background:#fff8f0;border-left:3px solid #ed8220;border-radius:0 5px 5px 0;padding:12px 16px;margin-bottom:12px;}',
'.rsd-pause-label{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#ed8220;margin-bottom:3px;}',
'.rsd-pause-text{font-size:13px;color:#5a6378;line-height:1.6;}',

/* Delivery note */
'.rsd-delivery{background:#f7f7f7;border-radius:4px;padding:10px 14px;margin-bottom:12px;}',
'.rsd-delivery-label{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a6378;margin-bottom:3px;}',
'.rsd-delivery-text{font-size:13px;font-style:italic;color:#5a6378;line-height:1.6;}',

/* Reaction */
'.rsd-reaction{background:#f7f7f7;border-radius:4px;padding:10px 14px;margin-bottom:12px;}',
'.rsd-reaction-label{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a6378;margin-bottom:3px;}',

/* Transition */
'.rsd-divider{height:1px;background:#e4e2db;margin:20px 0;}',
'.rsd-transition{font-size:15px;font-weight:600;color:#00195c;line-height:1.6;}',

/* Rules list */
'.rsd-rules{list-style:none;margin-bottom:4px;}',
'.rsd-rules li{padding:8px 0;border-bottom:1px solid #f0ede8;font-size:14px;}',
'.rsd-rules li::before{content:"→ ";color:#ed8220;font-weight:700;}',
'.rsd-rules li:last-child{border-bottom:none;}',

/* MCS callout */
'.rsd-mcs-callout{display:-webkit-inline-flex;display:inline-flex;-webkit-align-items:center;align-items:center;gap:14px;background:#00195c;border-radius:6px;padding:14px 20px;margin-bottom:20px;}',
'.rsd-mcs-num{font-family:"Bebas Neue",sans-serif;font-size:52px;color:#fff;line-height:1;}',
'.rsd-mcs-meta{display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;gap:6px;}',
'.rsd-mcs-label{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);}',

/* Objections */
'.rsd-objection{margin-bottom:16px;}',
'.rsd-objection-trigger{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#00195c;margin-bottom:6px;padding-left:2px;}',
'.rsd-objection-bridge{font-size:16px;color:#080e22;line-height:1.8;padding:14px 18px;background:#f4f3ef;border-radius:4px;}',

/* Steps */
'.rsd-steps{list-style:none;counter-reset:step;padding:0;}',
'.rsd-steps li{counter-increment:step;padding:12px 0 12px 48px;position:relative;border-bottom:1px solid #f0ede8;font-size:14px;line-height:1.65;}',
'.rsd-steps li::before{content:counter(step);position:absolute;left:0;top:10px;width:28px;height:28px;background:#00195c;color:#fff;border-radius:50%;font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:13px;line-height:28px;text-align:center;}',
'.rsd-steps li:last-child{border-bottom:none;}',
'</style>',
'</head>',
'<body>',

'<div class="rsd-header">',
  '<div class="rsd-header-inner">',
    '<span class="rsd-wordmark">NeoLocal Rep Support</span>',
    '<span class="rsd-header-biz">' + esc(lead.businessName || '') + '</span>',
    '<span class="rsd-diag-badge rsd-diag-' + diag + '">' + esc(diagDisplay) + '</span>',
  '</div>',
'</div>',

'<nav class="rsd-nav">',
  '<div class="rsd-nav-inner">' + navHtml + '</div>',
'</nav>',

'<div class="rsd-container">',
  sec00, sec01, sec02, sec03, sec04, sec05, sec06,
'</div>',

'</body>',
'</html>'
  ].join('\n');
}
