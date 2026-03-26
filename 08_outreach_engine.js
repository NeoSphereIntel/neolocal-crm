/**
 * File: 08_outreach_engine.gs
 * Market-position based outreach (non-salesy, non-review-pitch)
 */

function generateOutreachMessage_(m, diagnosis, scores) {
  const verticalKey = determineVerticalType_(m);
  const profile = getVerticalProfile_(verticalKey);

  if (profile.template_family === "auto_retail") {
    return buildAutoRetailOutreach_(m, diagnosis);
  }

  return buildGenericOutreach_(m, diagnosis, profile);
}

/* ============================================================================
   AUTO RETAIL — MARKET-LED OUTREACH
============================================================================ */

function buildAutoRetailOutreach_(m, diagnosis) {
  const priority = diagnosis.priority_bucket;

  if (priority === "High") {
    return `I was looking at how used car dealerships in your market are being perceived, and something stood out.

Some stores seem to be getting treated as the safer place to buy before shoppers even get into serious inventory comparison.

Your dealership looks like it may be getting less of that early buyer confidence than some of the visible market leaders.

Have you noticed that kind of hesitation on your side, where interest is there but decisions don’t always follow through?`;
  }

  if (priority === "Medium") {
    return `I was reviewing a few dealerships in your area and noticed an interesting pattern.

Some stores seem to feel “safe” to buyers faster than others, even before details are compared.

Your dealership looks close enough to be in the mix, but possibly not yet weighted the same way in terms of buyer confidence.

Is that something you’ve been seeing, or am I off?`;
  }

  return `I came across your dealership while looking at the local market.

It looks like buyer confidence in your area is being formed pretty quickly, often before shoppers compare details seriously.

Just curious — is building stronger trust early in the buying process something you’re actively focusing on right now?`;
}

/* ============================================================================
   GENERIC OUTREACH
============================================================================ */

function buildGenericOutreach_(m, diagnosis, profile) {
  const priority = diagnosis.priority_bucket;

  if (priority === "High") {
    return `I was looking at how businesses in your space are being chosen locally, and something stood out.

Some competitors seem to be getting treated as the safer default before buyers really compare options.

Your business looks like it may be getting less of that early trust assignment than others in your market.

Have you noticed that kind of pattern on your side?`;
  }

  if (priority === "Medium") {
    return `I was reviewing a few businesses in your area and noticed something interesting.

Some seem to build buyer confidence faster than others, even before details are fully compared.

Your business looks close, but possibly not weighted the same way yet in terms of trust.

Is that something you’ve observed, or am I off?`;
  }

  return `I came across your business while looking at your local market.

It looks like buyer confidence is being formed quickly in your space.

Just curious — is that something you’re actively working on right now?`;
}

function rebuildAllOutreachMessages() {
  ensureLeadsColumn_("outreach_message");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idx = {
    reviews: headers.indexOf("reviews_count"),
    comp_avg: headers.indexOf("comp_avg_reviews"),
    comp_1_name: headers.indexOf("comp_1_name"),
    comp_1_reviews: headers.indexOf("comp_1_reviews"),
    diagnosis: headers.indexOf("diagnosis_state"),
    priority: headers.indexOf("priority_bucket"),
    output: headers.indexOf("outreach_message")
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const m = {
      reviews_count: row[idx.reviews],
      comp_avg_reviews: row[idx.comp_avg],
      comp_1_name: row[idx.comp_1_name],
      comp_1_reviews: row[idx.comp_1_reviews]
    };

    const diagnosis = {
      diagnosis_state: row[idx.diagnosis],
      priority_bucket: row[idx.priority]
    };

    const message = generateOutreachMessage_(m, diagnosis, {});
    sheet.getRange(i + 1, idx.output + 1).setValue(message);
  }

  SpreadsheetApp.getUi().alert("Outreach messages generated.");
}