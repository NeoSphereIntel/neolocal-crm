# SCORING-SPEC.md — NeoLocal™ Market Intelligence Scoring Model v2
> This document is the authoritative specification for the NeoLocal scoring, diagnosis, narrative, and outreach engines.
> Claude Code MUST follow this spec when modifying files 03–09 (scoring, snapshot, diagnosis, outreach, reply).
> Do not deviate from the weights, thresholds, or logic described here without explicit user approval.

---

## 1. PHILOSOPHY

NeoLocal is a **market position intelligence platform**, not a review auditing tool.

The scoring model answers one question: **How much of their available local market is this business capturing vs leaving on the table?**

Every score, narrative, and outreach message must reflect this framing. The system never leads with review counts. It leads with market position, discovery presence, and competitive displacement.

**Critical:** Scores must be **operator-adjusted**. A small specialty contractor with 22 reviews dominating their peer band is an Anchor, not Outgunned. Raw market averages without operator context produce misleading intelligence and bad outreach.

---

## 2. DATA SOURCES

### Existing (already collected on import)
| Field | Source |
|---|---|
| business_name, category, city | SerpAPI local results |
| rating, reviews_count | SerpAPI local results |
| maps_position | SerpAPI local results (position in search) |
| website, phone, address, hours | SerpAPI local results |
| gps_coordinates | SerpAPI local results |
| place_id, data_id | SerpAPI local results |
| website_present, phone_present | Derived on import |
| Competitor data (comp_1–3) | Calculated from same search batch |

### New — Place Details API (1 call per lead, engine: google_maps, type: place)
| Field | Column Name | Source |
|---|---|---|
| Description / editorial summary | description | place_results.description |
| Service options | service_options | place_results.service_options (dine_in, takeout, delivery, etc.) |
| Extensions / highlights | extensions | place_results.extensions (stringified JSON) |
| Booking link present | has_booking_link | place_results.booking_link (boolean: present or not) |
| Categories (full list) | categories_full | place_results.types or place_results.type (array joined) |
| Similar places nearby | similar_places | place_results.similar_places_nearby (count + names) |
| People also search for | also_search_for | place_results.people_also_search_for (count + names) |
| Photo count (from images array) | photo_count | count of place_results.images |
| Thumbnail URL | thumbnail_url | place_results.thumbnail |

### New — Reviews API (1 call per lead, engine: google_maps_reviews)
| Field | Column Name | Source |
|---|---|---|
| Review topics + mention counts | review_topics | topics array (JSON: [{keyword, mentions}]) |
| Reviews with owner responses | owner_response_count | count of reviews where response object exists |
| Total reviews sampled | reviews_sampled | count of reviews returned (first page = ~8–10) |
| Owner response rate | owner_response_rate | owner_response_count / reviews_sampled |
| Most recent review date | latest_review_date | most recent iso_date from reviews array |
| Most recent owner response date | latest_response_date | most recent response.iso_date |
| Average rating of recent reviews | recent_avg_rating | average rating of sampled reviews |
| Rating trend direction | rating_trend | compare first half vs second half of sampled reviews |

### New — Photos API (1 call per lead, engine: google_maps_photos)
| Field | Column Name | Source |
|---|---|---|
| Total photo count | total_photos | count from photos array |
| Photo categories | photo_categories | categories array (titles: All, Latest, By owner, etc.) |
| Owner photo count | owner_photos | count of photos in "By owner" category (if available) |
| Latest photo date | latest_photo_date | most recent date from photo_meta (optional — costs extra call) |

### Rep-Entered (Operator Intel — already in schema)
| Field | Column Name | Impact |
|---|---|---|
| Scale band | operator_scale_band | Determines peer band for benchmarking |
| Business model | operator_business_model | Adjusts expected review/photo volumes |
| Monthly volume | operator_monthly_volume | Adjusts expected review velocity |
| Service capacity | operator_service_capacity | Context for competitive displacement |
| Location count | operator_location_count | Multi-location gets different benchmarks |
| Context notes | operator_context_notes | Free text for narrative personalization |

