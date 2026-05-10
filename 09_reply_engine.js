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
  var businessName = safeText_(lead.business_name || "your dealership");
  var compName     = safeText_(lead.comp_1_name || "one of the stronger visible dealerships nearby");
  var city         = safeText_(lead.city || "your market");
  var pos          = parseInt(lead.maps_position, 10) || 0;
  var posStr       = pos > 0 ? "position " + pos : "a lower discovery position";

  if (replyType === "curious") {
    return [
      "What I mean is this:",
      "",
      "When shoppers search for a dealership in " + city + ", the first decision is which store feels established enough to deal with. That happens in the discovery layer — before they've compared inventory, pricing, or financing.",
      "",
      businessName + " is currently sitting at " + posStr + " in that discovery surface, while stores like " + compName + " are projecting a stronger verified footprint at the top. Shoppers form a trust read based on those signals before your operation gets a fair comparison on the things you actually control.",
      "",
      "That's the pattern I was pointing to."
    ].join("\n");
  }

  if (replyType === "recognized") {
    return [
      "That makes sense.",
      "",
      "In auto retail, buyers don't consciously say \"I trust this store less\" — they just lean toward the dealership that reads as most established. That assignment happens early, before inventory gets a real comparison.",
      "",
      businessName + "'s discovery position means that read isn't landing in your favor right now. That kind of gap is correctable once it's seen clearly."
    ].join("\n");
  }

  if (replyType === "skeptical") {
    return [
      "Fair enough.",
      "",
      "It usually isn't obvious from the inside — especially if the store is still generating leads and traffic. The signal shows up more subtly: shoppers inquire, compare a few stores, then finalize with the one that felt safest earliest in the process.",
      "",
      "The market map I'm working from is based on public discovery signals. I can show you what it actually looks like if you want to see the picture I'm referencing."
    ].join("\n");
  }

  if (replyType === "challenge") {
    return [
      "Just from public market signals — how dealerships appear in local discovery results and what their profiles project before any direct comparison.",
      "",
      businessName + " is at " + posStr + " in " + city + "'s results and the verified footprint your listing carries trails " + compName + " in a few specific ways. That's what shapes how a shopper reads credibility before they've spoken to anyone.",
      "",
      "I can pull up the full market map if you want to see exactly what I'm looking at."
    ].join("\n");
  }

  if (replyType === "offer_question") {
    return [
      "I help dealerships close the gap between their operational strength and what the discovery surface is projecting.",
      "",
      "Not a generic marketing service — specifically making sure the verified signals in your public profile match what you're actually running. When a store is strong operationally but reading lighter than it should, buyers are self-selecting toward competitors before a real comparison happens.",
      "",
      "That's the gap I close."
    ].join("\n");
  }

  return [
    "At a high level, I'm pointing to a market positioning issue, not a marketing vanity issue.",
    "",
    "In auto retail, small differences in discovery presence change who buyers carry into serious consideration. A dealership can be credible in reality and still get filtered out before the comparison is complete.",
    "",
    "That's the gap I was flagging."
  ].join("\n");
}

/* ============================================================================
   GENERIC REPLIES
============================================================================ */

function buildGenericReply_(lead, inboundText, replyType, profile) {
  var businessName = safeText_(lead.business_name || "your business");
  var compName     = safeText_(lead.comp_1_name || "a stronger visible competitor");
  var city         = safeText_(lead.city || "your market");
  var category     = safeText_(lead.category || "your category");
  var pos          = parseInt(lead.maps_position, 10) || 0;
  var posStr       = pos > 0 ? "position " + pos : "a lower discovery position";

  if (replyType === "curious") {
    return [
      "What I mean is this:",
      "",
      "Buyers in " + city + " make an initial read of who's credible before they compare details. That read happens based on what's visible in the discovery layer — maps position, profile depth, the operational signals your listing projects.",
      "",
      businessName + " is currently at " + posStr + " in " + city + "'s " + category + " results, while " + compName + " and similar operators are projecting a stronger verified footprint above you. The business may be stronger operationally than the market is currently reading it.",
      "",
      "That's the pattern I was pointing to."
    ].join("\n");
  }

  if (replyType === "recognized") {
    return [
      "That tracks.",
      "",
      "When a business is doing real work but the discovery profile trails the competition, market capture gets assigned to the operators who project stronger visibility signals first — before anyone actually compares what's on offer.",
      "",
      "That gap is often more correctable than it looks. That's why I flagged it."
    ].join("\n");
  }

  if (replyType === "skeptical") {
    return [
      "Totally fair.",
      "",
      "It usually doesn't show up obviously on the inside. It shows up as buyers gravitating toward whichever operator reads as most established in the discovery layer — without specifically articulating why.",
      "",
      "I can show you the market map I'm working from if you want to see what the public signals actually say about your position."
    ].join("\n");
  }

  if (replyType === "challenge") {
    return [
      "Just from public market signals — maps position, profile depth, the operational signals that search results and AI tools use to assign credibility.",
      "",
      businessName + " is at " + posStr + " in " + city + "'s results and the verified footprint your profile projects trails " + compName + " in a few specific ways. I can walk you through the full picture if that would be useful."
    ].join("\n");
  }

  if (replyType === "offer_question") {
    return [
      "I help businesses close the gap between their operational strength and what the discovery surface is projecting.",
      "",
      "Not a generic marketing service — specifically making sure the verified signals in your public profile match what you're actually running, so buyers aren't filtering you out before a real comparison happens."
    ].join("\n");
  }

  return [
    "At a high level, I'm pointing to a market capture gap.",
    "",
    "The business may be stronger operationally than the discovery surface reflects. When that's the case, buyers are choosing from a set that doesn't fully include you — even if you'd win on merit once they got there.",
    "",
    "That's what I wanted to flag."
  ].join("\n");
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
    business_name:   headers.indexOf("business_name"),
    category:        headers.indexOf("category"),
    city:            headers.indexOf("city"),
    maps_position:   headers.indexOf("maps_position"),
    comp_1_name:     headers.indexOf("comp_1_name"),
    diagnosis_state: headers.indexOf("diagnosis_state"),
    priority_bucket: headers.indexOf("priority_bucket"),
    inbound_reply:   headers.indexOf("inbound_reply"),
    reply_type:      headers.indexOf("reply_type"),
    reply_message:   headers.indexOf("reply_message")
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const inbound = idx.inbound_reply >= 0 ? row[idx.inbound_reply] : "";
    if (!String(inbound || "").trim()) continue;

    const lead = {
      business_name:   idx.business_name   >= 0 ? row[idx.business_name]   : "",
      category:        idx.category        >= 0 ? row[idx.category]        : "",
      city:            idx.city            >= 0 ? row[idx.city]            : "",
      maps_position:   idx.maps_position   >= 0 ? row[idx.maps_position]   : 0,
      comp_1_name:     idx.comp_1_name     >= 0 ? row[idx.comp_1_name]     : "",
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