# NeoLocal Market Mirror Engine Prototype

Apps Script compatible modular prototype for the NeoLocal CRM repo.

## Additive file plan
These files are designed to be added **without changing the stable CRM execution layer**.

Recommended file names in the repo:
- `12_market_mirror_schema.js`
- `13_market_mirror_scores.js`
- `14_market_mirror_profiles.js`
- `15_market_mirror_narratives.js`
- `16_market_mirror_engine.js`
- `17_market_mirror_renderers.js`
- `18_market_mirror_test_harness.js`

## Existing repo alignment
The public repo currently includes:
- `07_vertical_profiles.js` for vertical detection / profile basics
- `08_outreach_engine.js` for market-led outreach generation
- `03_intelligence_engine.js` and `04_snapshot_narrative.js` for scoring / narrative layers
- `10_crm_workflow.js` for stable rep-facing workflow

This prototype is built to sit **beside** that structure and feed:
- outreach
- rep support
- standalone mirror HTML
- future CRM panel integration

## Core design
- **Observed data**: public / snapshot-visible facts
- **Rep inputs**: operational facts the rep farms manually
- **Derived metrics**: proprietary NeoLocal scores
- **Narrative layer**: vertical-aware interpretation
- **Renderers**: Market Mirror HTML + Rep Sheet HTML

## Supported verticals in this prototype
- used car dealership (`auto_retail`)
- HVAC (`hvac`)
- roofing (`roofing`)

## Main entry points
- `buildMarketMirrorPayload_(input)`
- `renderMarketMirrorHtml_(payload)`
- `renderRepSupportSheetHtml_(payload)`
- public test runners in `18_market_mirror_test_harness.js` without trailing underscores

## Minimal test usage
```javascript
function runMarketMirrorHtmlAutoRetail() {
  return testMarketMirrorHtml_("auto_retail");
}
```

## Plug-in points for your current system
### Into `08_outreach_engine.js`
Use payload signals to choose outreach angle:
- pressure band
- acceleration band
- trust band
- narrative summary

### Into lead rows / sheet views
Store selected derived outputs:
- `mm_trust_gap`
- `mm_presence_score`
- `mm_proof_score`
- `mm_market_weight`
- `mm_buyer_confidence`
- `mm_visibility_pressure`
- `mm_acceleration_potential`
- `mm_position_band`
- `mm_comparison_scope`

### Into future sidebar / presentation layer
Use:
- `renderMarketMirrorHtml_(payload)`
- `renderRepSupportSheetHtml_(payload)`

## Guardrails
- Reviews are never the whole story.
- Scale-aware comparisons are mandatory.
- Vertical language changes; scoring backbone stays universal.
- No fake guarantees, ranking promises, or fabricated proof.