---

## 3. ENRICHMENT FLOW

### On Import (bulk search)
1. SerpAPI local results search → extract all existing fields + maps_position
2. For EACH lead in results:
   a. Place Details call → extract new profile fields
   b. Reviews API call → extract review intelligence fields
   c. Photos API call → extract photo intelligence fields
3. Calculate peer band (see Section 4)
4. Calculate all six dimension scores (see Section 5)
5. Calculate composite Market Capture score
6. Determine diagnosis state
7. Generate narrative package
8. Generate outreach message

### On Operator Intel Update (rep enters data)
1. Recalculate peer band with real operator data
2. Recalculate Trust Surface (operator-adjusted)
3. Recalculate Operator Fit modifier
4. Regenerate narrative and outreach (now personalized to operator context)

---

## 4. PEER BAND SYSTEM

### Purpose
Compare leads against businesses of similar size and type, not raw market averages.

### Peer Band Determination

**Before rep input (estimated):**
Use heuristics from API data to estimate operator scale:
- reviews_count < 30 → estimated Small
- reviews_count 30–150 → estimated Mid-Size
- reviews_count 150–500 → estimated Large
- reviews_count > 500 → estimated Multi-Location/Enterprise
- Adjust by category: auto_retail thresholds are 3x higher than trades

**After rep input (locked):**
Use operator_scale_band directly:
- Solo → compare against 0–20 review peers
- Small Team → compare against 10–60 review peers
- Mid-Size → compare against 40–200 review peers
- Large → compare against 150–600 review peers
- Multi-Location → compare against 400+ review peers

### Peer Metrics Calculated
From the same search batch, segment competitors into:
- **Direct peers:** similar category sub-type + within 3x review volume range
- **Market leaders:** top 3 by maps_position regardless of size
- **Category average:** raw average across all results

Store these as:
| Column | Value |
|---|---|
| peer_avg_reviews | Average reviews of direct peers |
| peer_avg_rating | Average rating of direct peers |
| peer_avg_photos | Average photo count of direct peers |
| peer_count | Number of direct peers identified |
| leader_avg_reviews | Average reviews of top 3 |
| leader_avg_photos | Average photos of top 3 |

---

## 5. SCORING DIMENSIONS

### 5.1 Discovery Position (0–100) — Weight: 30%

**Source:** maps_position from search results

| Position | Score |
|---|---|
| 1 | 100 |
| 2 | 95 |
| 3 | 88 |
| 4 | 78 |
| 5 | 70 |
| 6 | 62 |
| 7 | 55 |
| 8 | 45 |
| 9 | 38 |
| 10 | 30 |
| 11–15 | 20 |
| 16–20 | 10 |
| Not found | 0 |

**Column:** discovery_position_score

### 5.2 Profile Authority (0–100) — Weight: 20%

**Source:** Place Details API + existing fields

Additive scoring — each signal contributes points:

| Signal | Points | Condition |
|---|---|---|
| Photos (owner) | 0–20 | 0 photos = 0, 1–5 = 5, 6–15 = 10, 16–30 = 15, 30+ = 20 |
| Photos (total) | 0–15 | 0 = 0, 1–10 = 3, 11–30 = 7, 31–100 = 11, 100+ = 15 |
| Description present | 0–10 | Yes = 10, No = 0 |
| Hours filled | 0–10 | Yes = 10, No = 0 |
| Service options declared | 0–10 | Any present = 10, None = 0 |
| Multiple categories | 0–10 | 3+ types = 10, 2 = 6, 1 = 3 |
| Website present + working | 0–10 | Yes = 10, No = 0 |
| Booking link present | 0–5 | Yes = 5, No = 0 |
| Extensions/highlights | 0–5 | Any present = 5, None = 0 |
| Phone present | 0–5 | Yes = 5, No = 0 |

