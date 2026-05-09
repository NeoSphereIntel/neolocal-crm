import { searchBusiness, addLead } from './api.js';

const params = new URLSearchParams(location.search);
const rep    = params.get('rep') || '';

document.getElementById('backLink').href = `index.html?rep=${encodeURIComponent(rep)}`;

// --- Search ---

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

async function doSearch() {
  const identifier = document.getElementById('searchInput').value.trim();
  if (!identifier) return;

  const btn = document.getElementById('searchBtn');
  btn.disabled    = true;
  btn.textContent = 'Looking up…';
  showSearchMsg('');
  document.getElementById('resultsPanel').hidden = true;

  try {
    const result = await searchBusiness(identifier);
    renderResult(result);
    document.getElementById('resultsPanel').hidden = false;
  } catch (err) {
    showSearchMsg('Error: ' + err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Look Up';
  }
}

function renderResult(result) {
  document.getElementById('resultsList').innerHTML = `
    <div class="nl-result-card nl-selected">
      <div class="nl-result-name">${escHtml(result.businessName || 'Unknown')}</div>
      <div class="nl-result-meta">${escHtml([result.address, result.category].filter(Boolean).join(' · '))}</div>
      ${(result.rating || result.reviews) ? `
        <div class="nl-result-meta nl-mt-4">
          ${result.rating ? '★ ' + result.rating : ''}
          ${result.reviews ? '· ' + result.reviews + ' reviews' : ''}
        </div>` : ''}
    </div>
  `;
  populateForm(result);
}

function populateForm(result) {
  setVal('placeId',      result.placeId);
  setVal('businessName', result.businessName);
  setVal('category',     result.category);
  setVal('city',         result.city);
  setVal('address',      result.address);
  setVal('website',      result.website);
  setVal('mainPhone',    result.mainPhone);
  document.getElementById('formSection').hidden = false;
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value != null && value !== '') el.value = value;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showSearchMsg(text, type) {
  const el = document.getElementById('searchMsg');
  el.textContent   = text;
  el.className     = 'nl-alert' + (type ? ' nl-alert-' + type : '');
  el.style.display = text ? '' : 'none';
}

function showFormMsg(text, type) {
  const el = document.getElementById('formMsg');
  el.textContent   = text;
  el.className     = 'nl-alert' + (type ? ' nl-alert-' + type : '');
  el.style.display = text ? '' : 'none';
}

// --- Submit ---

document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Saving…';
  showFormMsg('');

  const payload = {
    rep,
    place_identifier:          getVal('placeId'),
    business_name:             getVal('businessName'),
    category:                  getVal('category'),
    city:                      getVal('city'),
    address:                   getVal('address'),
    website:                   getVal('website'),
    main_phone:                getVal('mainPhone'),
    main_email:                getVal('mainEmail'),
    contact_name:              getVal('contactName'),
    contact_role:              getVal('contactRole'),
    operator_scale_band:       getVal('operatorScaleBand'),
    operator_business_model:   getVal('operatorBusinessModel'),
    operator_monthly_volume:   getVal('operatorMonthlyVolume'),
    operator_service_capacity: getVal('operatorServiceCapacity'),
    operator_location_count:   getVal('operatorLocationCount'),
    operator_context_notes:    getVal('operatorContextNotes'),
    notes:                     getVal('notes'),
    active_task:               getVal('activeTask'),
    task_type:                 getVal('taskType'),
    task_due_at:               getVal('taskDueAt'),
    task_status:               ''
  };

  try {
    const result = await addLead(payload);
    if (result && result.leadId) {
      location.href = `lead.html?leadId=${encodeURIComponent(result.leadId)}&rep=${encodeURIComponent(rep)}`;
    } else {
      showFormMsg('Lead saved but no lead ID was returned.', 'error');
      btn.disabled    = false;
      btn.textContent = 'Add Lead';
    }
  } catch (err) {
    showFormMsg('Error: ' + err.message, 'error');
    btn.disabled    = false;
    btn.textContent = 'Add Lead';
  }
});
