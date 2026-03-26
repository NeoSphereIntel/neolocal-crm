/**
 * File: 01_menu_and_setup.gs
 */

/* ============================================================================
   MENU / ENTRY POINTS
============================================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("NeoLocal")
    .addItem("Build / Repair System", "buildNeoLocalSalesEngineV23")
    .addSeparator()
    .addItem("Run Active Imports", "runActiveSearchImports")
    .addItem("Rebuild All Snapshots", "rebuildAllSnapshots")
    .addItem("Rebuild Snapshot for Selected Lead", "rebuildSelectedLeadSnapshot")
    .addSeparator()
    .addItem("Generate Shadow Job for Selected Lead", "generateShadowJobForSelectedLead")
    .addItem("Generate Shadow Jobs for Empty Leads", "generateShadowJobsForLeadsWithoutOne")
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu("CRM")
        .addItem("Refresh CRM Views", "refreshCRMExecutionLayer")
        .addSeparator()
        .addItem("Mark Selected Lead as Contacted", "markSelectedLeadAsContacted")
        .addItem("Mark Selected Lead as Replied", "markSelectedLeadAsReplied")
        .addItem("Mark Selected Lead as Qualified", "markSelectedLeadAsQualified")
        .addItem("Mark Selected Lead as Call Booked", "markSelectedLeadAsCallBooked")
        .addItem("Mark Selected Lead as Snapshot Sent", "markSelectedLeadAsSnapshotSent")
        .addSeparator()
        .addItem("Mark Selected Lead as Closed Won", "markSelectedLeadAsClosedWon")
        .addItem("Mark Selected Lead as Closed Lost", "markSelectedLeadAsClosedLost")
        .addSeparator()
        .addItem("Snooze Selected Lead by 2 Days", "snoozeSelectedLead2Days")
        .addItem("Snooze Selected Lead by 3 Days", "snoozeSelectedLead3Days")
        .addItem("Snooze Selected Lead by 5 Days", "snoozeSelectedLead5Days")
    )
    .addSeparator()
    .addItem("Format All Sheets", "formatAllSheets")
    .addItem("Reset Search Config Validation", "resetSearchConfigValidation")
    .addToUi();
}

function buildNeoLocalSalesEngineV23() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const searchSheet = getOrCreateSheet_(ss, APP.SHEETS.SEARCH_CONFIG);
  const leadsSheet = getOrCreateSheet_(ss, APP.SHEETS.LEADS);
  const importLogSheet = getOrCreateSheet_(ss, APP.SHEETS.IMPORT_LOG);
  const shadowSheet = getOrCreateSheet_(ss, APP.SHEETS.SHADOW_JOBS);

  setupSearchConfigSheet_(searchSheet);
  setupLeadsMasterSheet_(leadsSheet);
  setupImportLogSheet_(importLogSheet);
  setupShadowJobsSheet_(shadowSheet);

  formatAllSheets();

  ensureLeadsColumn_("outreach_message");
  ensureLeadsColumn_("inbound_reply");
  ensureLeadsColumn_("reply_type");
  ensureLeadsColumn_("reply_message");

  SpreadsheetApp.getUi().alert(
    "NeoLocal Sales Engine v2.3 is ready.\n\nSearch Config validation has been repaired.\nRefresh the sheet if the NeoLocal menu is not visible yet."
  );
}

function resetSearchConfigValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  if (!sheet) throw new Error("Search Config sheet not found.");

  repairSearchConfigValidation_(sheet);
  styleSearchConfigSheet_(sheet);

  SpreadsheetApp.getUi().alert("Search Config validation has been reset.");
}

function rebuildAllSnapshots() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!leadsSheet) throw new Error("Leads Master not found.");

  const data = getSheetDataObjects_(leadsSheet);
  if (!data.length) {
    SpreadsheetApp.getUi().alert("No leads found.");
    return;
  }

  const headers = getHeaders_(leadsSheet);
  const rowUpdates = [];

  data.forEach(row => {
    const snapshot = buildSnapshotForLeadRow_(row);
    rowUpdates.push({
      rowNumber: row.__rowNumber,
      updates: snapshot
    });
  });

  writeRowUpdates_(leadsSheet, headers, rowUpdates);
  SpreadsheetApp.getUi().alert("All lead snapshots rebuilt.");
}

function rebuildSelectedLeadSnapshot() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!sheet || sheet.getName() !== APP.SHEETS.LEADS) {
    SpreadsheetApp.getUi().alert("Please select a row in Leads Master.");
    return;
  }

  const row = sheet.getActiveCell().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Please select a lead row, not the header.");
    return;
  }

  const lead = getRowObject_(sheet, row);
  const snapshot = buildSnapshotForLeadRow_(lead);
  const headers = getHeaders_(sheet);

  writeRowUpdates_(sheet, headers, [{
    rowNumber: row,
    updates: snapshot
  }]);

  SpreadsheetApp.getUi().alert("Snapshot rebuilt for selected lead.");
}

/* ============================================================================
   SHEET SETUP
============================================================================ */