**Maximum possible:** 100
**Column:** profile_authority_score

### 5.3 Trust Surface (0–100) — Weight: 20%

**Source:** Reviews API + existing data + peer band adjustment

**CRITICAL: This dimension uses PEER BAND comparisons, not raw market averages.**

| Component | Points | Calculation |
|---|---|---|
| Review volume vs peer avg | 0–30 | ratio = reviews_count / peer_avg_reviews. ratio ≥ 2.0 = 30, ≥ 1.5 = 25, ≥ 1.0 = 20, ≥ 0.7 = 14, ≥ 0.4 = 8, < 0.4 = 3 |
| Rating strength | 0–25 | rating ≥ 4.7 = 25, ≥ 4.5 = 22, ≥ 4.2 = 18, ≥ 4.0 = 14, ≥ 3.5 = 8, < 3.5 = 3 |
| Review recency | 0–20 | Most recent review < 7 days = 20, < 30 days = 16, < 90 days = 10, < 180 days = 5, older = 0 |
| Topic diversity | 0–15 | topics with ≥ 3 mentions: 5+ topics = 15, 3–4 = 10, 1–2 = 5, 0 = 0 |
| Rating trend | 0–10 | Recent avg ≥ overall rating = 10, within 0.3 = 6, declining > 0.3 = 2 |

**Maximum possible:** 100
**Column:** trust_surface_score

### 5.4 Owner Engagement (0–100) — Weight: 15%

**Source:** Reviews API + Photos API

| Component | Points | Calculation |
|---|---|---|
| Response rate | 0–35 | owner_response_rate ≥ 0.8 = 35, ≥ 0.6 = 28, ≥ 0.4 = 20, ≥ 0.2 = 12, > 0 = 5, 0 = 0 |
| Response recency | 0–25 | latest_response_date < 14 days = 25, < 30 = 20, < 90 = 12, < 180 = 5, older/none = 0 |
| Owner photos | 0–20 | owner_photos ≥ 20 = 20, ≥ 10 = 15, ≥ 5 = 10, ≥ 1 = 5, 0 = 0 |
| Profile freshness | 0–20 | latest_photo_date < 30 days = 20, < 90 = 14, < 180 = 8, < 365 = 3, older/unknown = 0 |

**Maximum possible:** 100
**Column:** owner_engagement_score

### 5.5 Competitive Displacement (0–100) — Weight: 15%

**Source:** Local results + Place details

This score measures how exposed the business is to competitors capturing their discovery surface.

