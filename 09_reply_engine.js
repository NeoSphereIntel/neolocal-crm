/**
 * File: 09_reply_engine.gs
 * Reply handling engine
 */

function generateReplyMessage_(lead, inboundText) {
  const verticalKey = determineVerticalType_(lead);
  const profile = getVerticalProfile_(verticalKey);
  const replyType = classifyInboundReply_(inboundText);

  if (profile.template_family === "auto_retail") {
    return buildAutoRetailReply_(lead, inboundText, replyType, profile);
  }

  return buildGenericReply_(lead, inboundText, replyType, profile);
}

/* ============================================================================
   REPLY CLASSIFICATION
============================================================================ */

function classifyInboundReply_(text) {
  const t = String(text || "").trim().toLowerCase();

  if (!t) return "neutral";

  if (
    t.indexOf("what do you mean") !== -1 ||
    t.indexOf("can you explain") !== -1 ||
    t.indexOf("explain") !== -1 ||
    t.indexOf("how so") !== -1 ||
    t.indexOf("what do you see") !== -1
  ) {
    return "curious";
  }

  if (
    t.indexOf("yes") !== -1 ||
    t.indexOf("yeah") !== -1 ||
    t.indexOf("we have") !== -1 ||
    t.indexOf("we noticed") !== -1 ||
    t.indexOf("that's true") !== -1 ||
    t.indexOf("possibly") !== -1 ||
    t.indexOf("maybe") !== -1
  ) {
    return "recognized";
  }

  if (
    t.indexOf("no") !== -1 ||
    t.indexOf("not really") !== -1 ||
    t.indexOf("don't think so") !== -1 ||
    t.indexOf("dont think so") !== -1 ||
    t.indexOf("haven't noticed") !== -1 ||
    t.indexOf("have not noticed") !== -1
  ) {
    return "skeptical";
  }

  if (
    t.indexOf("how do you know") !== -1 ||
    t.indexOf("where did you see that") !== -1 ||
    t.indexOf("who are you") !== -1 ||
    t.indexOf("what is this") !== -1
  ) {
    return "challenge";
  }

  if (
    t.indexOf("what do you do") !== -1 ||
    t.indexOf("what are you offering") !== -1 ||
    t.indexOf("how can you help") !== -1 ||
    t.indexOf("what exactly do you do") !== -1
  ) {
    return "offer_question";
  }

  return "neutral";
}

/* ============================================================================
   AUTO RETAIL REPLIES
============================================================================ */

function buildAutoRetailReply_(lead, inboundText, replyType, profile) {
  const businessName = safeText_(lead.business_name || "your dealership");
  const compName = safeText_(lead.comp_1_name || "one of the stronger visible dealerships nearby");
  const compReviews = parseInt(lead.comp_1_reviews, 10) || 0;
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  const compAvg = parseFloat(lead.comp_avg_reviews) || 0;
  const reviewGap = Math.round(parseFloat(lead.review_gap) || 0);
  const city = safeText_(lead.city || "your market");
  const diagnosis = String(lead.diagnosis_state || "");
  const label = getDiagnosisDisplayLabel_(diagnosis, "auto_retail");

  if (replyType === "curious") {
    return `What I mean is this:

When shoppers compare dealerships, they usually are not starting with inventory alone. They are first deciding which store feels safer and more proven to deal with.

From the outside, ${businessName} appears lighter on visible trust than stores like ${compName}${compReviews ? `, which is sitting closer to ${compReviews} reviews` : ""}. That can cause hesitation before your vehicles, pricing, or financing process get a fair look.

So the issue may not be the offer itself. It may be that the market is weighting you too lightly too early.

That’s the pattern I was pointing to.`;
  }

  if (replyType === "recognized") {
    return `That makes sense.

What usually happens in auto retail is that buyers don’t consciously say “I trust this store less” — they just lean toward the dealership that feels more established and lower-risk.

That’s why this matters commercially. If ${businessName} is being read as slightly less proven than stores like ${compName}, the drop happens before a real inventory comparison even finishes.

That kind of gap is often fixable, but only once it’s seen clearly.`;
  }

  if (replyType === "skeptical") {
    return `Fair enough.

It may not be obvious internally, especially if your team is still getting leads and traffic. The pattern tends to show up more subtly: shoppers inquire, compare, visit a few places, and then gravitate toward the dealership that feels safest to finalize with.

I’m not saying that is definitively happening in your case. I’m saying the visible market position suggests it could be influencing decision behavior more than it appears on the surface.`;
  }

  if (replyType === "challenge") {
    return `Just from public market signals.

I looked at how dealerships in ${city} appear relative to the visible trust environment around them — mainly how strongly they look validated compared with nearby competitors. ${businessName} appears to be sitting around ${reviews} reviews, while the stronger visible layer in the market is higher, with dealerships like ${compName}${compReviews ? ` closer to ${compReviews}` : ""}.

That doesn’t tell the whole story of the business, but it does say something about how a shopper is likely to read the market before choosing where to buy.`;
  }

  if (replyType === "offer_question") {
    return `What I do is help dealerships stop getting underweighted in how buyers choose.

Not by running a generic “review service,” but by tightening the visible trust layer that shapes whether a store feels safe early in the buying process.

In plain terms: if your dealership is strong operationally but not being read that way fast enough, I help close that perception gap so more shoppers carry your store further into serious comparison.`;
  }

  return `At a high level, I’m pointing to a market-perception issue more than a marketing vanity issue.

In auto retail, small trust differences can change who feels safe to buy from. When that happens, a dealership can be credible in reality but still lose weight in the buyer’s mind before the real comparison is complete.

That’s the gap I’m referring to.`;
}

