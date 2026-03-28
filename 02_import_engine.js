/**
 * File: 02_import_engine.gs
 */

/* ============================================================================
   SEARCH CONFIG READER
============================================================================ */

function readSearchConfigs_(sheet) {
  const rows = getSheetDataObjects_(sheet);

  return rows.map(r => {
    const query = buildSearchQuery_(r);

    return {
      rowNumber: r.__rowNumber,
      config_id: String(r.config_id || "").trim() || generateConfigId_(),
      active: r.active,
      niche: String(r.niche || "").trim(),
      city: String(r.city || "").trim(),
      country: String(r.country || "").trim(),
      province_state: String(r.province_state || "").trim(),
      query_override: String(r.query_override || "").trim(),
      max_results: Math.max(1, parseInt(r.max_results, 10) || APP.MAX_RESULTS_PER_SEARCH),
      language: String(r.language || "").trim() || "en",
      notes: String(r.notes || "").trim(),
      query: query
    };
  }).filter(c => c.query);
}

function buildSearchQuery_(config) {
  if (String(config.query_override || "").trim()) {
    return String(config.query_override).trim();
  }

  const parts = [
    String(config.niche || "").trim(),
    String(config.city || "").trim(),
    String(config.province_state || "").trim(),
    String(config.country || "").trim()
  ].filter(Boolean);

  return parts.join(", ");
}

/* ============================================================================
   IMPORT ENGINE
============================================================================ */

function runActiveSearchImports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const searchSheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  const importLogSheet = ss.getSheetByName(APP.SHEETS.IMPORT_LOG);

  if (!searchSheet || !leadsSheet || !importLogSheet) {
    throw new Error("System sheets not found. Run buildNeoLocalSalesEngineV23() first.");
  }

  const configs = readSearchConfigs_(searchSheet).filter(c => isTruthy_(c.active));

  if (!configs.length) {
    SpreadsheetApp.getUi().alert("No active Search Config rows found.");
    return;
  }

  let totalImported = 0;
  let totalUpdated = 0;
  let totalSearches = 0;

  configs.forEach(config => {
    const result = importOneSearchConfig_(config, leadsSheet, importLogSheet);
    totalImported += result.inserted;
    totalUpdated += result.updated;
    totalSearches++;
  });

  // Re-apply official formatting after imports
  styleLeadsSheet_(leadsSheet);

  // Refresh CRM derived views after imports
  if (typeof refreshCRMExecutionLayer === "function") {
    refreshCRMExecutionLayer();
  }

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    "Active imports complete.\n\n" +
    "Searches run: " + totalSearches + "\n" +
    "New leads inserted: " + totalImported + "\n" +
    "Existing leads updated: " + totalUpdated
  );
}

function importOneSearchConfig_(config, leadsSheet, importLogSheet) {
  const searchId = generateSearchId_(config);
  const query = config.query;
  const startedAt = nowStr_();

  try {
    const apiResults = fetchSerpApiLocalResults_(query, config.max_results, config.language);
    const normalizedResults = normalizeLocalResults_(apiResults, config, searchId);
    const existing = buildLeadIndex_(leadsSheet);

    let inserted = 0;
    let updated = 0;

    normalizedResults.forEach(item => {
      const found = existing[item.lead_signature];
      if (found) {
        updateExistingLeadFromImport_(leadsSheet, found.rowNumber, item);
        updated++;
      } else {
        appendNewLead_(leadsSheet, item);
        inserted++;
      }
    });

    logImportRun_(importLogSheet, {
      run_at: startedAt,
      search_id: searchId,
      search_config_id: config.config_id,
      query: query,
      results_count: normalizedResults.length,
      inserted_count: inserted,
      updated_count: updated,
      status: "OK",
      message: ""
    });

    writeBackSearchConfigRunMeta_(config.rowNumber, config, searchId, normalizedResults.length);
    return { inserted, updated };

  } catch (err) {
    logImportRun_(importLogSheet, {
      run_at: startedAt,
      search_id: searchId,
      search_config_id: config.config_id,
      query: query,
      results_count: 0,
      inserted_count: 0,
      updated_count: 0,
      status: "ERROR",
      message: String(err && err.message ? err.message : err)
    });

    return { inserted: 0, updated: 0 };
  }
}