function setupSearchConfigSheet_(sheet) {
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

  setHeadersIfNeeded_(sheet, headers);

  if (sheet.getLastRow() === 1) {
    const sampleRows = [
      [
        "CFG-001", true, "junk removal", "Montreal", "Canada", "Quebec",
        "", APP.MAX_RESULTS_PER_SEARCH, "en", "", "", "", ""
      ],
      [
        "CFG-002", false, "kitchen refacing", "Laval", "Canada", "Quebec",
        "", APP.MAX_RESULTS_PER_SEARCH, "en", "", "", "", ""
      ]
    ];
    sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  }

  repairSearchConfigValidation_(sheet);
  styleSearchConfigSheet_(sheet);
}

function repairSearchConfigValidation_(sheet) {
  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (!rawHeaders[1]) {
    sheet.getRange(1, 2).setValue("active");
  }

  const refreshedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = refreshedHeaders.map(h => String(h).trim().toLowerCase());
  const totalRowsToFormat = Math.max(sheet.getMaxRows() - 1, 1);
  const lastCol = refreshedHeaders.length;

  const col = {
    config_id: headers.indexOf("config_id") + 1,
    active: headers.indexOf("active") + 1,
    niche: headers.indexOf("niche") + 1,
    city: headers.indexOf("city") + 1,
    country: headers.indexOf("country") + 1,
    province_state: headers.indexOf("province_state") + 1,
    query_override: headers.indexOf("query_override") + 1,
    max_results: headers.indexOf("max_results") + 1,
    language: headers.indexOf("language") + 1,
    notes: headers.indexOf("notes") + 1,
    last_run_at: headers.indexOf("last_run_at") + 1,
    last_search_id: headers.indexOf("last_search_id") + 1,
    last_results_count: headers.indexOf("last_results_count") + 1
  };

  if (!col.active || !col.country || !col.province_state || !col.language || !col.max_results) {
    throw new Error("Search Config headers missing or mismatched after normalization.");
  }

  sheet.getRange(2, 1, totalRowsToFormat, lastCol).clearDataValidations();

  sheet.getRange(2, col.config_id, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.niche, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.city, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.country, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.province_state, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.query_override, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.max_results, totalRowsToFormat, 1).setNumberFormat("0");
  sheet.getRange(2, col.language, totalRowsToFormat, 1).setNumberFormat("@");
  sheet.getRange(2, col.notes, totalRowsToFormat, lastCol - col.notes + 1).setNumberFormat("@");

  const activeRange = sheet.getRange(2, col.active, totalRowsToFormat, 1);
  activeRange.clearDataValidations();
  activeRange.clearContent();
  activeRange.setNumberFormat("GENERAL");
  SpreadsheetApp.flush();
  activeRange.insertCheckboxes();

  const countryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(APP.COUNTRIES, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, col.country, totalRowsToFormat, 1).setDataValidation(countryRule);

  const provinceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(APP.PROVINCES_STATES, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, col.province_state, totalRowsToFormat, 1).setDataValidation(provinceRule);

  const languageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["en", "fr"], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, col.language, totalRowsToFormat, 1).setDataValidation(languageRule);

  const maxRange = sheet.getRange(2, col.max_results, totalRowsToFormat, 1);
  const maxVals = maxRange.getValues().map(r => {
    const n = parseInt(r[0], 10);
    return [n > 0 ? n : APP.MAX_RESULTS_PER_SEARCH];
  });
  maxRange.setValues(maxVals);
}

function debugSearchConfigHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  if (!sheet) throw new Error("Search Config sheet not found");

  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log(JSON.stringify(rawHeaders));
}

function debugForceSearchConfigCheckboxes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  if (!sheet) throw new Error("Search Config sheet not found");

  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = rawHeaders.map(h => String(h).trim().toLowerCase());
  const activeCol = headers.indexOf("active") + 1;

  if (!activeCol) {
    throw new Error('Normalized "active" header not found. Raw headers: ' + JSON.stringify(rawHeaders));
  }

  const testRange = sheet.getRange(2, activeCol, 10, 1);
  testRange.clearContent();
  testRange.clearDataValidations();

  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  testRange.setDataValidation(checkboxRule);
  testRange.setValues([
    [false],[false],[false],[false],[false],
    [false],[false],[false],[false],[false]
  ]);
}

function setupLeadsMasterSheet_(sheet) {
  const headers = [
    "lead_id",
    "search_id",
    "search_config_id",
    "created_at",
    "last_seen_at",
    "status",
    "owner",
    "priority_bucket",
    "business_name",
    "category",
    "city",
    "province_state",
    "country",
    "full_query",
    "source",
    "maps_position",
    "title",
    "rating",
    "reviews_count",
    "review_text",
    "website",
    "phone",
    "address",
    "place_id",
    "gps",
    "hours",
    "lead_signature",
    "website_present",
    "phone_present",
    "comp_1_name",
    "comp_1_reviews",
    "comp_2_name",
    "comp_2_reviews",
    "comp_3_name",
    "comp_3_reviews",
    "comp_avg_reviews",
    "comp_max_reviews",
    "review_gap",
    "gap_ratio",
    "market_review_pressure",
    "market_maturity",
    "authority_position",
    "base_presence_score",
    "trust_score",
    "competitive_pressure_score",
    "opportunity_score",
    "difficulty_score",
    "priority_score",
    "diagnosis_state",
    "market_position_summary",
    "strategic_gap_summary",
    "action_implication_summary",
    "snapshot_narrative",
    "snapshot_version",
    "shadow_job_status",
    "shadow_job_title",
    "shadow_job_created_at",
    "notes",
    "outreach_message",
    "inbound_reply",
    "reply_type",
    "reply_message"
  ];

  setHeadersIfNeeded_(sheet, headers);
  styleLeadsSheet_(sheet);
}

function setupImportLogSheet_(sheet) {
  const headers = [
    "run_at",
    "search_id",
    "search_config_id",
    "query",
    "results_count",
    "inserted_count",
    "updated_count",
    "status",
    "message"
  ];

  setHeadersIfNeeded_(sheet, headers);
  styleImportLogSheet_(sheet);
}

function setupShadowJobsSheet_(sheet) {
  const headers = [
    "shadow_job_id",
    "created_at",
    "lead_id",
    "business_name",
    "category",
    "city",
    "province_state",
    "country",
    "diagnosis_state",
    "priority_bucket",
    "shadow_job_title",
    "market_hook",
    "gap_angle",
    "action_angle",
    "draft_prompt",
    "snapshot_excerpt",
    "status"
  ];

  setHeadersIfNeeded_(sheet, headers);
  styleShadowJobsSheet_(sheet);
}

/* ============================================================================
   FORMATTING
============================================================================ */

function formatAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const searchSheet = ss.getSheetByName(APP.SHEETS.SEARCH_CONFIG);
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  const importLogSheet = ss.getSheetByName(APP.SHEETS.IMPORT_LOG);
  const shadowSheet = ss.getSheetByName(APP.SHEETS.SHADOW_JOBS);

  if (searchSheet) styleSearchConfigSheet_(searchSheet);
  if (leadsSheet) styleLeadsSheet_(leadsSheet);
  if (importLogSheet) styleImportLogSheet_(importLogSheet);
  if (shadowSheet) styleShadowJobsSheet_(shadowSheet);
}

