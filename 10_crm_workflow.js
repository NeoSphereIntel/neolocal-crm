/**
 * NeoLocal — CRM Execution Layer v2
 * File: 10_crm_workflow.js
 *
 * Adds:
 * - CRM menu actions
 * - follow-up cadence
 * - activity logging
 * - derived views refresh
 */

function refreshCRMExecutionLayer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!leadsSheet) throw new Error("Leads Master not found");

  ensureCRMColumns_(leadsSheet);
  const activitiesSheet = ensureActivitiesSheet_(ss);

  const headers = getHeaders_(leadsSheet);
  const rows = getSheetDataObjects_(leadsSheet);
  const now = new Date();
  const rowUpdates = [];

  rows.forEach(row => {
    const updates = computeCRMStateForRow_(row, now);
    if (Object.keys(updates).length) {
      rowUpdates.push({
        rowNumber: row.__rowNumber,
        updates: updates
      });
    }
  });

  if (rowUpdates.length) {
    writeRowUpdates_(leadsSheet, headers, rowUpdates);
  }

  const refreshedRows = getSheetDataObjects_(leadsSheet);
  buildSalesWorkspace_(ss, refreshedRows);
  buildFollowUps_(ss, refreshedRows);
  buildPipeline_(ss, refreshedRows);

  void activitiesSheet; // kept for future use and ensured now
}

function computeCRMStateForRow_(row, now) {
  const out = {};

  if (!row.pipeline_stage) out.pipeline_stage = "New";
  if (!row.follow_up_count && row.follow_up_count !== 0) out.follow_up_count = 0;
  if (!row.next_action && !isClosed_(row.pipeline_stage || out.pipeline_stage)) {
    out.next_action = "Initial outreach";
  }
  if (!row.next_action_due_at && !isClosed_(row.pipeline_stage || out.pipeline_stage)) {
    out.next_action_due_at = stripTime_(now);
  }

  const effectiveReply = normalizeReply_(row.reply_type);

  if (effectiveReply === "POSITIVE" && !isClosed_(row.pipeline_stage)) {
    out.pipeline_stage = "Replied";
    out.last_reply_at = row.last_reply_at || now;
    out.last_contact_at = now;
    out.next_action = "Engage / qualify";
    out.next_action_due_at = stripTime_(now);
    out.pipeline_updated_at = now;
  }

  if (effectiveReply === "MEETING" && !isClosed_(row.pipeline_stage)) {
    out.pipeline_stage = "Call Booked";
    out.last_reply_at = row.last_reply_at || now;
    out.last_contact_at = now;
    out.next_action = "Prepare call";
    out.next_action_due_at = stripTime_(now);
    out.pipeline_updated_at = now;
  }

  if (effectiveReply === "NEGATIVE" && !isClosed_(row.pipeline_stage)) {
    out.pipeline_stage = "Closed Lost";
    out.closed_at = row.closed_at || now;
    out.next_action = "";
    out.next_action_due_at = "";
    out.is_overdue = "NO";
    out.pipeline_updated_at = now;
  }

  const due = out.next_action_due_at || row.next_action_due_at;
  const effectiveStage = out.pipeline_stage || row.pipeline_stage || "New";

  if (!isClosed_(effectiveStage)) {
    if (due) {
      const dueDate = stripTime_(new Date(due));
      out.is_overdue = dueDate.getTime() < stripTime_(now).getTime() ? "YES" : "NO";
    } else {
      out.is_overdue = "NO";
    }
  } else {
    out.is_overdue = "NO";
  }

  if (!row.last_contact_at && (row.last_reply_at || row.last_outreach_at)) {
    out.last_contact_at = row.last_reply_at || row.last_outreach_at;
  }

  return out;
}

/* ============================================================================
   REP ACTIONS
============================================================================ */