function fetchSerpApiLocalResults_(query, maxResults, language) {
  const apiKey = getScriptPropertyOrThrow_("SERPAPI_KEY");

  const params = {
    engine: "google_maps",
    q: query,
    type: "search",
    hl: language || "en",
    api_key: apiKey
  };

  const url = "https://serpapi.com/search.json?" + toQueryString_(params);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error("SerpAPI HTTP " + code + ": " + text);
  }

  const json = JSON.parse(text);
  const localResults = Array.isArray(json.local_results) ? json.local_results : [];

  return localResults.slice(0, maxResults || APP.MAX_RESULTS_PER_SEARCH);
}

function normalizeLocalResults_(localResults, config, searchId) {
  const normalizedLeads = localResults.map((r, i) =>
    buildNormalizedLeadObject_(r, i, config, searchId)
  );

  const marketContext = buildMarketContext_(normalizedLeads);

  return normalizedLeads.map(lead => {
	const competitorSignals = calculateCompetitorSignals_(lead, marketContext);
	const snapshot = generateSnapshot_(lead, competitorSignals);
	const leadId = generateLeadId_(lead, searchId);

	return Object.assign({}, lead, competitorSignals, snapshot, {
		lead_id: leadId,
		"Assigned To": "",
		"Market Mirror URL": buildMarketMirrorUrl_(leadId)
	});
});
}

function buildNormalizedLeadObject_(r, i, config, searchId) {
  const businessName = safeText_(r.title || r.name);
  const category = Array.isArray(r.type) ? r.type.join(", ") : safeText_(r.type || r.category);
  const city = config.city || extractCityFromAddress_(r.address);
  const province = config.province_state || extractProvinceFromAddress_(r.address);
  const country = config.country || "Canada";

  const website = safeText_(r.website);
  const phone = safeText_(r.phone);
  const address = safeText_(r.address);
  const rating = parseFloat(r.rating) || 0;
  const reviews = parseInt(r.reviews, 10) || 0;
  const position = parseInt(r.position, 10) || (i + 1);
  const placeId = safeText_(r.place_id);
  const gps = buildGpsString_(r.gps_coordinates);
  const hours = normalizeHours_(r.hours);
  const reviewText = safeText_(r.description || r.snippet || "No snippet returned");
  const fullQuery = buildSearchQuery_(config);

  return {
    source: "SerpAPI / Google Maps",
    search_id: searchId,
    search_config_id: config.config_id,
    full_query: fullQuery,
    maps_position: position,
    title: businessName,
    business_name: businessName,
    category: category,
    city: city,
    province_state: province,
    country: country,
    rating: rating,
    reviews_count: reviews,
    review_text: reviewText,
    website: website,
    phone: phone,
    address: address,
    place_id: placeId,
    gps: gps,
    hours: hours,
    website_present: website ? "Yes" : "No",
    phone_present: phone ? "Yes" : "No",
    lead_signature: makeLeadSignature_(businessName, city, category),
    created_at: nowStr_(),
    last_seen_at: nowStr_(),
    status: APP.LEAD_STATUS_DEFAULT,
    owner: "",
    priority_bucket: ""
  };
}

