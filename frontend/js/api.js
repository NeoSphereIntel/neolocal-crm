// Set to the deployed Apps Script web app URL before use.
export const API_BASE = 'https://script.google.com/a/macros/neolocal.io/s/AKfycbzxLNvR1Vq6v6al-yeIYDBPzs-DBxcAYI-MBh0oXYRYc1HYU1mXYTLS_fTOnAPQzcow/exec';

async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error('Network failure: ' + err.message);
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

function apiPost(body) {
  return apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/**
 * POST action=lookup_lead — maps to lookupManualLeadFromSerpApi on the backend.
 * Requires adding a 'lookup_lead' case to handleJsonPostRequest_ in 19_rep_webapp.js.
 * identifier: Google Maps URL or Place ID.
 */
export function searchBusiness(identifier) {
  return apiPost({ action: 'lookup_lead', place_identifier: identifier });
}