| Component | Points | Calculation |
|---|---|---|
| Competitors above them | 0–30 | 0 above (they're #1) = 30, 1 = 26, 2 = 22, 3–5 = 15, 6–10 = 8, 10+ = 2 |
| Profile gap vs leaders | 0–25 | Their profile_authority_score vs average of top 3. Gap < 10 = 25, < 20 = 18, < 30 = 12, < 50 = 6, ≥ 50 = 2 |
| Market density | 0–20 | Total competitors in search. < 5 = 20 (easy), 5–10 = 15, 11–20 = 10, 20+ = 5 (crowded) |
| Similar places threat | 0–15 | similar_places_nearby count. 0 = 15, 1–3 = 10, 4–7 = 6, 8+ = 2 |
| Also-search-for overlap | 0–10 | people_also_search_for count. 0 = 10, 1–3 = 7, 4+ = 3 |

**Maximum possible:** 100
**Column:** competitive_displacement_score

**NOTE:** Unlike other dimensions, a HIGH Competitive Displacement score means LESS displacement (better position). This keeps all dimensions directionally consistent — higher = better.

---

## 6. COMPOSITE SCORE: MARKET CAPTURE

### Calculation
```
market_capture_score = (
  discovery_position_score * 0.30 +
  profile_authority_score  * 0.20 +
  trust_surface_score      * 0.20 +
  owner_engagement_score   * 0.15 +
  competitive_displacement_score * 0.15
)
```

**Column:** market_capture_score (0–100, rounded to 1 decimal)

### Operator Fit Modifier

**Purpose:** Contextualizes the Market Capture score relative to what's achievable for this operator's size and type.

**Calculation:**
```
operator_fit = (
  (reviews_count / peer_avg_reviews) * 0.40 +
  (profile_authority_score / peer_avg_profile_authority) * 0.30 +
  (owner_engagement_score / 100) * 0.30
) * 100

// Cap at 100, floor at 0
operator_fit = Math.min(100, Math.max(0, operator_fit))
```

**When operator intel is missing:** Use estimated peer band. Flag in narrative that intelligence will sharpen with operator data.

**Column:** operator_fit_score (0–100, rounded to 1 decimal)

---

## 7. DIAGNOSIS STATES

Based on Market Capture score with Operator Fit context:

| State | Market Capture | Description |
|---|---|---|
| Invisible | 0–19 | Minimal discovery presence. Not appearing where customers search. |
| Outgunned | 20–39 | Present but significantly outranked. Competitors dominate their discovery surface. |
| Undersignaled | 40–59 | Doing real work but profile doesn't reflect it. Discovery potential unrealized. |
| Contender | 60–79 | Competitive position with specific gaps remaining. Within striking distance. |
| Anchor | 80–100 | Dominant discovery presence in their market segment. |

**Operator Fit modifies the narrative, not the diagnosis state.** An Undersignaled business with Operator Fit of 85 gets a different narrative than one with Operator Fit of 30, but both are diagnosed as Undersignaled.

**Column:** diagnosis_state

---

## 8. NARRATIVE GENERATION

### Structure
buildSnapshotNarrativePackage_ produces four components:

1. **market_position_summary** — The headline intelligence. What's happening in this market and where does this business sit? References Discovery Position and Competitive Displacement.

2. **strategic_gap_summary** — The dimensional gap analysis. Which specific dimensions are weakest? What's the cost of those gaps? References the 2–3 lowest-scoring dimensions.

3. **action_implication_summary** — The commercial risk. What happens if nothing changes? What's the opportunity cost? References peer band comparison and trajectory.

4. **snapshot_narrative** — Full concatenation of all three above.

### Voice Rules
- Never lead with review counts. Lead with market position.
- Never say "you have a review gap." Say "competitors are projecting stronger discovery signals."
- Frame around what the business is LOSING, not what they're LACKING.
- Use the operator context to make it specific: "For a [scale_band] [category] operation, your profile is [above/below] where it should be."
- Always reference specific competitors by name when available (comp_1_name, etc.)
- Never use SEO jargon: no "optimize," "keywords," "backlinks," "SEO strategy."
- Use NeoLocal language: "discovery surface," "market capture," "proof signals," "operational footprint."

### Narrative Templates by Diagnosis State

**Invisible:**
- Market position: "[City]'s [category] discovery surface is being captured by [X] operators who project verified activity and trust signals. [Business] does not currently appear in the primary search surface for this market."
- Gap focus: Weakest 2–3 dimensions with specific numbers
- Implication: "Customers searching for [category] in [city] are choosing from a set that doesn't include [business]. Every week this continues, competitors accumulate more proof signals."

**Outgunned:**
- Market position: "[Business] appears in [city]'s [category] results but is outranked by [X] competitors who project stronger operational proof across their profiles."
- Gap focus: Discovery Position vs Profile Authority gap — "Ranking at position [X] while competitors at positions 1–3 carry [Y]% stronger profile authority."
- Implication: "The longer this gap persists, the harder it becomes to displace the operators above you. Their proof signals compound."

**Undersignaled:**
- Market position: "[Business] is doing the work but the discovery profile doesn't reflect it. [If operator_fit > 70:] Your operational activity suggests you should be capturing more of this market than your current position shows."
- Gap focus: Specific dimensions where the score trails despite operator strength
- Implication: "This is the most correctable position — the work exists, the proof just isn't structured for discovery."

**Contender:**
- Market position: "[Business] holds a competitive position in [city]'s [category] market with specific opportunities remaining. [X] operators currently rank above you."
- Gap focus: The 1–2 dimensions holding them back from Anchor status
- Implication: "Closing these gaps moves you from competing for visibility to controlling it."

**Anchor:**
- Market position: "[Business] dominates the discovery surface for [category] in [city]. Your profile authority and trust signals outpace the competitive set."
- Gap focus: Maintenance and expansion opportunities
- Implication: "The goal now is compounding — every additional proof signal widens the gap competitors need to close."

### Operator Context Injection

When operator intel exists, inject after the market position paragraph:

"For a [scale_band] [business_model] operation [if monthly_volume: processing approximately [monthly_volume] jobs per month], [assessment of operator fit]."

**Operator Fit assessments:**
- Fit > 80: "your market capture significantly exceeds what operators at your scale typically achieve in this market."
- Fit 60–80: "your position is solid relative to similar operations, with room to strengthen."
- Fit 40–60: "you're capturing less of the available market than operators of similar size and activity level."
- Fit < 40: "there's a significant gap between your operational capacity and your discovery presence — the work isn't translating to visibility."

---

## 9. OUTREACH MESSAGE

### Structure
```
Hi,

[Market intelligence hook — 1 sentence referencing their market position]

[Dimensional insight — 1–2 sentences about their weakest dimension without using the word "review" unless Trust Surface is the primary gap]

[Operator context — 1 sentence if operator intel exists]

[Bridge to Market Mirror — 1 sentence offering to show the full picture]

— [Rep name]
```

### Hook Templates by Diagnosis State

**Invisible:** "We mapped [category] visibility in [city] and your business doesn't appear in the discovery surface where customers are searching."

**Outgunned:** "We mapped [category] visibility in [city] — [X] competitors are capturing the discovery surface ahead of your business, and the gap is widening."

**Undersignaled:** "We mapped [category] visibility in [city] and something stood out — your operational activity suggests you should be more visible than you currently are."

**Contender:** "We mapped [category] visibility in [city] — your business is competitive but [1–2 specific gaps] are keeping you from the top positions."

**Anchor:** "We mapped [category] visibility in [city] — your business dominates the discovery surface, and we have insights on how to compound that advantage."

### Dimensional Insight Templates

**Weakest = Profile Authority:** "Your listing is missing [specific elements: photos/description/service options/categories] that search engines use to determine which businesses to surface first. Competitors ranking above you carry [X]% more profile depth."

**Weakest = Trust Surface:** "The trust signals your profile projects are [below/significantly below] what similar [category] operators in [city] typically build. This affects how search engines and AI platforms evaluate your credibility."

**Weakest = Owner Engagement:** "Your competitors are actively managing their discovery presence — responding to feedback, updating their profiles, projecting operational activity. Your profile reads as unmanaged, which search engines interpret as lower relevance."

**Weakest = Competitive Displacement:** "The [category] market in [city] is [dense/competitive] — [X] operators are fighting for [Y] top discovery positions. Without a stronger signal footprint, displacement risk increases as competitors continue building proof."

**Weakest = Discovery Position:** "You're currently ranking at position [X] in [city]'s [category] results. Positions 1–3 capture the majority of customer attention — the gap between your position and the top is [Y] profile authority points."

### Bridge Line
"I can show you exactly where these gaps are and what it would take to close them — takes about 10 minutes."

### Anti-Patterns (NEVER do these)
- Never say "we noticed issues with your reviews"
- Never say "you need more reviews"
- Never say "your competitors have more reviews"
- Never use the word "audit"
- Never use "SEO," "optimize," "keywords," "backlinks"
- Never say "we can help improve your online presence"
- Never frame NeoLocal as a review management service
- Never imply market exclusivity or one-client-per-market

---

## 10. REPLY ENGINE

### Classification (keep existing 6 types)
curious, recognized, skeptical, challenge, offer_question, neutral

### Voice Shift
All reply templates must use the new intelligence framing:
- Reference market position, not reviews
- Use dimensional language ("discovery surface," "profile authority," "trust signals")
- Bridge to Market Mirror as proof
- Maintain operator-to-operator tone

---

## 11. IMPLEMENTATION SEQUENCE

### Step 1: Enrichment Pipeline
- Add Place Details, Reviews, and Photos API calls to the import engine
- Store all new fields in Leads Master (add columns)
- Ensure data_id is stored for Reviews and Photos API calls

### Step 2: Peer Band Calculator
- New function: calculatePeerBand_(leads, targetLead)
- Segments competitors by estimated or known scale
- Calculates peer averages

### Step 3: Dimension Scorers
- New function per dimension: scoreDiscoveryPosition_, scoreProfileAuthority_, scoreTrustSurface_, scoreOwnerEngagement_, scoreCompetitiveDisplacement_
- Each returns 0–100
- Trust Surface uses peer band

### Step 4: Composite Calculator
- New function: calculateMarketCapture_(dimensionScores)
- Applies weights, calculates Operator Fit
- Determines diagnosis state

### Step 5: Narrative Engine Rewrite
- Rewrite buildSnapshotNarrativePackage_ templates
- Use new dimensional inputs
- Apply operator context injection

### Step 6: Outreach Engine Rewrite
- Rewrite generateOutreachMessage_ templates
- Use new hook and dimensional insight templates

### Step 7: Reply Engine Update
- Update all reply templates to new voice
- Keep classification logic unchanged

### Step 8: Frontend Updates
- Display new dimension scores on lead detail page
- Add Market Capture score as the headline number
- Show Operator Fit when available
- Update dashboard cards with new diagnosis badges

**Do NOT skip steps. Complete each step before starting the next. Verify data flows correctly at each step.**

---

## 12. COLUMN ADDITIONS TO LEADS MASTER

### New columns to add (in order):
```
description
service_options
extensions
has_booking_link
categories_full
similar_places
also_search_for
photo_count
thumbnail_url
review_topics
owner_response_count
reviews_sampled
owner_response_rate
latest_review_date
latest_response_date
recent_avg_rating
rating_trend
total_photos
photo_categories
owner_photos
latest_photo_date
peer_avg_reviews
peer_avg_rating
peer_avg_photos
peer_count
leader_avg_reviews
leader_avg_photos
discovery_position_score
profile_authority_score
trust_surface_score
owner_engagement_score
competitive_displacement_score
market_capture_score
operator_fit_score
```

### Columns to keep but redefine:
```
diagnosis_state (new thresholds based on market_capture_score)
market_position_summary (new narrative voice)
strategic_gap_summary (new narrative voice)
action_implication_summary (new narrative voice)
snapshot_narrative (full concatenation)
outreach_message (new templates)
reply_message (new voice)
```

### Columns to deprecate (keep data, stop using in scoring):
```
review_gap (replaced by peer-adjusted Trust Surface)
gap_ratio (replaced by peer-adjusted Trust Surface)
market_review_pressure (replaced by Competitive Displacement)
base_presence_score (replaced by Profile Authority)
trust_score (replaced by Trust Surface)
competitive_pressure_score (replaced by Competitive Displacement)
opportunity_score (replaced by Market Capture)
difficulty_score (folded into Competitive Displacement)
priority_score (replaced by Market Capture)
momentum_score (folded into Trust Surface recency)
momentum_state (folded into Trust Surface recency)
is_undervalued (replaced by Operator Fit)
```

---

*This specification is the source of truth for all scoring and narrative logic.*
*Last updated: May 2026*