function markSelectedLeadAsContacted() {
  applyCRMActionToSelectedLead_(function(row, now) {
    const count = toInt_(row.follow_up_count) + 1;
    const delayDays = getNextFollowUpDelayDays_(count);

    return {
      pipeline_stage: "Contacted",
      pipeline_updated_at: now,
      last_outreach_at: now,
      last_contact_at: now,
      follow_up_count: count,
      next_action: "Follow-up",
      next_action_due_at: addDays_(stripTime_(now), delayDays),
      is_overdue: "NO"
    };
  }, "contacted");
}

function markSelectedLeadAsReplied() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Replied",
      pipeline_updated_at: now,
      last_reply_at: now,
      last_contact_at: now,
      next_action: "Engage / qualify",
      next_action_due_at: stripTime_(now),
      is_overdue: "NO",
      reply_type: row.reply_type || "positive"
    };
  }, "replied");
}

function markSelectedLeadAsQualified() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Qualified",
      pipeline_updated_at: now,
      last_contact_at: now,
      next_action: "Book call",
      next_action_due_at: addDays_(stripTime_(now), 1),
      is_overdue: "NO"
    };
  }, "qualified");
}

function markSelectedLeadAsCallBooked() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Call Booked",
      pipeline_updated_at: now,
      last_contact_at: now,
      next_action: "Prepare call",
      next_action_due_at: stripTime_(now),
      is_overdue: "NO"
    };
  }, "call_booked");
}

function markSelectedLeadAsSnapshotSent() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Snapshot Sent",
      pipeline_updated_at: now,
      last_contact_at: now,
      next_action: "Follow up on snapshot",
      next_action_due_at: addDays_(stripTime_(now), 2),
      is_overdue: "NO"
    };
  }, "snapshot_sent");
}

function markSelectedLeadAsClosedWon() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Closed Won",
      pipeline_updated_at: now,
      closed_at: now,
      next_action: "",
      next_action_due_at: "",
      is_overdue: "NO"
    };
  }, "closed_won");
}

function markSelectedLeadAsClosedLost() {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      pipeline_stage: "Closed Lost",
      pipeline_updated_at: now,
      closed_at: now,
      next_action: "",
      next_action_due_at: "",
      is_overdue: "NO"
    };
  }, "closed_lost");
}

function snoozeSelectedLead2Days() {
  snoozeSelectedLeadByDays_(2);
}

function snoozeSelectedLead3Days() {
  snoozeSelectedLeadByDays_(3);
}

function snoozeSelectedLead5Days() {
  snoozeSelectedLeadByDays_(5);
}

function snoozeSelectedLeadByDays_(days) {
  applyCRMActionToSelectedLead_(function(row, now) {
    return {
      next_action_due_at: addDays_(stripTime_(now), days),
      is_overdue: "NO"
    };
  }, "snoozed_" + days + "_days");
}

function applyCRMActionToSelectedLead_(buildUpdatesFn, activityType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  if (!sheet || sheet.getName() !== APP.SHEETS.LEADS) {
    SpreadsheetApp.getUi().alert("Please select a row in Leads Master.");
    return;
  }

  const rowNumber = sheet.getActiveCell().getRow();
  if (rowNumber < 2) {
    SpreadsheetApp.getUi().alert("Please select a lead row, not the header.");
    return;
  }

  ensureCRMColumns_(sheet);
  const headers = getHeaders_(sheet);
  const row = getRowObject_(sheet, rowNumber);
  const now = new Date();

  const oldStage = row.pipeline_stage || "";
  const updates = buildUpdatesFn(row, now) || {};
  writeRowUpdates_(sheet, headers, [{
    rowNumber: rowNumber,
    updates: updates
  }]);

  const updatedRow = getRowObject_(sheet, rowNumber);
  logActivity_(ss, {
    lead_id: updatedRow.lead_id,
    business_name: updatedRow.business_name,
    activity_type: activityType,
    old_value: oldStage,
    new_value: updatedRow.pipeline_stage || "",
    note: "",
    actor: Session.getActiveUser().getEmail() || "unknown"
  });

  refreshCRMExecutionLayer();
}

