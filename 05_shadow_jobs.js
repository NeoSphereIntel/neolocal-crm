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
  return "In " + city + ", visible competitors appear to average around " + compAvg + " reviews while this business sits closer to " + reviews + ".";
}

function buildShadowGapAngle_(lead) {
  const state = String(lead.diagnosis_state || "");
  if (state === "Invisible") return "The business is being filtered out before buyers compare real value.";
  if (state === "Emerging") return "The business is visible, but still too early-stage in public authority.";
  if (state === "Undersignaled") return "The likely problem is weak proof translation, not weak capability.";
  if (state === "Outgunned") return "Competitors appear to own the trust layer that drives default selection.";
  if (state === "Contender") return "The business is close, but still lacks enough proof to feel like the safest first choice.";
  return "The business has room to harden and defend its current lead.";
}

function buildShadowActionAngle_(lead) {
  const state = String(lead.diagnosis_state || "");
  if (state === "Invisible") return "Use proof-building and visible trust accumulation to stop being skipped.";
  if (state === "Emerging") return "Use authority-building assets to move from noticed to chosen.";
  if (state === "Undersignaled") return "Translate real-world work into visible market proof.";
  if (state === "Outgunned") return "Counter incumbent momentum with denser trust and stronger authority signaling.";
  if (state === "Contender") return "Close the final authority gap and move into default-choice territory.";
  return "Defend position and compound leadership signals.";
}