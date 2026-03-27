/* ============================================================================
 CRM SIDEBAR LAYER (ISOLATED)
 New file only. No edits to core files required.
============================================================================ */

/**
 * Run this ONCE from the Apps Script editor.
 * It creates an installable open trigger that adds a separate "CRM Panel" menu.
 */
function installCRMPanelMenuTrigger() {
  const triggerHandler = 'addCRMPanelMenu_';

  const existing = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === triggerHandler);

  existing.forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger(triggerHandler)
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();

  SpreadsheetApp.getActive().toast(
    'CRM Panel trigger installed. Reload the spreadsheet.',
    'Setup Complete',
    5
  );
}

/**
 * Installable open trigger target.
 * Adds a separate menu without touching the core onOpen() in 01_menu_and_setup.js
 */
function addCRMPanelMenu_() {
  SpreadsheetApp.getUi()
    .createMenu('CRM Panel')
    .addItem('Open Action Sidebar', 'openCRMActionSidebar')
    .addToUi();
}

/**
 * Opens the isolated CRM sidebar.
 */
function openCRMActionSidebar() {
  const html = HtmlService
    .createHtmlOutputFromFile('crm_action_sidebar')
    .setTitle('CRM Action Panel');

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Reads the selected lead via existing core helper + Leads Master lookup.
 */
function getSelectedLeadContextForSidebar() {
  const leadId = getSelectedLeadIdForCRMAction_();
  return getLeadContextForSidebarByLeadId(leadId);
}

function getLeadContextForSidebarByLeadId(leadId) {
  if (!leadId) throw new Error('Missing lead_id.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName(APP.SHEETS.LEADS);
  if (!leadsSheet) throw new Error('Leads Master not found.');

  const headers = getHeaders_(leadsSheet);
  const rowNumber = findLeadRowNumberByLeadId_(leadsSheet, headers, leadId);
  if (!rowNumber) throw new Error('Lead not found for lead_id: ' + leadId);

  const row = getRowObject_(leadsSheet, rowNumber);

  return {
    lead_id: row.lead_id || '',
    business_name: row.business_name || '',
    city: row.city || '',
    pipeline_stage: row.pipeline_stage || '',
    next_action: row.next_action || '',
    next_action_due_at: formatSidebarDate_(row.next_action_due_at),
    follow_up_count: row.follow_up_count || 0,
    owner: row.owner || '',
    priority_score: row.priority_score || '',
    is_overdue: row.is_overdue || 'NO'
  };
}

/**
 * Sidebar action runner.
 * Reuses existing backend action engine from 10_crm_workflow.js
 */
function runCRMActionFromSidebar(actionName, leadId) {
  if (!leadId) {
    throw new Error('Missing lead_id for sidebar action.');
  }

  switch (actionName) {
    case 'contacted':
      markAsContacted(leadId);
      break;

    case 'replied':
      markAsReplied(leadId);
      break;

    case 'qualified':
      markAsQualified(leadId);
      break;

    case 'call_booked':
      markCallBooked(leadId);
      break;

    case 'snapshot_sent':
      markSnapshotSent(leadId);
      break;

    case 'closed_won':
      applyCRMActionByLeadId_(leadId, function(row, now) {
        return {
          pipeline_stage: 'Closed Won',
          pipeline_updated_at: now,
          closed_at: now,
          next_action: '',
          next_action_due_at: '',
          is_overdue: 'NO'
        };
      }, 'closed_won');
      break;

    case 'closed_lost':
      applyCRMActionByLeadId_(leadId, function(row, now) {
        return {
          pipeline_stage: 'Closed Lost',
          pipeline_updated_at: now,
          closed_at: now,
          next_action: '',
          next_action_due_at: '',
          is_overdue: 'NO'
        };
      }, 'closed_lost');
      break;

    case 'snooze_2':
      applyCRMActionByLeadId_(leadId, function(row, now) {
        return {
          next_action_due_at: addDays_(stripTime_(now), 2),
          is_overdue: 'NO'
        };
      }, 'snoozed_2_days');
      break;

    case 'snooze_3':
      applyCRMActionByLeadId_(leadId, function(row, now) {
        return {
          next_action_due_at: addDays_(stripTime_(now), 3),
          is_overdue: 'NO'
        };
      }, 'snoozed_3_days');
      break;

    case 'snooze_5':
      applyCRMActionByLeadId_(leadId, function(row, now) {
        return {
          next_action_due_at: addDays_(stripTime_(now), 5),
          is_overdue: 'NO'
        };
      }, 'snoozed_5_days');
      break;

    default:
      throw new Error('Unsupported CRM sidebar action: ' + actionName);
  }

  return getLeadContextForSidebarByLeadId(leadId);
}

function formatSidebarDate_(value) {
  if (!value) return '';

  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function getMarketMirrorHtmlForSidebar(vertical) {
  try {
    // 1. Get sample input (for now)
    const input = getMarketMirrorSampleInput_(vertical || "auto_retail");

    // 2. Build payload
    const payload = buildMarketMirrorPayload_(input);

    // 3. Generate HTML
    const html = renderMarketMirrorHtml_(payload);

    return html;

  } catch (err) {
    return `
      <div style="padding:12px;font-family:Arial;">
        <strong style="color:red;">Market Mirror Error</strong><br/>
        <pre>${err.message}</pre>
      </div>
    `;
  }
}