/**
 * File: 06_sheet_helpers_and_utils.gs
 */

/* ============================================================================
   SHEET HELPERS
============================================================================ */

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setHeadersIfNeeded_(sheet, headers) {
  const existing = getHeaders_(sheet);

  // Brand new / empty sheet
  if (!existing.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  // Exact match = nothing to do
  const exactMatch =
    existing.length === headers.length &&
    existing.every((h, i) => h === headers[i]);

  if (exactMatch) return;

  // Preserve existing data and append only missing headers
  const missingHeaders = headers.filter(h => !existing.includes(h));
  if (!missingHeaders.length) return;

  const startCol = existing.length + 1;
  sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
}

function getHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}

function getSheetDataObjects_(sheet) {
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map((row, idx) => {
    const obj = { __rowNumber: idx + 2 };
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getRowObject_(sheet, rowNumber) {
  const headers = getHeaders_(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const obj = { __rowNumber: rowNumber };
  headers.forEach((h, i) => obj[h] = values[i]);
  return obj;
}

function writeRowUpdates_(sheet, headers, updates) {
  const headerIndex = {};
  headers.forEach((h, i) => headerIndex[h] = i + 1);

  updates.forEach(item => {
    const rowNum = item.rowNumber;
    const obj = item.updates || {};
    Object.keys(obj).forEach(key => {
      if (headerIndex[key]) {
        sheet.getRange(rowNum, headerIndex[key]).setValue(obj[key]);
      }
    });
  });
}

/* ============================================================================
   IDS / NORMALIZATION
============================================================================ */

function generateLeadId_(lead, searchId) {
  const base = [
    safeSlug_(lead.business_name),
    safeSlug_(lead.city),
    safeSlug_(lead.category)
  ].filter(Boolean).join("-");

  const shortHash = md5Hex_(base + "|" + searchId).slice(0, 8).toUpperCase();
  return "LEAD-" + shortHash;
}

function generateSearchId_(config) {
  const stamp = Utilities.formatDate(new Date(), APP.TZ, "yyyyMMdd-HHmmss");
  const seed = [
    config.config_id || "",
    config.niche || "",
    config.city || "",
    config.province_state || "",
    config.country || ""
  ].join("|");

  return "SRCH-" + stamp + "-" + md5Hex_(seed).slice(0, 6).toUpperCase();
}

function generateConfigId_() {
  return "CFG-" + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function makeLeadSignature_(businessName, city, category) {
  return [
    safeSlug_(businessName),
    safeSlug_(city),
    safeSlug_(category)
  ].join("|");
}

function safeSlug_(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText_(value) {
  return String(value || "").trim();
}

/* ============================================================================
   GENERAL HELPERS
============================================================================ */

function clamp_(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function avg_(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round1_(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function truncate_(text, maxLen) {
  const t = String(text || "");
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 3) + "...";
}

function isTruthy_(value) {
  if (typeof value === "boolean") return value;
  const v = String(value || "").trim().toLowerCase();
  return ["true", "yes", "1", "y"].indexOf(v) !== -1;
}

function nowStr_() {
  return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd HH:mm:ss");
}

function buildMarketLabel_(m) {
  const city = safeText_(m.city);
  return city || "your area";
}

function classifyMarketPressure_(compAvg, compMax) {
  if (compAvg >= 150 || compMax >= 300) return "High";
  if (compAvg >= 50 || compMax >= 120) return "Medium";
  return "Low";
}

function extractCityFromAddress_(address) {
  const parts = String(address || "").split(",");
  return parts.length >= 2 ? parts[1].trim() : "";
}

function extractProvinceFromAddress_(address) {
  const parts = String(address || "").split(",");
  return parts.length >= 3 ? parts[2].trim() : "";
}

function buildGpsString_(gpsObj) {
  if (!gpsObj || typeof gpsObj !== "object") return "";
  const lat = gpsObj.latitude || gpsObj.lat || "";
  const lng = gpsObj.longitude || gpsObj.lng || "";
  if (lat === "" || lng === "") return "";
  return lat + "," + lng;
}

function normalizeHours_(hours) {
  if (!hours) return "";
  if (Array.isArray(hours)) return hours.join(" | ");
  if (typeof hours === "object") return JSON.stringify(hours);
  return String(hours);
}

/* ============================================================================
   HTTP / HASH / PROPERTIES
============================================================================ */

function toQueryString_(obj) {
  return Object.keys(obj)
    .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
}

function getScriptPropertyOrThrow_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error("Missing Script Property: " + key);
  return value;
}

function md5Hex_(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function testSerpApiConnection() {
  const apiKey = getScriptPropertyOrThrow_("SERPAPI_KEY");

  const params = {
    engine: "google_maps",
    q: "junk removal, Montreal, Quebec, Canada",
    type: "search",
    hl: "en",
    api_key: apiKey
  };

  const url = "https://serpapi.com/search.json?" + toQueryString_(params);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  Logger.log("HTTP Code: " + response.getResponseCode());
  Logger.log(response.getContentText());
}


function hardResetSearchConfigSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  if (!sheet) throw new Error("Search Config sheet not found.");

  const headers = [
    "config_id",
    "active",
    "niche",
    "city",
    "country",
    "province_state",
    "query_override",
    "max_results",
    "language",
    "notes",
    "last_run_at",
    "last_search_id",
    "last_results_count"
  ];

  // Clear a large safe area so old validation and formatting cannot survive
  sheet.getRange("A:Z").clearDataValidations();
  sheet.getRange("A:Z").clearFormat();
  sheet.getRange("A:Z").clearNote();
  sheet.getRange("A1:Z1000").clearContent();

  // Rewrite headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Rewrite starter rows
  const sampleRows = [
    [
      "CFG-001", true, "used cars for sale", "Richmond", "Canada", "Quebec",
      "", APP.MAX_RESULTS_PER_SEARCH, "en", "", "", "", ""
    ],
    [
      "CFG-002", false, "used cars for sale", "Laval", "Canada", "Quebec",
      "", APP.MAX_RESULTS_PER_SEARCH, "en", "", "", "", ""
    ]
  ];
  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);

  // Rebuild validation and formatting
  repairSearchConfigValidation_(sheet);
  styleSearchConfigSheet_(sheet);

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("Search Config sheet has been hard reset.");
}
function enforceLeadsNumericFormats_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!sheet) throw new Error("Leads Master sheet not found.");

  const lastRow = Math.max(sheet.getLastRow(), 2);

  // Force text columns that should never become dates
  [1,2,3,6,7,8,9,10,11,12,13,14,15,17,20,21,22,23,24,25,26,27,28,29,30,32,34,40,41,42,49,50,51,52,53,54,55,56,58]
    .forEach(col => sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat("@"));

  // Force date/time columns
  sheet.getRange(2, 4, lastRow - 1, 2).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange(2, 57, lastRow - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

  // Force numeric columns
  sheet.getRange(2, 16, lastRow - 1, 1).setNumberFormat("0");      // maps_position
  sheet.getRange(2, 18, lastRow - 1, 1).setNumberFormat("0.0");    // rating
  sheet.getRange(2, 19, lastRow - 1, 1).setNumberFormat("0");      // reviews_count
  sheet.getRange(2, 31, lastRow - 1, 1).setNumberFormat("0");      // comp_1_reviews
  sheet.getRange(2, 33, lastRow - 1, 1).setNumberFormat("0");      // comp_2_reviews
  sheet.getRange(2, 35, lastRow - 1, 1).setNumberFormat("0");      // comp_3_reviews
  sheet.getRange(2, 36, lastRow - 1, 1).setNumberFormat("0.0");    // comp_avg_reviews
  sheet.getRange(2, 37, lastRow - 1, 1).setNumberFormat("0");      // comp_max_reviews
  sheet.getRange(2, 38, lastRow - 1, 1).setNumberFormat("0");      // review_gap
  sheet.getRange(2, 39, lastRow - 1, 1).setNumberFormat("0.00");   // gap_ratio
  sheet.getRange(2, 43, lastRow - 1, 6).setNumberFormat("0");      // scores

  SpreadsheetApp.flush();
}

function hardResetLeadsFormats_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!sheet) throw new Error("Leads Master sheet not found.");

  // wipe only formatting, not data
  sheet.getRange("A:BF").clearFormat();

  // re-apply official style
  styleLeadsSheet_(sheet);
  enforceLeadsNumericFormats_();

  SpreadsheetApp.getUi().alert("Leads Master formats have been hard reset.");
}

function ensureLeadsColumn_(columnName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.LEADS);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (!headers.includes(columnName)) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue(columnName);
  }
}

function buildMarketMirrorUrl_(leadId) {
  const base = ScriptApp.getService().getUrl();
  return base + '?leadId=' + encodeURIComponent(leadId);
}