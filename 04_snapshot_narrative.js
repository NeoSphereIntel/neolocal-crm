/**
 * Snapshot Narrative Engine v6 — Texture + Auto Amplification
 * Same structure, stronger dealership-native language:
 * - diagnosis-specific mirror
 * - diagnosis-specific market
 * - diagnosis-specific consequence
 * - diagnosis-specific direction
 * - auto-retail amplification where relevant
 */

function buildSnapshotNarrativePackage_(m, scores, diagnosis) {
  const diagnosisState = String(diagnosis.diagnosis_state || "").trim();
  const marketTier = String(diagnosis.market_tier || "").trim() || "Emerging Operators";
  const pressure = String(diagnosis.market_pressure_band || "").trim() || "Medium";

  const mirror = buildMirrorSummary_(m, diagnosisState, marketTier);
  const market = buildMarketSummary_(m, diagnosisState, pressure);
  const consequence = buildConsequenceSummary_(m, diagnosisState, pressure);
  const direction = buildDirectionSummary_(m, diagnosisState);

  return {
    market_position_summary: mirror,
    strategic_gap_summary: market,
    action_implication_summary: consequence,
    snapshot_narrative: [
      diagnosisState + ".",
      mirror,
      market,
      consequence,
      direction
    ].join("\n\n")
  };
}

/**
 * =========================
 * HELPERS
 * =========================
 */
function getReviewScaleLabel_(count) {
  const n = Math.round(count || 0);

  if (n >= 2000) return "the low thousands";
  if (n >= 1000) return "the high hundreds to low thousands";
  if (n >= 500) return "the high hundreds";
  if (n >= 200) return "the mid hundreds";
  if (n >= 75) return "the low hundreds";
  if (n > 0) return "double-digit to low-hundreds";
  return "visible trust-bearing";
}

function isAutoRetailCategory_(m) {
  const s = String(m.category || "").toLowerCase();
  return s.indexOf("car") !== -1 ||
         s.indexOf("dealer") !== -1 ||
         s.indexOf("auto") !== -1 ||
         s.indexOf("used") !== -1;
}

function getRetailUnitLabel_(m) {
  return isAutoRetailCategory_(m) ? "store" : "business";
}

/**
 * =========================
 * MIRROR (TEXTURED + AUTO)
 * =========================
 */
function buildMirrorSummary_(m, diagnosisState, marketTier) {
  const category = safeText_(m.category || "market");
  const isAuto = isAutoRetailCategory_(m);

  if (diagnosisState === "Invisible Operator") {
    if (isAuto) {
      return `Right now, this ${category} is not getting taken seriously early enough. Buyers are deciding which stores feel legitimate before this one has given them enough reason to trust it, which means it is being passed over before inventory even has a chance to matter.`;
    }
    return `Right now, this business is not getting seriously considered early enough in the ${category} market. Buyers are making decisions before they have enough reason to trust it. In practice, that means it is being filtered out before the real offer is even evaluated.`;
  }

  if (diagnosisState === "Constrained Operator") {
    if (isAuto) {
      return `This is not a weak store. But it is still losing the early confidence battle to stronger dealerships, and that is forcing it to sell from behind. This is where a good operation still loses ground to stores that simply look more established first.`;
    }
    return `You are not a weak operator in this ${category} market. But you should be winning more of these opportunities, and stronger stores are taking the early position instead. This is where a good operation still ends up losing ground.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    if (isAuto) {
      return `There is more substance here than the market is currently giving this store credit for. The operation looks lighter than it really is, which means buyers are seeing it as one option in the mix instead of a dealership that deserves stronger consideration early.`;
    }
    return `The business is solid, but it is not showing up with enough weight. In practice, it is better than how it is currently being perceived by the market. You’re doing enough business to be taken seriously, but not enough to shape how buyers decide.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    if (isAuto) {
      return `This store is already in the serious consideration set. The problem is that it is not the dealership buyers default to first. It gets included early, but not strongly enough to shut down comparison.`;
    }
    return `You are already competing at a high level in this ${category} market, but you are not the default choice. Buyers include you early, but they are not committing without comparison. You’re in the shortlist, but not the easy choice.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    if (isAuto) {
      return `The inventory may be good enough to compete, but buyers are not reaching it with enough confidence. The units are there, but the trust needed to get shoppers deeper into the lot is not strong enough early.`;
    }
    return `The business likely has competitive inventory, but buyers are not reaching it with enough confidence. The vehicles are there, but the trust needed to engage with them is not strong enough early.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    if (isAuto) {
      return `The store appears capable of handling more demand than it is currently converting. The issue is not a total lack of market interest. The issue is that stronger-positioned dealerships are absorbing more of that intent before this store gets a fair shot at it.`;
    }
    return `The business is capable of handling more demand than it is currently capturing. The work exists, but it is not being absorbed at the level it should be.`;
  }

  return `The ${getRetailUnitLabel_(m)} is not positioned strongly enough early in the decision process.`;
}

/**
 * =========================
 * MARKET (TEXTURED + AUTO)
 * =========================
 */
