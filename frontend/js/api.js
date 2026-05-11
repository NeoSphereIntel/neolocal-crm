// Set to the deployed Apps Script web app URL before use.
export const API_BASE = 'https://script.google.com/macros/s/AKfycbz1aWRhzzbOTFE-48Ahc7paftg1b4_Bu01ElTJzBrcVjhcRJ8H6qbZInA-D1aCchDJr/exec';

async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { mode: 'cors', redirect: 'follow', ...options });
  } catch (err) {
    throw new Error('Network failure: ' + err.message);
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

// text/plain avoids a CORS preflight — Apps Script doPost does not handle OPTIONS.
// The backend accepts both text/plain and application/json.
function apiPost(body) {
  return apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  });
}

/** GET ?format=json&mode=leads&rep=X */
export function fetchLeads(rep) {
  const qs = new URLSearchParams({ format: 'json', mode: 'leads', rep });
  return apiFetch(API_BASE + '?' + qs);
}

/** GET ?format=json&mode=lead&leadId=X */
export function fetchLead(leadId) {
  const qs = new URLSearchParams({ format: 'json', mode: 'lead', leadId });
  return apiFetch(API_BASE + '?' + qs);
}

/** Returns the URL for the server-rendered Market Mirror HTML page (no JSON). */
export function fetchMarketMirrorUrl(leadId) {
  return API_BASE + '?mode=mirror&leadId=' + encodeURIComponent(leadId);
}

/** POST action=update_lead */
export function updateLead(payload) {
  return apiPost({ action: 'update_lead', ...payload });
}

/** POST action=add_lead */
export function addLead(payload) {
  return apiPost({ action: 'add_lead', ...payload });
}

/** POST action=crm_action — actionType: contacted | replied | qualified | call_booked | snapshot_sent */
export function crmAction(leadId, actionType) {
  return apiPost({ action: 'crm_action', lead_id: leadId, action_type: actionType });
}

/** POST action=complete_task — marks task Completed and clears task fields */
export function completeTask(leadId) {
  return apiPost({ action: 'complete_task', lead_id: leadId });
}

/**
 * POST action=lookup_lead — maps to lookupManualLeadFromSerpApi on the backend.
 * Requires adding a 'lookup_lead' case to handleJsonPostRequest_ in 19_rep_webapp.js.
 * identifier: Google Maps URL or Place ID.
 */
export function searchBusiness(identifier) {
  return apiPost({ action: 'lookup_lead', place_identifier: identifier });
}

/** POST action=bulk_assign — sets status and/or assigned_to on multiple leads. */
export function bulkAssignLeadStatus(leadIds, status, assignedTo) {
  return apiPost({ action: 'bulk_assign', lead_ids: leadIds, status: status || '', assigned_to: assignedTo || '' });
}
