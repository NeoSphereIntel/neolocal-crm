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
      leadId: row[idx['lead_id']] || '',
      businessName: row[idx['business_name']] || '',
      city: row[idx['city']] || '',
      category: row[idx['category']] || '',
      status: row[idx['status']] || '',
      reviews: Number(row[idx['reviews_count']] || 0),
      rating: Number(row[idx['rating']] || 0)
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
    if (String(row[idx['lead_id']] || '').trim() === String(leadId || '').trim()) {
      return {
        rowNumber: r + 1,
        leadId: row[idx['lead_id']] || '',
        businessName: row[idx['business_name']] || '',
        city: row[idx['city']] || '',
        category: row[idx['category']] || '',
        status: row[idx['status']] || '',
        reviews: Number(row[idx['reviews_count']] || 0),
        rating: Number(row[idx['rating']] || 0),
        notes: row[idx['crm_notes']] || row[idx['notes']] || '',
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

function saveRepLeadUpdate(leadId, status, notes) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idx = buildHeaderIndex_(headers);

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (String(row[idx['lead_id']] || '').trim() === String(leadId || '').trim()) {
      if (idx['status'] !== undefined) {
        sheet.getRange(r + 1, idx['status'] + 1).setValue(status || '');
      }
      if (idx['crm_notes'] !== undefined) {
        sheet.getRange(r + 1, idx['crm_notes'] + 1).setValue(notes || '');
      } else if (idx['notes'] !== undefined) {
        sheet.getRange(r + 1, idx['notes'] + 1).setValue(notes || '');
      }
      if (idx['last_contact_at'] !== undefined && status === 'Contacted') {
        sheet.getRange(r + 1, idx['last_contact_at'] + 1).setValue(new Date());
      }
      return { ok: true, leadId: leadId, status: status };
    }
  }

  throw new Error('Lead not found: ' + leadId);
}