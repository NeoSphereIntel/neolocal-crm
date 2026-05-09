import { fetchLead, fetchMarketMirrorUrl, crmAction, updateLead } from './api.js';

const params = new URLSearchParams(location.search);
const leadId = params.get('leadId') || '';
const rep    = params.get('rep') || '';

let currentLead = null;

document.getElementById('backLink').href = `index.html?rep=${encodeURIComponent(rep)}`;

// --- Helpers ---

function diagnosisClass(state) {
  return ({
    'Invisible':     'nl-badge-invisible',
    'Outgunned':     'nl-badge-outgunned',
    'Emerging':      'nl-badge-emerging',
    'Undersignaled': 'nl-badge-undersignaled',
    'Contender':     'nl-badge-contender',
    'Anchor':        'nl-badge-anchor'
  })[state] || 'nl-badge-undersignaled';
}

function statusClass(status) {
  return ({
    'New Lead':    'nl-status-new',
    'Contacted':   'nl-status-contacted',
    'Replied':     'nl-status-replied',
    'Qualified':   'nl-status-qualified',
    'Call Booked': 'nl-status-call-booked',
    'Closed Won':  'nl-status-closed-won',
    'Closed Lost': 'nl-status-closed-lost'
  })[status] || 'nl-status-new';
}

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function get(lead, ...keys) {
  for (const k of keys) {
    if (lead[k] != null && lead[k] !== '') return lead[k];
  }
  return '';
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setInput(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

// --- Render ---

function render(lead) {
  currentLead = lead;
  document.title = (lead.businessName || 'Lead') + ' — NeoLocal';

  // Zone 1
  document.getElementById('leadName').textContent   = lead.businessName || 'Unnamed Lead';
  document.getElementById('leadMeta').textContent   = [lead.city, lead.category].filter(Boolean).join(' · ') || '—';
  document.getElementById('lastTouch').textContent  = fmtDate(lead.lastUpdatedAt);
  document.getElementById('nextAction').textContent = lead.activeTask
    ? lead.activeTask + (lead.taskDueAt ? ' · ' + fmtDate(lead.taskDueAt) : '')
    : '—';

  const diagBadge = document.getElementById('diagnosisBadge');
  if (lead.diagnosisState) {
    diagBadge.textContent = lead.diagnosisState;
    diagBadge.className   = 'nl-badge ' + diagnosisClass(lead.diagnosisState);
    diagBadge.hidden      = false;
  } else {
    diagBadge.hidden = true;
  }

  const statBadge = document.getElementById('statusBadge');
  statBadge.textContent = lead.status || 'New Lead';
  statBadge.className   = 'nl-badge ' + statusClass(lead.status);

  // Zone 2
  document.getElementById('marketPositionSummary').textContent =
    get(lead, 'marketPositionSummary', 'market_position_summary') || '—';
  document.getElementById('strategicGapSummary').textContent =
    get(lead, 'strategicGapSummary', 'strategic_gap_summary') || '—';

  // Zone 3
  const mmUrl = get(lead, 'marketMirrorUrl') || fetchMarketMirrorUrl(lead.leadId || leadId);
  document.getElementById('mirrorBtn').href = mmUrl;

  // Zone 4
  const outreach = get(lead, 'outreachMessage', 'outreach_message');
  document.getElementById('outreachMsg').textContent = outreach || '(No outreach message generated yet.)';

  const reply = get(lead, 'replyMessage', 'reply_message');
  const replySection = document.getElementById('replySection');
  if (reply) {
    document.getElementById('replyMsg').textContent = reply;
    replySection.hidden = false;
  } else {
    replySection.hidden = true;
  }

  // Zone 5
  const logEl  = document.getElementById('activityLog');
  const logRaw = get(lead, 'lastActivityLog', 'last_activity_log', 'notes');
  if (logRaw) {
    const entries = String(logRaw).split('\n').filter(l => l.trim());
    logEl.innerHTML = entries.map(e => `<li>${escHtml(e)}</li>`).join('') || '<li class="nl-text-gray">No activity yet.</li>';
  } else {
    logEl.innerHTML = '<li class="nl-text-gray">No activity logged yet.</li>';
  }

  // Zone 6: populate editable contact inputs
  setInput('editContactName',          get(lead, 'contactName'));
  setInput('editContactRole',          get(lead, 'contactRole'));
  setInput('editMainPhone',            get(lead, 'mainPhone', 'phone'));
  setInput('editMobilePhone',          get(lead, 'mobilePhone'));
  setInput('editMainEmail',            get(lead, 'mainEmail', 'email'));
  setInput('editSecondaryContactName', get(lead, 'secondaryContactName'));
  setInput('editSecondaryContactRole', get(lead, 'secondaryContactRole'));
  setInput('editSecondaryContactPhone',get(lead, 'secondaryContactPhone'));
  setInput('editSecondaryContactEmail',get(lead, 'secondaryContactEmail'));
  setInput('editSecondaryAddress',     get(lead, 'secondaryAddress', 'address'));

  renderReadonlyDetails(lead);
}

function renderReadonlyDetails(lead) {
  const groups = [
    {
      title: 'Operator Intel',
      fields: [
        ['Scale Band',       get(lead, 'operatorScaleBand')],
        ['Business Model',   get(lead, 'operatorBusinessModel')],
        ['Monthly Volume',   get(lead, 'operatorMonthlyVolume')],
        ['Service Capacity', get(lead, 'operatorServiceCapacity')],
        ['Locations',        get(lead, 'operatorLocationCount')],
        ['Notes',            get(lead, 'operatorContextNotes')]
      ]
    },
    {
      title: 'Scores & Signals',
      fields: [
        ['Reviews',     get(lead, 'reviews', 'reviews_count')],
        ['Rating',      get(lead, 'rating')],
        ['Priority',    get(lead, 'priorityBucket', 'priority_bucket')],
        ['Momentum',    get(lead, 'momentumState', 'momentum_state')],
        ['Undervalued', lead.isUndervalued ? 'Yes' : '']
      ]
    },
    {
      title: 'Task',
      fields: [
        ['Active Task', get(lead, 'activeTask')],
        ['Task Type',   get(lead, 'taskType')],
        ['Due At',      lead.taskDueAt ? fmtDate(lead.taskDueAt) : ''],
        ['Task Status', get(lead, 'taskStatus')]
      ]
    }
  ];

  document.getElementById('readonlyDetails').innerHTML = groups.map(g => {
    const items = g.fields.filter(([, v]) => v);
    if (!items.length) return '';
    return `
      <div class="nl-mb-24">
        <div class="nl-label nl-mb-8" style="color:var(--nl-navy);">${g.title}</div>
        <div class="nl-details-grid">
          ${items.map(([label, value]) => `
            <div>
              <div class="nl-label-field">${label}</div>
              <div class="nl-detail-value">${escHtml(String(value))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// --- Full payload helper (prevents partial overwrites) ---

function buildFullPayload(overrides) {
  const base = currentLead || {};
  return {
    leadId:                currentLead ? (currentLead.leadId || leadId) : leadId,
    contactName:           get(base, 'contactName'),
    contactRole:           get(base, 'contactRole'),
    mainPhone:             get(base, 'mainPhone', 'phone'),
    mobilePhone:           get(base, 'mobilePhone'),
    mainEmail:             get(base, 'mainEmail', 'email'),
    secondaryContactName:  get(base, 'secondaryContactName'),
    secondaryContactRole:  get(base, 'secondaryContactRole'),
    secondaryContactPhone: get(base, 'secondaryContactPhone'),
    secondaryContactEmail: get(base, 'secondaryContactEmail'),
    secondaryAddress:      get(base, 'secondaryAddress', 'address'),
    notes:                 get(base, 'notes'),
    ...overrides
  };
}

// --- Message helpers ---

function showMsg(text, type) {
  const el = document.getElementById('actionMsg');
  el.textContent   = text;
  el.className     = 'nl-alert' + (type ? ' nl-alert-' + type : '');
  el.style.display = text ? '' : 'none';
}

function showNotesMsg(text, type) {
  const el = document.getElementById('notesMsg');
  el.textContent   = text;
  el.className     = 'nl-alert' + (type ? ' nl-alert-' + type : '');
  el.style.display = text ? '' : 'none';
}

function showContactMsg(text, type) {
  const el = document.getElementById('contactMsg');
  el.textContent   = text;
  el.className     = 'nl-alert' + (type ? ' nl-alert-' + type : '');
  el.style.display = text ? '' : 'none';
}

// --- CRM actions ---

async function handleCrmAction(actionType, label) {
  const btn = document.querySelector(`[data-action="${actionType}"]`);
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  showMsg('');

  try {
    await crmAction(leadId, actionType);
    showMsg('Marked as ' + label + '.', 'success');
    const updated = await fetchLead(leadId);
    render(updated);
  } catch (err) {
    showMsg('Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

document.querySelectorAll('[data-action]').forEach(btn => {
  btn.addEventListener('click', () => handleCrmAction(btn.dataset.action, btn.dataset.label || btn.dataset.action));
});

// --- Copy to clipboard ---

document.getElementById('copyOutreach').addEventListener('click', function () {
  const text = document.getElementById('outreachMsg').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const orig = this.textContent;
    this.textContent = 'Copied!';
    setTimeout(() => { this.textContent = orig; }, 1500);
  });
});

// --- Save Notes ---

async function handleSaveNotes() {
  const btn = document.getElementById('saveNotesBtn');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  showNotesMsg('');

  const notesValue = document.getElementById('repNotesInput').value.trim();

  try {
    await updateLead(buildFullPayload({ notes: notesValue }));
    showNotesMsg('Notes saved.', 'success');
    document.getElementById('repNotesInput').value = '';
    const updated = await fetchLead(leadId);
    render(updated);
  } catch (err) {
    showNotesMsg('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

document.getElementById('saveNotesBtn').addEventListener('click', handleSaveNotes);

// --- Save Contact ---

async function handleSaveContact() {
  const btn = document.getElementById('saveContactBtn');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  showContactMsg('');

  const contactOverrides = {
    contactName:           document.getElementById('editContactName').value,
    contactRole:           document.getElementById('editContactRole').value,
    mainPhone:             document.getElementById('editMainPhone').value,
    mobilePhone:           document.getElementById('editMobilePhone').value,
    mainEmail:             document.getElementById('editMainEmail').value,
    secondaryContactName:  document.getElementById('editSecondaryContactName').value,
    secondaryContactRole:  document.getElementById('editSecondaryContactRole').value,
    secondaryContactPhone: document.getElementById('editSecondaryContactPhone').value,
    secondaryContactEmail: document.getElementById('editSecondaryContactEmail').value,
    secondaryAddress:      document.getElementById('editSecondaryAddress').value,
  };

  try {
    await updateLead(buildFullPayload(contactOverrides));
    showContactMsg('Contact info saved.', 'success');
    const updated = await fetchLead(leadId);
    render(updated);
  } catch (err) {
    showContactMsg('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

document.getElementById('saveContactBtn').addEventListener('click', handleSaveContact);

// --- Details toggle ---

document.getElementById('detailsToggle').addEventListener('click', function () {
  const body = document.getElementById('detailsBody');
  const open = body.classList.toggle('open');
  this.querySelector('.nl-toggle-icon').textContent = open ? '▲' : '▼';
});

// --- Init ---

async function init() {
  if (!leadId) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
    document.getElementById('content').innerHTML = '<div class="nl-empty">No leadId in URL.</div>';
    return;
  }

  try {
    const lead = await fetchLead(leadId);
    render(lead);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
    document.getElementById('content').innerHTML = `<div class="nl-alert nl-alert-error">Failed to load lead: ${err.message}</div>`;
  }
}

init();