function styleSearchConfigSheet_(sheet) {
  const widths = [110, 70, 180, 140, 120, 150, 260, 100, 90, 180, 150, 150, 120];
  applyBaseSheetStyle_(sheet, widths);

  const lastRow = Math.max(sheet.getLastRow(), 2);

  sheet.getRange(2, 4, lastRow - 1, 1).setNumberFormat("@");
  sheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat("@");
  sheet.getRange(2, 6, lastRow - 1, 1).setNumberFormat("@");
  sheet.getRange(2, 7, lastRow - 1, 1).setNumberFormat("@");
  sheet.getRange(2, 8, lastRow - 1, 1).setNumberFormat("0");
  sheet.getRange(2, 9, lastRow - 1, 1).setNumberFormat("@");
}

function styleLeadsSheet_(sheet) {
  const widths = [
    120, 150, 120, 145, 145, 110, 110, 100, 220, 160, 130, 130, 110, 220, 160,
    90, 220, 80, 100, 220, 220, 140, 260, 170, 130, 180, 220, 100, 100,
    180, 90, 180, 90, 180, 90, 110, 110, 100, 90, 120, 120, 120,
    100, 90, 100, 100, 100, 100, 130, 260, 260, 260, 420, 220, 130, 220, 145, 220
  ];
  applyBaseSheetStyle_(sheet, widths);

  // TEXT COLUMNS — apply to whole column, not just existing rows
  [
    "A:A","B:B","C:C","F:F","G:G","H:H","I:I","J:J","K:K","L:L","M:M","N:N","O:O","Q:Q",
    "T:T","U:U","V:V","W:W","X:X","Y:Y","Z:Z","AA:AA","AB:AB","AC:AC","AD:AD",
    "AF:AF","AH:AH","AN:AN","AO:AO","AP:AP","AQ:AQ","AR:AR","AS:AS","AT:AT","AU:AU","AV:AV","AX:AX"
  ].forEach(r => sheet.getRange(r).setNumberFormat("@"));

  // TIMESTAMPS
  sheet.getRange("D:E").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange("BE:BE").setNumberFormat("yyyy-mm-dd hh:mm:ss");

  // NUMERIC COLUMNS
  sheet.getRange("P:P").setNumberFormat("0");       // maps_position
  sheet.getRange("R:R").setNumberFormat("0.0");     // rating
  sheet.getRange("S:S").setNumberFormat("0");       // reviews_count
  sheet.getRange("AE:AE").setNumberFormat("0");     // comp_1_reviews
  sheet.getRange("AG:AG").setNumberFormat("0");     // comp_2_reviews
  sheet.getRange("AI:AI").setNumberFormat("0");     // comp_3_reviews
  sheet.getRange("AJ:AJ").setNumberFormat("0.0");   // comp_avg_reviews
  sheet.getRange("AK:AK").setNumberFormat("0");     // comp_max_reviews
  sheet.getRange("AL:AL").setNumberFormat("0");     // review_gap
  sheet.getRange("AM:AM").setNumberFormat("0.00");  // gap_ratio
  sheet.getRange("AQ:AV").setNumberFormat("0");     // scores
}

function styleImportLogSheet_(sheet) {
  const widths = [145, 160, 130, 260, 100, 100, 100, 100, 320];
  applyBaseSheetStyle_(sheet, widths);
}

function styleShadowJobsSheet_(sheet) {
  const widths = [120, 145, 120, 220, 160, 130, 130, 110, 130, 100, 220, 240, 240, 240, 420, 360, 100];
  applyBaseSheetStyle_(sheet, widths);
}

function applyBaseSheetStyle_(sheet, widths) {
  const lastCol = Math.max(sheet.getLastColumn(), widths.length);

  sheet.setFrozenRows(1);

  const headerRange = sheet.getRange(1, 1, 1, Math.min(lastCol, sheet.getLastColumn()));
  headerRange.setFontWeight("bold");
  headerRange.setWrap(true);
  headerRange.setVerticalAlignment("middle");

  if (sheet.getLastRow() > 1 && sheet.getLastColumn() > 0) {
    const bodyRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    bodyRange.setWrap(true);
    bodyRange.setVerticalAlignment("top");
  }

  widths.forEach((w, i) => {
    sheet.setColumnWidth(i + 1, w);
  });
}

function autoSizeAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(sheet => {
    if (sheet.getLastColumn() > 0) {
      sheet.autoResizeColumns(1, sheet.getLastColumn());
    }
  });
}