function buildMarketSummary_(m, diagnosisState, pressure) {
  const location = buildMarketLabel_(m);
  const compAvg = Math.round(m.comp_avg_reviews || 0);
  const compMax = Math.round(m.comp_max_reviews || 0);
  const isAuto = isAutoRetailCategory_(m);

  const avgScale = getReviewScaleLabel_(compAvg);
  const leaderScale = getReviewScaleLabel_(compMax);

  if (diagnosisState === "Constrained Operator") {
    if (isAuto) {
      return `In ${location}, stronger dealerships are shaping buyer confidence before a shopper ever visits the lot. This is a heavy-proof market where the visible leaders are operating in ${leaderScale}, so by the time this store enters the shopper's real consideration set, stronger stores have often already set the tone.`;
    }
    return `In ${location}, stronger operators are already shaping buyer confidence early. This is a heavy-proof market where leading businesses are operating in ${leaderScale}. By the time your business enters the conversation, the tone is often already set.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    if (isAuto) {
      return `In ${location}, buyers already have plenty of trust signals guiding where they look first. The issue is not that the market lacks proof. It is that this store is not carrying enough visible weight inside that layer to look like a stronger early option.`;
    }
    return `In ${location}, the market already has enough visible trust signals to guide decisions. The issue is not that trust is missing — it is that your business is not contributing enough to that layer to stand out early.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    if (isAuto) {
      return `In ${location}, several dealerships already clear the credibility bar. At that point, buyers are not just looking for a legitimate store. They are leaning toward the one that feels most established, most proven, and easiest to trust without further work.`;
    }
    return `In ${location}, several operators already meet the trust threshold. Buyers are not just looking for a credible option — they are leaning toward the one that feels like the most established choice.`;
  }

  if (diagnosisState === "Invisible Operator") {
    if (isAuto) {
      return `In ${location}, buyers cut the field quickly based on surface proof. Stores without enough public trust signals are pushed out early, before inventory, pricing, or financing ever get a fair comparison.`;
    }
    return `In ${location}, buyers shortlist quickly based on visible proof. Businesses without enough public trust signals are filtered out early, before full comparison even begins.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    if (isAuto) {
      return `In ${location}, buyers decide which dealerships feel worth exploring before they really dig into inventory. That means the lot only gets full credit for its units if the store has already earned enough confidence to keep the shopper engaged.`;
    }
    return `In ${location}, buyers decide who to trust before they explore inventory. That means inventory only matters if the business has already earned enough confidence to be explored.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    if (isAuto) {
      return `In ${location}, demand exists, but it does not get shared evenly across the market. Dealerships that establish stronger trust earlier tend to absorb more of the serious buyer intent before other stores even get into the real decision.`;
    }
    return `In ${location}, demand exists, but it is not evenly captured. Businesses that establish stronger trust earlier tend to absorb more of that demand.`;
  }

  return `In ${location}, visible trust plays a central role in who gets considered first.`;
}

/**
 * =========================
 * CONSEQUENCE (TEXTURED + AUTO)
 * =========================
 */
function buildConsequenceSummary_(m, diagnosisState, pressure) {
  const isAuto = isAutoRetailCategory_(m);

  if (diagnosisState === "Invisible Operator") {
    if (isAuto) {
      return `The store is losing opportunities before real shopping even begins. Stronger dealerships are getting the first click, the first call, and the first visit, which means better inventory opportunities never fully reach this lot.`;
    }
    return `Opportunities are being lost before conversations even start. Stronger competitors are getting the first contact, which means better opportunities never reach this business at all.`;
  }

  if (diagnosisState === "Constrained Operator") {
    if (isAuto) {
      return `This store is losing deals it should be winning. Instead of letting inventory and sales process work from a neutral position, the deal starts with the shopper already leaning toward another dealership. That creates more comparison, more price pressure, and weaker gross.`;
    }
    return `You are losing deals you should be winning. Instead of starting from a neutral position, your deals are forced into comparison, which increases price pressure and weakens your position in the sale.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    if (isAuto) {
      return `The store is doing enough business to be credible, but not getting the return it should from that activity. Too many shoppers keep comparing instead of moving forward cleanly, which means the operation is being under-read by the market.`;
    }
    return `You’re doing the work, but not getting the return you should from it. Activity is there, but too many opportunities turn into comparisons instead of clean wins.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    if (isAuto) {
      return `Deals are being won, but not as cleanly as they should be. Buyers are still shopping the market hard, which keeps pressure on gross and makes strong units work harder than they need to.`;
    }
    return `You are winning deals, but not efficiently. Buyers are still comparing heavily, which compresses margins and makes strong opportunities harder to close cleanly.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    if (isAuto) {
      return `Inventory is not punching at its full weight. Units are not getting the level of attention they should because the trust layer is too thin too early, so strong stock is arriving late in the decision instead of shaping it.`;
    }
    return `Inventory is not performing to its potential. Vehicles are not getting the level of attention they should because buyers are not engaging deeply enough early on.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    if (isAuto) {
      return `The store is not capturing the full buyer demand available to it. Stronger-positioned dealerships are absorbing more of the serious opportunities simply because they are trusted earlier and explored harder.`;
    }
    return `The business is not capturing the full demand available to it. Stronger-positioned competitors are absorbing more opportunities simply because they are trusted earlier.`;
  }

  return `The ${getRetailUnitLabel_(m)} is not converting its position into strong commercial outcomes.`;
}

/**
 * =========================
 * DIRECTION (TEXTURED + AUTO)
 * =========================
 */
function buildDirectionSummary_(diagnosisState) {
  if (diagnosisState === "Invisible Operator") {
    return `The priority is to become visible enough to be considered early.`;
  }

  if (diagnosisState === "Constrained Operator") {
    return `The priority is to take back the early position so stronger competitors stop setting the tone before you.`;
  }

  if (diagnosisState === "Structured but Under-Amplified") {
    return `The priority is to make the market see what is already there, so the business is recognized earlier.`;
  }

  if (diagnosisState === "Competitive but Not Dominant") {
    return `The priority is to become the obvious choice so buyers stop comparing as heavily.`;
  }

  if (diagnosisState === "Under-Leveraged Inventory") {
    return `The priority is to bring inventory into the trust layer earlier so it can influence decisions sooner.`;
  }

  if (diagnosisState === "Demand Not Captured") {
    return `The priority is to align trust with capacity so the business captures more of the available demand.`;
  }

  return `The priority is to strengthen early positioning in the market.`;
}