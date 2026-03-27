/**
 * File: 16_market_mirror_engine.js
 * NeoLocal Market Mirror — orchestration layer
 */
var MM = typeof MM !== "undefined" ? MM : {};

function buildMarketMirrorPayload_(input) {
  var normalized = normalizeMarketMirrorInput_(input);
  var profile = getMarketMirrorVerticalProfile_(normalized.vertical_key);
  var derived = calculateMarketMirrorDerived_(normalized);

  var payload = {
    vertical_key: normalized.vertical_key,
    profile: profile,
    observed: normalized.observed,
    rep: normalized.rep,
    derived: derived
  };

  payload.narrative = generateMarketMirrorNarrative_(payload);
  payload.rep_sheet = buildRepSupportSheetData_(payload);

  return payload;
}

function buildRepSupportSheetData_(payload) {
  var p = payload.profile;
  var d = payload.derived;

  return {
    intro: [
      "Do not read slides at the prospect.",
      "Use the mirror to trigger agreement, not to overwhelm.",
      "Stay operator-to-operator. Calm. Direct. No hype."
    ],
    prompt_groups: p.rep_prompt_groups || [],
    validation_prompts: [
      "Does this feel accurate to you?",
      "Is that too harsh, or pretty close to reality?",
      "Do you think the market is seeing the business the same way you do internally?"
    ],
    metric_bridge_lines: [
      "These numbers are not random — they reflect how the business appears in the market.",
      "The purpose is not to impress you with a score. It is to show where visible position is helping or hurting.",
      "The scoring is proprietary, but the inputs are grounded in real public and operational signals."
    ],
    close_transition: closeTransitionByVertical_(payload.vertical_key, d)
  };
}

function closeTransitionByVertical_(vertical, d) {
  if (vertical === "auto_retail") {
    return "This is exactly where NeoLocal fits: helping visible dealership position catch up to real-world operation.";
  }
  if (vertical === "hvac") {
    return "This is exactly where NeoLocal fits: helping real service activity compound into stronger local trust.";
  }
  if (vertical === "roofing") {
    return "This is exactly where NeoLocal fits: helping completed project proof become stronger public confidence.";
  }
  return "This is exactly where NeoLocal fits.";
}