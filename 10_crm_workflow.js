/**
 * NeoLocal — CRM Execution Layer v1
 * File: 10_crm_workflow.js
 *
 * Scope:
 * - Append CRM fields to Leads Master
 * - Compute CRM execution state
 * - Build rep-facing views:
 *    - Sales Workspace
 *    - Follow-Ups
 *    - Pipeline
 *
 * IMPORTANT:
 * - Leads Master = source of truth
 * - Views are derived only
 * - No restructuring of existing architecture
 */

function refreshCRMExecutionLayer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);

  if (!leadsSheet) throw new Error("Leads Master not found");

  ensureCRMColumns_(leadsSheet);

  const data = leadsSheet.getDataRange().getValues();
  if (data.length < 2) return;

  const headers = data[0];
  const rows = data.slice(1);

  const now = new Date();
  const updatedRows = [];

  rows.forEach(row => {
    const obj = rowToObject_(row, headers);

    if (!obj.pipeline_stage) {
      obj.pipeline_stage = "New";
      obj.next_action = "Initial outreach";
      obj.next_action_due_at = now;
      obj.follow_up_count = 0;
      obj.is_overdue = "NO";
    }

    if (obj.next_action_due_at) {
      const due = stripTime_(new Date(obj.next_action_due_at));
      obj.is_overdue = (due.getTime() < stripTime_(now).getTime() && !isClosed_(obj.pipeline_stage)) ? "YES" : "NO";
    } else {
      obj.is_overdue = "NO";
    }

    obj.last_contact_at = obj.last_reply_at || obj.last_outreach_at || obj.last_contact_at || "";

    const replyType = normalizeReply_(obj.reply_type);

    if (replyType === "POSITIVE") {
      obj.pipeline_stage = "Replied";
      obj.next_action = "Engage lead";
    }

    if (replyType === "MEETING") {
      obj.pipeline_stage = "Call Booked";
      obj.next_action = "Prepare call";
    }

    if (replyType === "NEGATIVE") {
      obj.pipeline_stage = "Closed Lost";
      obj.closed_at = obj.closed_at || now;
      obj.next_action = "";
    }

    updatedRows.push(objectToRow_(obj, headers));
  });

  leadsSheet.getRange(2, 1, updatedRows.length, headers.length).setValues(updatedRows);

  buildSalesWorkspace_(ss, headers, updatedRows);
  buildFollowUps_(ss, headers, updatedRows);
  buildPipeline_(ss, headers, updatedRows);
}

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
    "owner",
    "crm_notes",
    "estimated_value",
    "closed_at"
  ];

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  required.forEach(col => {
    if (!headers.includes(col)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      headers.push(col);
    }
  });
}

function buildSalesWorkspace_(ss, headers, rows) {
  const sheet = getOrCreateViewSheet_(ss, "Sales Workspace", [
    "business_name",
    "category",
    "city",
    "priority_score",
    "pipeline_stage",
    "outreach_message",
    "inbound_reply",
    "reply_type",
    "next_action",
    "next_action_due_at",
    "is_overdue",
    "owner",
    "crm_notes"
  ]);

  const data = rows.map(r => rowToObject_(r, headers)).map(o => [
    o.business_name || "",
    o.category || "",
    o.city || "",
    o.priority_score || "",
    o.pipeline_stage || "",
    o.outreach_message || "",
    o.inbound_reply || "",
    o.reply_type || "",
    o.next_action || "",
    o.next_action_due_at || "",
    o.is_overdue || "",
    o.owner || "",
    o.crm_notes || ""
  ]);

  writeView_(sheet, data);
}

function buildFollowUps_(ss, headers, rows) {
  const sheet = getOrCreateViewSheet_(ss, "Follow-Ups", [
    "business_name",
    "city",
    "pipeline_stage",
    "next_action",
    "next_action_due_at",
    "is_overdue",
    "outreach_message",
    "inbound_reply"
  ]);

  const data = rows
    .map(r => rowToObject_(r, headers))
    .filter(o => o.is_overdue === "YES" || isToday_(o.next_action_due_at))
    .map(o => [
      o.business_name || "",
      o.city || "",
      o.pipeline_stage || "",
      o.next_action || "",
      o.next_action_due_at || "",
      o.is_overdue || "",
      o.outreach_message || "",
      o.inbound_reply || ""
    ]);

  writeView_(sheet, data);
}

function buildPipeline_(ss, headers, rows) {
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

  rows.map(r => rowToObject_(r, headers)).forEach(o => {
    if (grouped[o.pipeline_stage]) {
      grouped[o.pipeline_stage].push(o.business_name || "");
    }
  });

  const maxRows = Math.max(1, ...Object.values(grouped).map(a => a.length));
  const output = [];

  for (let i = 0; i < maxRows; i++) {
    output.push(stages.map(stage => grouped[stage][i] || ""));
  }

  writeView_(sheet, output);
}

function getOrCreateViewSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isBlankHeader = existingHeaders.every(v => !v);
    if (isBlankHeader) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

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

function rowToObject_(row, headers) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

function objectToRow_(obj, headers) {
  return headers.map(h => obj[h] !== undefined ? obj[h] : "");
}

function normalizeReply_(val) {
  if (!val) return "";
  const v = String(val).toUpperCase();

  if (v.includes("POSITIVE")) return "POSITIVE";
  if (v.includes("MEETING")) return "MEETING";
  if (v.includes("NEGATIVE")) return "NEGATIVE";

  return "";
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isToday_(date) {
  if (!date) return false;
  const d = stripTime_(new Date(date));
  const t = stripTime_(new Date());
  return d.getTime() === t.getTime();
}

function isClosed_(stage) {
  return stage === "Closed Won" || stage === "Closed Lost";
}
