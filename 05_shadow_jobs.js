/**
 * File: 05_shadow_jobs.gs
 */

/* ============================================================================
   SHADOW JOB ENGINE
============================================================================ */

function generateShadowJob_(lead) {
  return createShadowJobObject_(lead);
}

function generateShadowJobForSelectedLead() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  const shadowSheet = ss.getSheetByName(APP.SHEETS.SHADOW_JOBS);

  const activeSheet = ss.getActiveSheet();
  if (!activeSheet || activeSheet.getName() !== APP.SHEETS.LEADS) {
    SpreadsheetApp.getUi().alert("Please select a row in Leads Master.");
    return;
  }

  const row = activeSheet.getActiveCell().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Please select a lead row, not the header.");
    return;
  }

  const lead = getRowObject_(leadsSheet, row);
  const shadow = generateShadowJob_(lead);
  appendShadowJob_(shadowSheet, shadow);

  const headers = getHeaders_(leadsSheet);
  writeRowUpdates_(leadsSheet, headers, [{
    rowNumber: row,
    updates: {
      shadow_job_status: "Generated",
      shadow_job_title: shadow.shadow_job_title,
      shadow_job_created_at: shadow.created_at
    }
  }]);

  SpreadsheetApp.getUi().alert("Shadow Job created for selected lead.");
}

function generateShadowJobsForLeadsWithoutOne() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  const shadowSheet = ss.getSheetByName(APP.SHEETS.SHADOW_JOBS);
  const headers = getHeaders_(leadsSheet);

  const leads = getSheetDataObjects_(leadsSheet);
  const updates = [];
  let count = 0;

  leads.forEach(lead => {
    if (!String(lead.shadow_job_status || "").trim()) {
      const shadow = generateShadowJob_(lead);
      appendShadowJob_(shadowSheet, shadow);
      updates.push({
        rowNumber: lead.__rowNumber,
        updates: {
          shadow_job_status: "Generated",
          shadow_job_title: shadow.shadow_job_title,
          shadow_job_created_at: shadow.created_at
        }
      });
      count++;
    }
  });

  if (updates.length) writeRowUpdates_(leadsSheet, headers, updates);
  SpreadsheetApp.getUi().alert("Shadow Jobs generated: " + count);
}

function createShadowJobObject_(lead) {
  const createdAt = nowStr_();
  const diagnosis = String(lead.diagnosis_state || "Emerging");
  const priority = String(lead.priority_bucket || "Tier 2");
  const businessName = safeText_(lead.business_name);
  const category = safeText_(lead.category);
  const city = safeText_(lead.city);
  const province = safeText_(lead.province_state);
  const country = safeText_(lead.country);

  const marketHook = buildShadowMarketHook_(lead);
  const gapAngle = buildShadowGapAngle_(lead);
  const actionAngle = buildShadowActionAngle_(lead);

  const shadowTitle = businessName + " — " + diagnosis + " Snapshot Hook";
  const prompt = [
    "Create a short, sales-driven outreach opener for " + businessName + ".",
    "Business category: " + category + ".",
    "Market: " + [city, province, country].filter(Boolean).join(", ") + ".",
    "Diagnosis state: " + diagnosis + ".",
    "Priority bucket: " + priority + ".",
    "Market hook: " + marketHook,
    "Gap angle: " + gapAngle,
    "Action angle: " + actionAngle,
    "Tone: sharp, observant, commercially intelligent, not generic.",
    "Goal: make them feel seen, slightly exposed, and curious."
  ].join(" ");

  return {
    shadow_job_id: "SHD-" + Utilities.getUuid().slice(0, 8).toUpperCase(),
    created_at: createdAt,
    lead_id: lead.lead_id || "",
    business_name: businessName,
    category: category,
    city: city,
    province_state: province,
    country: country,
    diagnosis_state: diagnosis,
    priority_bucket: priority,
    shadow_job_title: shadowTitle,
    market_hook: marketHook,
    gap_angle: gapAngle,
    action_angle: actionAngle,
    draft_prompt: prompt,
    snapshot_excerpt: truncate_(String(lead.snapshot_narrative || ""), 450),
    status: "Open"
  };
}

function appendShadowJob_(sheet, shadowObj) {
  const headers = getHeaders_(sheet);
  const row = headers.map(h => shadowObj[h] !== undefined ? shadowObj[h] : "");
  sheet.appendRow(row);
}

function buildShadowMarketHook_(lead) {
  const reviews = parseInt(lead.reviews_count, 10) || 0;
  const compAvg = parseInt(lead.comp_avg_reviews, 10) || 0;
  const city = lead.city || "their market";
  const momentumState = String(lead.momentum_state || "").trim();

  let base = "In " + city + ", visible competitors appear to average around " + compAvg + " reviews while this business sits closer to " + reviews + ".";

  if (momentumState === "aggressive") {
    base += " The stronger operators do not just look ahead — they appear to be reinforcing that lead.";
  } else if (momentumState === "stagnant") {
    base += " The upside is that the trust layer does not appear to be accelerating aggressively right now.";
  } else if (momentumState === "active") {
    base += " This looks like a market where trust gaps can widen quickly once momentum starts compounding.";
  }

  return base;
}

function buildShadowGapAngle_(lead) {
  const state = String(lead.diagnosis_state || "");
  const isUndervalued = lead.is_undervalued === true || String(lead.is_undervalued || "").toLowerCase() === "true";

  let base = "";

  if (state === "Invisible") base = "The business is being filtered out before buyers compare real value.";
  else if (state === "Emerging") base = "The business is visible, but still too early-stage in public authority.";
  else if (state === "Undersignaled") base = "The likely problem is weak proof translation, not weak capability.";
  else if (state === "Outgunned") base = "Competitors appear to own the trust layer that drives default selection.";
  else if (state === "Contender") base = "The business is close, but still lacks enough proof to feel like the safest first choice.";
  else base = "The business has room to harden and defend its current lead.";

  if (isUndervalued) {
    base += " It also looks closer to the top of the market than its current public weighting suggests.";
  }

  return base;
}

function buildShadowActionAngle_(lead) {
  const state = String(lead.diagnosis_state || "");
  const momentumState = String(lead.momentum_state || "").trim();
  const isUndervalued = lead.is_undervalued === true || String(lead.is_undervalued || "").toLowerCase() === "true";

  let base = "";

  if (state === "Invisible") base = "Use proof-building and visible trust accumulation to stop being skipped.";
  else if (state === "Emerging") base = "Use authority-building assets to move from noticed to chosen.";
  else if (state === "Undersignaled") base = "Translate real-world work into visible market proof.";
  else if (state === "Outgunned") base = "Counter incumbent momentum with denser trust and stronger authority signaling.";
  else if (state === "Contender") base = "Close the final authority gap and move into default-choice territory.";
  else base = "Defend position and compound leadership signals.";

  if (momentumState === "aggressive") {
    base += " The angle should carry more urgency because delay likely makes the gap harder to close.";
  } else if (momentumState === "stagnant") {
    base += " The angle should emphasize that this is still a timing window, not just a long-term grind.";
  }

  if (isUndervalued) {
    base += " The angle should also stress that the business is closer than it appears, which makes the opportunity feel immediately actionable.";
  }

  return base;
}