/* ============================================================================
   GENERIC REPLIES
============================================================================ */

function buildGenericReply_(lead, inboundText, replyType, profile) {
  const businessName = safeText_(lead.business_name || "your business");
  const compName = safeText_(lead.comp_1_name || "a stronger visible competitor");
  const compReviews = parseInt(lead.comp_1_reviews, 10) || 0;
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  const city = safeText_(lead.city || "your market");

  if (replyType === "curious") {
    return `What I mean is this:

In your market, buyers often decide who feels safest before they fully compare details. From the outside, ${businessName} looks like it may be getting less of that early trust assignment than competitors like ${compName}${compReviews ? `, which appears more visibly validated at around ${compReviews} reviews` : ""}.

That can create a gap where the business is stronger operationally than the market is currently reading it.`;
  }

  if (replyType === "recognized") {
    return `That tracks.

What usually happens is the market starts assigning trust before the business gets a full comparison. So even solid operators can end up slightly underweighted if visible proof is thinner than the stronger competitors around them.

That kind of gap is often fixable once it’s identified clearly.`;
  }

  if (replyType === "skeptical") {
    return `Totally fair.

Sometimes it doesn’t show up in an obvious way internally. It shows up more as buyers leaning toward whichever option feels safest or most proven first.

I’m not saying that is guaranteed in your case — just that the visible market position suggests it may be influencing how buyers are filtering options.`;
  }

  if (replyType === "challenge") {
    return `Just from public market signals.

I looked at how businesses in ${city} appear relative to nearby competitors in terms of visible trust and validation. ${businessName} seems lighter than some of the stronger visible options, which can affect how buyers prioritize who feels safest to choose.`;
  }

  if (replyType === "offer_question") {
    return `I help businesses close the gap between how strong they actually are and how strongly the market reads them.

So the work is less about generic promotion and more about making sure the business is not getting underweighted before buyers seriously compare their options.`;
  }

  return `At a high level, I’m pointing to a market-perception gap.

The business may be stronger than it looks, but if competitors are being assigned trust faster, that can distort who buyers carry into serious comparison.`;
}

function rebuildAllReplyMessages() {
  ensureLeadsColumn_("inbound_reply");
  ensureLeadsColumn_("reply_type");
  ensureLeadsColumn_("reply_message");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!sheet) throw new Error("Leads Master sheet not found.");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idx = {
    business_name: headers.indexOf("business_name"),
    category: headers.indexOf("category"),
    city: headers.indexOf("city"),
    full_query: headers.indexOf("full_query"),
    reviews_count: headers.indexOf("reviews_count"),
    comp_1_name: headers.indexOf("comp_1_name"),
    comp_1_reviews: headers.indexOf("comp_1_reviews"),
    comp_avg_reviews: headers.indexOf("comp_avg_reviews"),
    review_gap: headers.indexOf("review_gap"),
    diagnosis_state: headers.indexOf("diagnosis_state"),
    priority_bucket: headers.indexOf("priority_bucket"),
    inbound_reply: headers.indexOf("inbound_reply"),
    reply_type: headers.indexOf("reply_type"),
    reply_message: headers.indexOf("reply_message")
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const inbound = idx.inbound_reply >= 0 ? row[idx.inbound_reply] : "";
    if (!String(inbound || "").trim()) continue;

    const lead = {
      business_name: idx.business_name >= 0 ? row[idx.business_name] : "",
      category: idx.category >= 0 ? row[idx.category] : "",
      city: idx.city >= 0 ? row[idx.city] : "",
      full_query: idx.full_query >= 0 ? row[idx.full_query] : "",
      reviews_count: idx.reviews_count >= 0 ? row[idx.reviews_count] : 0,
      comp_1_name: idx.comp_1_name >= 0 ? row[idx.comp_1_name] : "",
      comp_1_reviews: idx.comp_1_reviews >= 0 ? row[idx.comp_1_reviews] : 0,
      comp_avg_reviews: idx.comp_avg_reviews >= 0 ? row[idx.comp_avg_reviews] : 0,
      review_gap: idx.review_gap >= 0 ? row[idx.review_gap] : 0,
      diagnosis_state: idx.diagnosis_state >= 0 ? row[idx.diagnosis_state] : "",
      priority_bucket: idx.priority_bucket >= 0 ? row[idx.priority_bucket] : ""
    };

    const type = classifyInboundReply_(inbound);
    const reply = generateReplyMessage_(lead, inbound);

    if (idx.reply_type >= 0) {
      sheet.getRange(i + 1, idx.reply_type + 1).setValue(type);
    }
    if (idx.reply_message >= 0) {
      sheet.getRange(i + 1, idx.reply_message + 1).setValue(reply);
    }
  }

  SpreadsheetApp.getUi().alert("Reply messages generated.");
}