/* ============================================================================
   SHEET / COLUMN SETUP
============================================================================ */

function ensureCRMColumns_(sheet) {
  const required = [
    "pipeline_stage",
    "pipeline_updated_at",
    "last_outreach_at",
    "last_reply_at",
    "last_contact_at",
    "next_action",
    "next_action_due_at",
    "follow_up_count",
    "is_overdue",
    "crm_notes",
    "estimated_value",
    "closed_at"
  ];

  let headers = getHeaders_(sheet);
  required.forEach(col => {
    if (!headers.includes(col)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      headers.push(col);
    }
  });
}

function ensureActivitiesSheet_(ss) {
  const name = "Activities";
  let sheet = ss.getSheetByName(name);

  const headers = [
    "activity_id",
    "lead_id",
    "business_name",
    "activity_at",
    "activity_type",
    "old_value",
    "new_value",
    "note",
    "actor"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const existing = getHeaders_(sheet);
    if (!existing.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  return sheet;
}

function logActivity_(ss, payload) {
  const sheet = ensureActivitiesSheet_(ss);
  const nextRow = sheet.getLastRow() + 1;
  const now = new Date();

  sheet.getRange(nextRow, 1, 1, 9).setValues([[
    "ACT-" + Utilities.getUuid().slice(0, 8).toUpperCase(),
    payload.lead_id || "",
    payload.business_name || "",
    now,
    payload.activity_type || "",
    payload.old_value || "",
    payload.new_value || "",
    payload.note || "",
    payload.actor || ""
  ]]);
}

/* ============================================================================
   VIEWS
============================================================================ */

function buildSalesWorkspace_(ss, leads) {
  const headers = [
    "lead_id",
    "business_name",
    "category",
    "city",
    "priority_score",
    "pipeline_stage",
    "status_flag",
    "next_action",
    "next_action_due_at",
    "last_contact_at",
    "follow_up_count",
    "outreach_message",
    "inbound_reply",
    "reply_type",
    "owner",
    "crm_notes"
  ];

  const sheet = getOrCreateViewSheet_(ss, "Sales Workspace", headers);

  const data = leads
    .slice()
    .sort(compareLeadsForWorkspace_)
    .map(row => {
      const due = row.next_action_due_at ? new Date(row.next_action_due_at) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let statusFlag = "";
      if (row.is_overdue === "YES") {
        statusFlag = "🔴 OVERDUE";
      } else if (due && !isNaN(due.getTime())) {
        due.setHours(0, 0, 0, 0);
        if (due.getTime() === today.getTime()) {
          statusFlag = "🟡 TODAY";
        } else if (due > today) {
          statusFlag = "🟢 FUTURE";
        }
      }

      return [
        row.lead_id || "",
        row.business_name || "",
        row.category || "",
        row.city || "",
        row.priority_score || "",
        row.pipeline_stage || "",
        statusFlag,
        row.next_action || "",
        row.next_action_due_at || "",
        row.last_contact_at || "",
        row.follow_up_count || 0,
        row.outreach_message || "",
        row.inbound_reply || "",
        row.reply_type || "",
        row.owner || "",
        row.crm_notes || ""
      ];
    });

  writeView_(sheet, data);
  freezeAndFilterView_(sheet, headers.length);
}

function buildFollowUps_(ss, leads) {
  const headers = [
    "business_name",
    "city",
    "priority_score",
    "pipeline_stage",
    "next_action",
    "next_action_due_at",
    "follow_up_count",
    "is_overdue",
    "outreach_message",
    "inbound_reply",
    "owner",
    "crm_notes"
  ];

  const sheet = getOrCreateViewSheet_(ss, "Follow-Ups", headers);

  const data = leads
    .filter(row => !isClosed_(row.pipeline_stage))
    .filter(row => row.is_overdue === "YES" || isToday_(row.next_action_due_at) || isPast_(row.next_action_due_at))
    .sort(compareLeadsForWorkspace_)
    .map(row => [
      row.business_name || "",
      row.city || "",
      row.priority_score || "",
      row.pipeline_stage || "",
      row.next_action || "",
      row.next_action_due_at || "",
      row.follow_up_count || 0,
      row.is_overdue || "NO",
      row.outreach_message || "",
      row.inbound_reply || "",
      row.owner || "",
      row.crm_notes || ""
    ]);

  writeView_(sheet, data);
  freezeAndFilterView_(sheet, headers.length);
}

function buildPipeline_(ss, leads) {
  const stages = [
    "New",
    "Contacted",
    "Replied",
    "Qualified",
    "Call Booked",
    "Snapshot Sent",
    "Closed Won",
    "Closed Lost"
  ];

  const sheet = getOrCreateViewSheet_(ss, "Pipeline", stages);
  const grouped = {};
  stages.forEach(s => grouped[s] = []);

  leads.forEach(row => {
    const stage = row.pipeline_stage || "New";
    if (grouped[stage]) {
      grouped[stage].push(row.business_name || "");
    }
  });

  const maxRows = Math.max(1, ...stages.map(s => grouped[s].length));
  const output = [];

  for (let i = 0; i < maxRows; i++) {
    output.push(stages.map(stage => grouped[stage][i] || ""));
  }

  writeView_(sheet, output);
  sheet.setFrozenRows(1);
}

/* ============================================================================
   VIEW HELPERS
============================================================================ */

function getOrCreateViewSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  const maxRows = Math.max(sheet.getMaxRows(), 2);
  const maxCols = Math.max(sheet.getMaxColumns(), headers.length);

  sheet.getRange(1, 1, maxRows, maxCols).clearContent();

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  return sheet;
}

function writeView_(sheet, data) {
  const maxRows = Math.max(sheet.getMaxRows() - 1, 1);
  const maxCols = Math.max(sheet.getMaxColumns(), 1);
  sheet.getRange(2, 1, maxRows, maxCols).clearContent();

  if (data.length) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }
}

