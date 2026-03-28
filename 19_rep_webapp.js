function doGet(e) {
  var rep = e && e.parameter ? (e.parameter.rep || '') : '';
  var leadId = e && e.parameter ? (e.parameter.leadId || '') : '';

  if (leadId) {
    return renderRepLeadPage_(leadId);
  }

  if (rep) {
    return renderRepDashboardPage_(rep);
  }

  return HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;padding:24px;">Missing rep or leadId parameter.</div>'
  ).setTitle('NeoLocal');
}

function renderRepDashboardPage_(rep) {
  var template = HtmlService.createTemplateFromFile('20_rep_dashboard');
  template.rep = rep;
  template.leads = getAssignedLeadsForRep_(rep);

  return template
    .evaluate()
    .setTitle('NeoLocal Rep Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderRepLeadPage_(leadId) {
  var lead = getLeadRecordByLeadId_(leadId);
  var input = buildMarketMirrorInputFromLeadRow_(lead);
  var payload = buildMarketMirrorPayload_(input);
  var mirrorHtml = renderMarketMirrorHtml_(payload);

  var template = HtmlService.createTemplateFromFile('21_rep_lead');
  template.lead = lead;
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

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var assignedTo = String(row[idx['Assigned To']] || '').trim().toLowerCase();
    if (assignedTo !== String(rep || '').trim().toLowerCase()) continue;

    out.push({
      leadId: row[idx['Lead ID']] || '',
      businessName: row[idx['Business Name']] || '',
      city: row[idx['City / Area']] || '',
      category: row[idx['Category']] || '',
      status: row[idx['Status']] || '',
      reviews: Number(row[idx['Reviews']] || 0),
      rating: Number(row[idx['Rating']] || 0)
    });
  }

  return out;
}

function getLeadRecordByLeadId_(leadId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idx = buildHeaderIndex_(headers);

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (String(row[idx['Lead ID']] || '').trim() === String(leadId || '').trim()) {
      return {
        rowNumber: r + 1,
        leadId: row[idx['Lead ID']] || '',
        businessName: row[idx['Business Name']] || '',
        city: row[idx['City / Area']] || '',
        category: row[idx['Category']] || '',
        status: row[idx['Status']] || '',
        reviews: Number(row[idx['Reviews']] || 0),
        rating: Number(row[idx['Rating']] || 0),
        notes: row[idx['Notes']] || '',
        assignedTo: row[idx['Assigned To']] || ''
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
    reviews: Number(lead.reviews || 0),
    rating: Number(lead.rating || 0),
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

function buildHeaderIndex_(headers) {
  var idx = {};
  for (var i = 0; i < headers.length; i++) {
    idx[String(headers[i]).trim()] = i;
  }
  return idx;
}

function saveRepLeadUpdate(leadId, status, notes) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idx = buildHeaderIndex_(headers);

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (String(row[idx['Lead ID']] || '').trim() === String(leadId || '').trim()) {
      if (idx['Status'] !== undefined) {
        sheet.getRange(r + 1, idx['Status'] + 1).setValue(status || '');
      }
      if (idx['Notes'] !== undefined) {
        sheet.getRange(r + 1, idx['Notes'] + 1).setValue(notes || '');
      }
      if (idx['Last Contact Date'] !== undefined && status === 'Contacted') {
        sheet.getRange(r + 1, idx['Last Contact Date'] + 1).setValue(new Date());
      }
      return { ok: true, leadId: leadId, status: status };
    }
  }

  throw new Error('Lead not found: ' + leadId);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}