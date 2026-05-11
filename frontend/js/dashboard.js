import { fetchLeads, bulkAssignLeadStatus } from './api.js';

const params  = new URLSearchParams(location.search);
const rep     = params.get('rep') || '';

// --- Helpers ---

function diagnosisClass(state) {
  return ({
    'Ghost':         'nl-badge-invisible',
    'Invisible':     'nl-badge-invisible',
    'Outgunned':     'nl-badge-outgunned',
    'Underdog':      'nl-badge-emerging',
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

function taskUrgency(lead) {
  if (!lead.taskDueAt || lead.taskStatus === 'Completed') return 0;
  const due = new Date(lead.taskDueAt);
  if (isNaN(due)) return 0;
  const diffDays = (due - Date.now()) / 86400000;
  if (diffDays < 0) return 3;
  if (diffDays < 1) return 2;
  if (diffDays < 3) return 1;
  return 0;
}

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function leadUrl(leadId) {
  return `lead.html?leadId=${encodeURIComponent(leadId)}&rep=${encodeURIComponent(rep)}`;
}

// --- Stats ---

function computeStats(leads) {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  let followUpToday = 0, untouched = 0, inPipeline = 0;
  for (const l of leads) {
    if (l.taskDueAt && l.taskStatus !== 'Done') {
      const due = new Date(l.taskDueAt);
      if (!isNaN(due) && due < tomorrow) followUpToday++;
    }
    if (!l.status || l.status === 'New Lead') untouched++;
    if (l.status && l.status !== 'New Lead' && l.status !== 'Closed Won' && l.status !== 'Closed Lost') inPipeline++;
  }
  return { total: leads.length, followUpToday, untouched, inPipeline };
}

function renderStats(stats) {
  document.getElementById('statsBar').innerHTML = [
    { value: stats.total,          label: 'Total Leads' },
    { value: stats.followUpToday,  label: 'Follow-Up Today' },
    { value: stats.untouched,      label: 'Untouched' },
    { value: stats.inPipeline,     label: 'In Pipeline' }
  ].map(s => `
    <div class="nl-stat-card">
      <div class="nl-stat-value">${s.value}</div>
      <div class="nl-stat-label">${s.label}</div>
    </div>
  `).join('');
}

// --- Action queue ---

function urgencyLabel(lead) {
  const u = taskUrgency(lead);
  if (u === 3) return '<span style="color:#bd0e20;font-weight:700;">OVERDUE</span>';
  if (u === 2) return '<span style="color:#92720a;font-weight:700;">Due Today</span>';
  if (lead.taskDueAt) return 'Due ' + fmtDate(lead.taskDueAt);
  return 'No task';
}

function renderLeadCard(lead) {
  const diag  = lead.diagnosisState;
  const stat  = lead.status || 'New Lead';
  const summ  = lead.marketPositionSummary || lead.market_position_summary || '';
  return `
    <a class="nl-lead-card" href="${leadUrl(lead.leadId)}">
      <div class="nl-lead-card-badges">
        ${diag ? `<span class="nl-badge ${diagnosisClass(diag)}">${diag}</span>` : ''}
        <span class="nl-badge ${statusClass(stat)}">${stat}</span>
      </div>
      <div class="nl-lead-card-name">${lead.businessName || 'Unnamed'}</div>
      <div class="nl-lead-card-meta">${lead.city || '—'} · ${lead.category || '—'}</div>
      ${summ ? `<div class="nl-lead-card-summary">${truncate(summ, 120)}</div>` : ''}
      <div class="nl-lead-card-footer">
        <span>${urgencyLabel(lead)}</span>
        <span>Last touch: ${fmtDate(lead.lastUpdatedAt)}</span>
      </div>
    </a>
  `;
}

function renderActionQueue(leads) {
  const sorted = [...leads]
    .sort((a, b) => taskUrgency(b) - taskUrgency(a) || new Date(b.lastUpdatedAt || 0) - new Date(a.lastUpdatedAt || 0))
    .slice(0, 8);

  const el = document.getElementById('actionQueue');
  el.innerHTML = sorted.length ? sorted.map(renderLeadCard).join('') : '<div class="nl-empty">No leads yet.</div>';
}

// --- Full list table ---

let allLeads    = [];
let sortCol     = 'businessName';
let sortDir     = 1;
const selectedIds = new Set();

function escAttr(str) { return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  if (!bar) return;
  const count = selectedIds.size;
  if (count === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = '';
    document.getElementById('bulkCount').textContent =
      count + ' lead' + (count === 1 ? '' : 's') + ' selected';
  }
}

const COLS = [
  { key: 'businessName',  label: 'Business' },
  { key: 'city',          label: 'City' },
  { key: 'category',      label: 'Category' },
  { key: 'diagnosisState',label: 'Diagnosis' },
  { key: 'status',        label: 'Status' },
  { key: 'priorityBucket',label: 'Priority' },
  { key: 'lastUpdatedAt', label: 'Last Touch' }
];

function filteredLeads() {
  const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  let rows = allLeads.filter(l =>
    !q ||
    (l.businessName || '').toLowerCase().includes(q) ||
    (l.city || '').toLowerCase().includes(q) ||
    (l.category || '').toLowerCase().includes(q)
  );
  rows.sort((a, b) => {
    const av = String(a[sortCol] || '');
    const bv = String(b[sortCol] || '');
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });
  return rows;
}

function renderTable(leads) {
  const wrap = document.getElementById('tableWrap');
  if (!leads.length) {
    wrap.innerHTML = '<div class="nl-empty">No results match your search.</div>';
    return;
  }

  const checkTh = '<th class="nl-th-check"><input type="checkbox" id="checkAll" title="Select all"></th>';
  const ths = checkTh + COLS.map(c => {
    const cls = c.key === sortCol ? 'sort-' + (sortDir === 1 ? 'asc' : 'desc') : '';
    return `<th data-col="${c.key}" class="${cls}">${c.label}</th>`;
  }).join('');

  const trs = leads.map(l => {
    const checked = selectedIds.has(l.leadId) ? 'checked' : '';
    return `
      <tr data-lead-id="${escAttr(l.leadId)}">
        <td class="nl-td-check"><input type="checkbox" class="nl-row-check" data-lead-id="${escAttr(l.leadId)}" ${checked}></td>
        <td><strong>${l.businessName || '—'}</strong></td>
        <td>${l.city || '—'}</td>
        <td>${l.category || '—'}</td>
        <td>${l.diagnosisState ? `<span class="nl-badge ${diagnosisClass(l.diagnosisState)}">${l.diagnosisState}</span>` : '—'}</td>
        <td><span class="nl-badge ${statusClass(l.status)}">${l.status || 'New Lead'}</span></td>
        <td>${l.priorityBucket || '—'}</td>
        <td>${fmtDate(l.lastUpdatedAt)}</td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <div class="nl-table-wrap">
      <table class="nl-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </div>
  `;

  // Sort headers
  wrap.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      sortDir = col === sortCol ? -sortDir : 1;
      sortCol = col;
      renderTable(filteredLeads());
    });
  });

  // Row click — navigate unless clicking the checkbox cell
  wrap.querySelectorAll('tbody tr[data-lead-id]').forEach(tr => {
    tr.addEventListener('click', e => {
      if (!e.target.closest('.nl-td-check')) {
        location.href = leadUrl(tr.dataset.leadId);
      }
    });
  });

  // Select-all checkbox
  const checkAll = wrap.querySelector('#checkAll');
  if (checkAll) {
    checkAll.addEventListener('change', () => {
      wrap.querySelectorAll('.nl-row-check').forEach(cb => {
        cb.checked = checkAll.checked;
        if (checkAll.checked) selectedIds.add(cb.dataset.leadId);
        else selectedIds.delete(cb.dataset.leadId);
      });
      updateBulkBar();
    });
  }

  // Individual row checkboxes
  wrap.querySelectorAll('.nl-row-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedIds.add(cb.dataset.leadId);
      else selectedIds.delete(cb.dataset.leadId);
      updateBulkBar();
    });
  });

  updateBulkBar();
}

