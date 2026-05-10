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
    const normalizedResults = normalizeLocalResults_(apiResults, config, searchId, importLogSheet);
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

function normalizeLocalResults_(localResults, config, searchId, importLogSheet) {
  const normalizedLeads = localResults.map((r, i) => {
    const lead = buildNormalizedLeadObject_(r, i, config, searchId);
    const leadId = generateLeadId_(lead, searchId);
    const enrichment = enrichLeadWithApiData_(lead, leadId, searchId, importLogSheet);
    return Object.assign({}, lead, { lead_id: leadId }, enrichment);
  });

  const marketContext = buildMarketContext_(normalizedLeads);

  return normalizedLeads.map(lead => {
	const peerBand        = calculatePeerBand_(normalizedLeads, lead);
	const dimensionScores = calculateDimensionScores_(lead, peerBand);
	const competitorSignals = calculateCompetitorSignals_(lead, marketContext);
	const snapshot        = generateSnapshot_(lead, competitorSignals);
	const marketCapture   = calculateMarketCapture_(dimensionScores, {
		operator_scale_band:    lead.operator_scale_band,
		operator_monthly_volume: lead.operator_monthly_volume,
		operator_business_model: lead.operator_business_model,
		reviews_count:          lead.reviews_count,
		peer_avg_reviews:       peerBand.peer_avg_reviews
	});
	const marketIntelNarrative = buildMarketIntelligenceNarrative_(lead, marketCapture, competitorSignals, peerBand);
	const miOutreach           = generateMarketIntelOutreach_(lead, marketCapture, peerBand);

	return Object.assign({}, lead, peerBand, dimensionScores, competitorSignals, snapshot, {
		market_capture_score:       marketCapture.market_capture_score,
		diagnosis_state:            marketCapture.diagnosis,
		operator_fit_score:         marketCapture.operator_fit !== null ? marketCapture.operator_fit : "",
		market_position_summary:    marketIntelNarrative.market_position_summary,
		strategic_gap_summary:      marketIntelNarrative.strategic_gap_summary,
		action_implication_summary: marketIntelNarrative.action_implication_summary,
		snapshot_narrative:         marketIntelNarrative.snapshot_narrative,
		outreach_message:           miOutreach.cold_email,
		outreach_dm:                miOutreach.dm,
		outreach_followup:          miOutreach.follow_up,
		"Assigned To": "",
		"Market Mirror URL": buildMarketMirrorUrl_(lead.lead_id),
		"Rep Support URL":   buildRepSupportUrl_(lead.lead_id)
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
  const dataId = safeText_(r.data_id);
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
    data_id: dataId,
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
    data_id: newData.data_id,
    description: newData.description,
    service_options: newData.service_options,
    extensions: newData.extensions,
    has_booking_link: newData.has_booking_link,
    categories_full: newData.categories_full,
    similar_places: newData.similar_places,
    also_search_for: newData.also_search_for,
    photo_count: newData.photo_count,
    thumbnail_url: newData.thumbnail_url,
    review_topics: newData.review_topics,
    owner_response_count: newData.owner_response_count,
    reviews_sampled: newData.reviews_sampled,
    owner_response_rate: newData.owner_response_rate,
    latest_review_date: newData.latest_review_date,
    latest_response_date: newData.latest_response_date,
    recent_avg_rating: newData.recent_avg_rating,
    rating_trend: newData.rating_trend,
    total_photos: newData.total_photos,
    photo_categories: newData.photo_categories,
    owner_photos: newData.owner_photos,
    latest_photo_date: newData.latest_photo_date,
    enrichment_status: newData.enrichment_status,
    peer_avg_reviews: newData.peer_avg_reviews,
    peer_avg_rating: newData.peer_avg_rating,
    peer_avg_photos: newData.peer_avg_photos,
    peer_count: newData.peer_count,
    leader_avg_reviews: newData.leader_avg_reviews,
    leader_avg_photos: newData.leader_avg_photos,
    discovery_position_score: newData.discovery_position_score,
    profile_authority_score: newData.profile_authority_score,
    trust_surface_score: newData.trust_surface_score,
    owner_engagement_score: newData.owner_engagement_score,
    competitive_displacement_score: newData.competitive_displacement_score,
    market_capture_score: newData.market_capture_score,
    operator_fit_score: newData.operator_fit_score,
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
    outreach_message: newData.outreach_message,
    outreach_dm: newData.outreach_dm,
    outreach_followup: newData.outreach_followup,
	snapshot_version: newData.snapshot_version,
	priority_bucket: newData.priority_bucket || row.priority_bucket || "",
	"Assigned To": row["Assigned To"] || "",
	"Market Mirror URL": buildMarketMirrorUrl_(row.lead_id || newData.lead_id),
	"Rep Support URL": buildRepSupportUrl_(row.lead_id || newData.lead_id)
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

function backfillAssignedToAndMarketMirrorUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!sheet) throw new Error("Leads Master sheet not found.");

  ensureLeadsColumn_("Assigned To");
  ensureLeadsColumn_("Market Mirror URL");
  ensureLeadsColumn_("Rep Support URL");

  const data = getSheetDataObjects_(sheet);
  const headers = getHeaders_(sheet);
  const updates = [];

  data.forEach(row => {
    const patch = {};

    if (row["Assigned To"] === undefined || row["Assigned To"] === null) {
      patch["Assigned To"] = "";
    }

    if (row.lead_id) {
      const expectedMirrorUrl = buildMarketMirrorUrl_(row.lead_id);
      const expectedSupportUrl = buildRepSupportUrl_(row.lead_id);
      if (row["Market Mirror URL"] !== expectedMirrorUrl) {
        patch["Market Mirror URL"] = expectedMirrorUrl;
      }
      if (row["Rep Support URL"] !== expectedSupportUrl) {
        patch["Rep Support URL"] = expectedSupportUrl;
      }
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

/* ============================================================================
   ENRICHMENT PIPELINE
============================================================================ */

function enrichLeadWithApiData_(lead, leadId, searchId, importLogSheet) {
  const identifier = lead.data_id || lead.place_id;

  if (!identifier) {
    logEnrichmentError_(importLogSheet, searchId, leadId, "all", new Error("No place_id or data_id available"));
    return Object.assign(
      emptyPlaceDetailsFields_(),
      emptyReviewIntelligenceFields_(),
      emptyPhotoIntelligenceFields_(),
      { enrichment_status: "error" }
    );
  }

  let placeFields = null;
  let reviewFields = null;
  let photoFields = null;

  try {
    const placeJson = fetchSerpApiPlaceDetails_(identifier);
    placeFields = extractPlaceDetailsFields_(placeJson);
  } catch (err) {
    logEnrichmentError_(importLogSheet, searchId, leadId, "place_details", err);
  }

  if (lead.data_id) {
    try {
      const reviewJson = fetchSerpApiReviewsData_(lead.data_id);
      reviewFields = extractReviewIntelligenceFields_(reviewJson);
    } catch (err) {
      logEnrichmentError_(importLogSheet, searchId, leadId, "reviews", err);
    }

    try {
      const photoJson = fetchSerpApiPhotosData_(lead.data_id);
      photoFields = extractPhotoIntelligenceFields_(photoJson);
    } catch (err) {
      logEnrichmentError_(importLogSheet, searchId, leadId, "photos", err);
    }
  } else {
    logEnrichmentError_(importLogSheet, searchId, leadId, "reviews", new Error("No data_id — reviews skipped"));
    logEnrichmentError_(importLogSheet, searchId, leadId, "photos", new Error("No data_id — photos skipped"));
  }

  const successCount = (placeFields ? 1 : 0) + (reviewFields ? 1 : 0) + (photoFields ? 1 : 0);
  const enrichmentStatus = successCount === 3 ? "ok" : (successCount > 0 ? "partial" : "error");

  return Object.assign(
    {},
    placeFields || emptyPlaceDetailsFields_(),
    reviewFields || emptyReviewIntelligenceFields_(),
    photoFields || emptyPhotoIntelligenceFields_(),
    { enrichment_status: enrichmentStatus }
  );
}

function fetchSerpApiPlaceDetails_(identifier) {
  const apiKey = getScriptPropertyOrThrow_("SERPAPI_KEY");
  const params = {
    engine: "google_maps",
    type: "place",
    data_id: identifier,
    api_key: apiKey
  };
  const url = "https://serpapi.com/search.json?" + toQueryString_(params);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("SerpAPI Place Details HTTP " + code + ": " + response.getContentText().slice(0, 200));
  }
  return JSON.parse(response.getContentText());
}

function fetchSerpApiReviewsData_(dataId) {
  const apiKey = getScriptPropertyOrThrow_("SERPAPI_KEY");
  const params = {
    engine: "google_maps_reviews",
    data_id: dataId,
    api_key: apiKey
  };
  const url = "https://serpapi.com/search.json?" + toQueryString_(params);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("SerpAPI Reviews HTTP " + code + ": " + response.getContentText().slice(0, 200));
  }
  return JSON.parse(response.getContentText());
}

function fetchSerpApiPhotosData_(dataId) {
  const apiKey = getScriptPropertyOrThrow_("SERPAPI_KEY");
  const params = {
    engine: "google_maps_photos",
    data_id: dataId,
    api_key: apiKey
  };
  const url = "https://serpapi.com/search.json?" + toQueryString_(params);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("SerpAPI Photos HTTP " + code + ": " + response.getContentText().slice(0, 200));
  }
  return JSON.parse(response.getContentText());
}

function extractPlaceDetailsFields_(json) {
  const p = json.place_results || {};

  const serviceOpts = p.service_options || {};
  const serviceOptStr = Object.keys(serviceOpts)
    .filter(k => serviceOpts[k] === true)
    .map(k => k.replace(/_/g, " "))
    .join(", ");

  const images = Array.isArray(p.images) ? p.images : [];
  const types = Array.isArray(p.types) ? p.types : (p.type ? [p.type] : []);

  const similarPlaces = Array.isArray(p.similar_places_nearby) ? p.similar_places_nearby : [];
  const alsoSearch = Array.isArray(p.people_also_search_for) ? p.people_also_search_for : [];

  const similarStr = similarPlaces.length
    ? similarPlaces.length + ": " + similarPlaces.slice(0, 5).map(s => safeText_(s.name || s)).join(", ")
    : "0";

  const alsoStr = alsoSearch.length
    ? alsoSearch.length + ": " + alsoSearch.slice(0, 5).map(s => safeText_(s.name || s)).join(", ")
    : "0";

  return {
    description: safeText_(p.description || p.editorial_summary || ""),
    service_options: serviceOptStr,
    extensions: p.extensions ? truncate_(JSON.stringify(p.extensions), 500) : "",
    has_booking_link: p.booking_link ? "Yes" : "No",
    categories_full: types.join(", "),
    similar_places: similarStr,
    also_search_for: alsoStr,
    photo_count: images.length,
    thumbnail_url: safeText_(p.thumbnail || "")
  };
}

function extractReviewIntelligenceFields_(json) {
  const reviews = Array.isArray(json.reviews) ? json.reviews : [];
  const topics = Array.isArray(json.topics) ? json.topics : [];

  const topicsFormatted = topics.length
    ? JSON.stringify(topics.slice(0, 20).map(t => ({
        keyword: safeText_(t.keyword || t.topic || ""),
        mentions: parseInt(t.reviews || t.mentions || 0, 10)
      })))
    : "";

  if (!reviews.length) {
    return {
      review_topics: topicsFormatted,
      owner_response_count: 0,
      reviews_sampled: 0,
      owner_response_rate: 0,
      latest_review_date: "",
      latest_response_date: "",
      recent_avg_rating: 0,
      rating_trend: ""
    };
  }

  const ownerResponses = reviews.filter(r => r.response && r.response.snippet);
  const ownerResponseCount = ownerResponses.length;
  const reviewsSampled = reviews.length;
  const ownerResponseRate = round2_(ownerResponseCount / reviewsSampled);

  const reviewDates = reviews.map(r => safeText_(r.iso_date || "")).filter(Boolean).sort().reverse();
  const latestReviewDate = reviewDates[0] || "";

  const responseDates = ownerResponses
    .map(r => safeText_(r.response.iso_date || ""))
    .filter(Boolean)
    .sort()
    .reverse();
  const latestResponseDate = responseDates[0] || "";

  const ratings = reviews.map(r => parseFloat(r.rating) || 0).filter(v => v > 0);
  const recentAvgRating = ratings.length ? round2_(avg_(ratings)) : 0;

  let ratingTrend = "";
  if (ratings.length >= 4) {
    const mid = Math.floor(ratings.length / 2);
    // SerpAPI returns reviews newest-first — slice(0, mid) = most recent half
    const recentAvg = avg_(ratings.slice(0, mid));
    const olderAvg = avg_(ratings.slice(mid));
    const diff = recentAvg - olderAvg;
    ratingTrend = diff >= 0.1 ? "improving" : (diff <= -0.1 ? "declining" : "stable");
  }

  return {
    review_topics: topicsFormatted,
    owner_response_count: ownerResponseCount,
    reviews_sampled: reviewsSampled,
    owner_response_rate: ownerResponseRate,
    latest_review_date: latestReviewDate,
    latest_response_date: latestResponseDate,
    recent_avg_rating: recentAvgRating,
    rating_trend: ratingTrend
  };
}

function extractPhotoIntelligenceFields_(json) {
  const photos = Array.isArray(json.photos) ? json.photos : [];
  const categoriesRaw = Array.isArray(json.categories) ? json.categories : [];

  const categoryTitles = categoriesRaw.map(c => safeText_(c.title || c.name || "")).filter(Boolean);
  let ownerPhotos = 0;

  categoriesRaw.forEach(cat => {
    const title = safeText_(cat.title || cat.name || "").toLowerCase();
    if (title.includes("owner")) {
      ownerPhotos = Array.isArray(cat.photos) ? cat.photos.length : (parseInt(cat.count, 10) || 0);
    }
  });

  return {
    total_photos: photos.length,
    photo_categories: categoryTitles.join(", "),
    owner_photos: ownerPhotos,
    latest_photo_date: ""
  };
}

function emptyPlaceDetailsFields_() {
  return {
    description: "", service_options: "", extensions: "", has_booking_link: "",
    categories_full: "", similar_places: "", also_search_for: "", photo_count: "", thumbnail_url: ""
  };
}

function emptyReviewIntelligenceFields_() {
  return {
    review_topics: "", owner_response_count: "", reviews_sampled: "", owner_response_rate: "",
    latest_review_date: "", latest_response_date: "", recent_avg_rating: "", rating_trend: ""
  };
}

function emptyPhotoIntelligenceFields_() {
  return { total_photos: "", photo_categories: "", owner_photos: "", latest_photo_date: "" };
}

function logEnrichmentError_(importLogSheet, searchId, leadId, errorField, err) {
  if (!importLogSheet) return;
  const headers = getHeaders_(importLogSheet);
  const message = String(err && err.message ? err.message : err);
  const row = headers.map(h => {
    switch (h) {
      case "run_at":       return nowStr_();
      case "search_id":   return searchId || "";
      case "status":      return "ENRICH_ERROR";
      case "message":     return message;
      case "lead_id":     return leadId || "";
      case "error_field": return errorField || "";
      default:            return "";
    }
  });
  importLogSheet.appendRow(row);
}