function freezeAndFilterView_(sheet, headerCount) {
  sheet.setFrozenRows(1);
  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  const lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(1, 1, lastRow, headerCount).createFilter();
}

/* ============================================================================
   LOGIC HELPERS
============================================================================ */

function getNextFollowUpDelayDays_(followUpCount) {
  if (followUpCount <= 1) return 2;
  if (followUpCount === 2) return 3;
  if (followUpCount === 3) return 5;
  return 7;
}

function normalizeReply_(val) {
  if (!val) return "";
  const v = String(val).toUpperCase();

  if (v.includes("POSITIVE")) return "POSITIVE";
  if (v.includes("MEETING")) return "MEETING";
  if (v.includes("NEGATIVE")) return "NEGATIVE";

  return "";
}

function compareLeadsForWorkspace_(a, b) {
  const overdueA = a.is_overdue === "YES" ? 0 : 1;
  const overdueB = b.is_overdue === "YES" ? 0 : 1;
  if (overdueA !== overdueB) return overdueA - overdueB;

  const dueA = sortDateValue_(a.next_action_due_at);
  const dueB = sortDateValue_(b.next_action_due_at);
  if (dueA !== dueB) return dueA - dueB;

  const priA = Number(a.priority_score || 0);
  const priB = Number(b.priority_score || 0);
  return priB - priA;
}

function sortDateValue_(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  return new Date(value).getTime();
}

function isToday_(date) {
  if (!date) return false;
  return stripTime_(new Date(date)).getTime() === stripTime_(new Date()).getTime();
}

function isPast_(date) {
  if (!date) return false;
  return stripTime_(new Date(date)).getTime() < stripTime_(new Date()).getTime();
}

function isClosed_(stage) {
  return stage === "Closed Won" || stage === "Closed Lost";
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays_(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toInt_(value) {
  const n = parseInt(value, 10);
  return isNaN(n) ? 0 : n;
}