// --- Init ---

async function init() {
  document.getElementById('repName').textContent = rep ? 'Rep: ' + rep : '';
  document.getElementById('addLeadLink').href = `add.html?rep=${encodeURIComponent(rep)}`;

  if (!rep) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
    document.getElementById('content').innerHTML = '<div class="nl-empty">Add <code>?rep=yourname</code> to the URL to load your dashboard.</div>';
    return;
  }

  try {
    allLeads = await fetchLeads(rep);
    renderStats(computeStats(allLeads));
    renderActionQueue(allLeads);
    renderTable(filteredLeads());
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = '';
    document.getElementById('errorMsg').textContent = 'Failed to load leads: ' + err.message;
    document.getElementById('errorMsg').style.display = '';
  }
}

document.getElementById('searchInput').addEventListener('input', () => renderTable(filteredLeads()));

// --- Bulk assign ---

document.getElementById('bulkApplyBtn').addEventListener('click', async () => {
  const status = document.getElementById('bulkStatusSelect').value;
  if (!status) { alert('Select a stage to apply.'); return; }
  const ids = [...selectedIds];
  const btn = document.getElementById('bulkApplyBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await bulkAssignLeadStatus(ids, status);
    selectedIds.clear();
    allLeads = await fetchLeads(rep);
    renderStats(computeStats(allLeads));
    renderActionQueue(allLeads);
    renderTable(filteredLeads());
  } catch (err) {
    alert('Bulk assign failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Apply';
    document.getElementById('bulkStatusSelect').value = '';
  }
});

document.getElementById('bulkClearBtn').addEventListener('click', () => {
  selectedIds.clear();
  document.querySelectorAll('.nl-row-check').forEach(cb => { cb.checked = false; });
  const all = document.getElementById('checkAll');
  if (all) all.checked = false;
  updateBulkBar();
});

init();
