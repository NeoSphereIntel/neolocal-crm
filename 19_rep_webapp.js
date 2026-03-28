function doGet(e) {
  try {
    var rep = e && e.parameter ? (e.parameter.rep || '') : '';
    var leadId = e && e.parameter ? (e.parameter.leadId || '') : '';

    if (leadId) {
      return renderRepLeadPage_(leadId, rep);
    }

    if (rep) {
      return renderRepDashboardPage_(rep);
    }

    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial;padding:24px;">Missing rep or leadId parameter.</div>'
    ).setTitle('NeoLocal');
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial;padding:24px;">' +
      '<h2>Lead Page Error</h2>' +
      '<pre>' + String(err && err.message ? err.message : err) + '</pre>' +
      '</div>'
    ).setTitle('NeoLocal Error');
  }
}

function renderRepDashboardPage_(rep) {
  var template = HtmlService.createTemplateFromFile('20_rep_dashboard');
  template.rep = rep;
  template.leads = getAssignedLeadsForRep_(rep);
  template.appUrl = ScriptApp.getService().getUrl();

  return template
    .evaluate()
    .setTitle('NeoLocal Rep Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderRepLeadPage_(leadId, rep) {
  var lead = getLeadRecordByLeadId_(leadId);
  var input = buildMarketMirrorInputFromLeadRow_(lead);
  var payload = buildMarketMirrorPayload_(input);
  var mirrorHtml = renderMarketMirrorHtml_(payload);

  var template = HtmlService.createTemplateFromFile('21_rep_lead');
  template.lead = lead;
  template.rep = rep || lead.assignedTo || '';
  template.appUrl = ScriptApp.getService().getUrl();
  template.mirrorHtml = mirrorHtml;

  return template
    .evaluate()
    .setTitle('NeoLocal Lead')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAssignedLeadsForRep_(rep) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  var headers = values[0];
  var idx = buildHeaderIndex_(headers);
  var out = [];
  var repNorm = normalizeHeaderKey_(rep);

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var assignedTo = normalizeHeaderKey_(getCellByHeader_(row, idx, 'Assigned To'));

    if (assignedTo !== repNorm) continue;

    out.push({
      leadId: getCellByHeader_(row, idx, 'lead_id'),
      businessName: getCellByHeader_(row, idx, 'business_name'),
      city: getCellByHeader_(row, idx, 'city'),
      category: getCellByHeader_(row, idx, 'category'),
      status: getCellByHeader_(row, idx, 'status'),
      reviews: toNumber_(getCellByHeader_(row, idx, 'reviews_count')),
      rating: toNumber_(getCellByHeader_(row, idx, 'rating'))
    });
  }

  return out;
}

function getLeadRecordByLeadId_(leadId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) throw new Error('Leads Master is empty.');

  var headers = values[0];
  var idx = buildHeaderIndex_(headers);
  var leadIdNorm = String(leadId || '').trim();

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var rowLeadId = String(getCellByHeader_(row, idx, 'lead_id') || '').trim();

    if (rowLeadId === leadIdNorm) {
      return {
        rowNumber: r + 1,
        leadId: rowLeadId,
        businessName: getCellByHeader_(row, idx, 'business_name'),
        city: getCellByHeader_(row, idx, 'city'),
        category: getCellByHeader_(row, idx, 'category'),
        status: getCellByHeader_(row, idx, 'status'),
        reviews: toNumber_(getCellByHeader_(row, idx, 'reviews_count')),
        rating: toNumber_(getCellByHeader_(row, idx, 'rating')),
        notes: getCellByHeader_(row, idx, 'crm_notes') || getCellByHeader_(row, idx, 'notes'),
        assignedTo: getCellByHeader_(row, idx, 'Assigned To')
      };
    }
  }

  throw new Error('Lead not found: ' + leadId);
}

function buildMarketMirrorInputFromLeadRow_(lead) {
  return {
    lead_id: lead.leadId,
    vertical_key: detectVerticalFromCategory_(lead.category),
    business_name: lead.businessName,
    city: lead.city,
    reviews: toNumber_(lead.reviews),
    rating: toNumber_(lead.rating),
    category: lead.category || '',
    source: 'rep_webapp'
  };
}

function detectVerticalFromCategory_(category) {
  var c = String(category || '').toLowerCase();
  if (c.indexOf('auto') !== -1 || c.indexOf('car') !== -1 || c.indexOf('dealer') !== -1) return 'auto_retail';
  if (c.indexOf('hvac') !== -1) return 'hvac';
  if (c.indexOf('roof') !== -1) return 'roofing';
  return 'auto_retail';
}

function saveRepLeadUpdate(leadId, status, notes) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) throw new Error('Leads Master is empty.');

  var headers = values[0];
  var idx = buildHeaderIndex_(headers);
  var leadIdNorm = String(leadId || '').trim();

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var rowLeadId = String(getCellByHeader_(row, idx, 'lead_id') || '').trim();

    if (rowLeadId === leadIdNorm) {
      setCellByHeader_(sheet, r + 1, idx, 'status', status || '');

      if (hasHeader_(idx, 'crm_notes')) {
        setCellByHeader_(sheet, r + 1, idx, 'crm_notes', notes || '');
      } else if (hasHeader_(idx, 'notes')) {
        setCellByHeader_(sheet, r + 1, idx, 'notes', notes || '');
      }

      if ((status || '') === 'Contacted' && hasHeader_(idx, 'last_contact_at')) {
        setCellByHeader_(sheet, r + 1, idx, 'last_contact_at', new Date());
      }

      return { ok: true, leadId: leadId, status: status };
    }
  }

  throw new Error('Lead not found: ' + leadId);
}

function buildHeaderIndex_(headers) {
  var idx = {};
  for (var i = 0; i < headers.length; i++) {
    idx[normalizeHeaderKey_(headers[i])] = i;
  }
  return idx;
}

function normalizeHeaderKey_(value) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getCellByHeader_(row, idx, headerName) {
  var key = normalizeHeaderKey_(headerName);
  if (idx[key] === undefined) return '';
  return row[idx[key]];
}

function setCellByHeader_(sheet, rowNumber, idx, headerName, value) {
  var key = normalizeHeaderKey_(headerName);
  if (idx[key] === undefined) return;
  sheet.getRange(rowNumber, idx[key] + 1).setValue(value);
}

function hasHeader_(idx, headerName) {
  return idx[normalizeHeaderKey_(headerName)] !== undefined;
}

function toNumber_(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : n;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}