function updateExistingLeadFromImport_(sheet, rowNumber, newData) {
  const row = getRowObject_(sheet, rowNumber);

  const merged = Object.assign({}, row, {
    search_id: newData.search_id,
    search_config_id: newData.search_config_id,
    last_seen_at: nowStr_(),
    full_query: newData.full_query,
    source: newData.source,
    maps_position: newData.maps_position,
    title: newData.title,
    business_name: newData.business_name,
    category: newData.category,
    city: newData.city,
    province_state: newData.province_state,
    country: newData.country,
    rating: newData.rating,
    reviews_count: newData.reviews_count,
    review_text: newData.review_text,
    website: newData.website,
    phone: newData.phone,
    address: newData.address,
    place_id: newData.place_id,
    gps: newData.gps,
    hours: newData.hours,
    lead_signature: newData.lead_signature,
    website_present: newData.website_present,
    phone_present: newData.phone_present,
    comp_1_name: newData.comp_1_name,
    comp_1_reviews: newData.comp_1_reviews,
    comp_2_name: newData.comp_2_name,
    comp_2_reviews: newData.comp_2_reviews,
    comp_3_name: newData.comp_3_name,
    comp_3_reviews: newData.comp_3_reviews,
    comp_avg_reviews: newData.comp_avg_reviews,
    comp_max_reviews: newData.comp_max_reviews,
    review_gap: newData.review_gap,
    gap_ratio: newData.gap_ratio,
    market_review_pressure: newData.market_review_pressure,
    market_maturity: newData.market_maturity,
    authority_position: newData.authority_position,
    base_presence_score: newData.base_presence_score,
    trust_score: newData.trust_score,
    competitive_pressure_score: newData.competitive_pressure_score,
    opportunity_score: newData.opportunity_score,
    difficulty_score: newData.difficulty_score,
    priority_score: newData.priority_score,
    diagnosis_state: newData.diagnosis_state,
    market_position_summary: newData.market_position_summary,
    strategic_gap_summary: newData.strategic_gap_summary,
    action_implication_summary: newData.action_implication_summary,
    snapshot_narrative: newData.snapshot_narrative,
	snapshot_version: newData.snapshot_version,
	priority_bucket: newData.priority_bucket || row.priority_bucket || "",
	"Assigned To": row["Assigned To"] || "",
	"Market Mirror URL": buildMarketMirrorUrl_(row.lead_id || newData.lead_id)
  });

  const headers = getHeaders_(sheet);
  writeRowUpdates_(sheet, headers, [{
    rowNumber: rowNumber,
    updates: merged
  }]);
}

function appendNewLead_(sheet, leadObj) {
  const headers = getHeaders_(sheet);
  const row = headers.map(h => leadObj[h] !== undefined ? leadObj[h] : "");
  sheet.appendRow(row);
}

function backfillAssignedToAndMarketMirrorUrl_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!sheet) throw new Error("Leads Master sheet not found.");

  const data = getSheetDataObjects_(sheet);
  const headers = getHeaders_(sheet);
  const updates = [];

  data.forEach(row => {
    const patch = {};

    if (!row["Assigned To"]) {
      patch["Assigned To"] = "";
    }

    if (row.lead_id && !row["Market Mirror URL"]) {
      patch["Market Mirror URL"] = buildMarketMirrorUrl_(row.lead_id);
    }

    if (Object.keys(patch).length) {
      updates.push({
        rowNumber: row.__rowNumber,
        updates: patch
      });
    }
  });

  if (updates.length) {
    writeRowUpdates_(sheet, headers, updates);
  }
}

function buildLeadIndex_(sheet) {
  const data = getSheetDataObjects_(sheet);
  const index = {};

  data.forEach(row => {
    if (row.lead_signature) {
      index[row.lead_signature] = {
        rowNumber: row.__rowNumber,
        lead_id: row.lead_id
      };
    }
  });

  return index;
}

function logImportRun_(sheet, obj) {
  const headers = getHeaders_(sheet);
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : "");
  sheet.appendRow(row);
}

function writeBackSearchConfigRunMeta_(rowNumber, config, searchId, count) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);

  sheet.getRange(rowNumber, 1).setValue(config.config_id);
  sheet.getRange(rowNumber, 11).setValue(nowStr_());
  sheet.getRange(rowNumber, 12).setValue(searchId);
  sheet.getRange(rowNumber, 13).setValue(count);

  sheet.getRange(rowNumber, 11).setNumberFormat("@");
  sheet.getRange(rowNumber, 12).setNumberFormat("@");
  sheet.getRange(rowNumber, 13).setNumberFormat("0");
}