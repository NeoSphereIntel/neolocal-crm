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
  template.appUrl = APP.MARKET_MIRROR_WEBAPP_URL || ScriptApp.getService().getUrl();
  return template
    .evaluate()
    .setTitle('NeoLocal Rep Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderRepLeadPage_(leadId, rep) {
  var lead = getLeadRecordByLeadId_(leadId);
  var leadForMirror = JSON.parse(JSON.stringify(lead));
  var input = buildMarketMirrorInputFromLeadRow_(leadForMirror);
  var payload = buildMarketMirrorPayload_(input);
  var mirrorHtml = renderMarketMirrorHtml_(payload);
  var template = HtmlService.createTemplateFromFile('21_rep_lead');
  template.lead = lead;
  template.rep = rep || lead.assignedTo || '';
  template.appUrl = APP.MARKET_MIRROR_WEBAPP_URL || ScriptApp.getService().getUrl();
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
      rating: toNumber_(getCellByHeader_(row, idx, 'rating')),
      phone: getCellByHeader_(row, idx, 'phone'),
      email: getCellByHeader_(row, idx, 'email'),
      contactName:
        getCellByHeader_(row, idx, 'contact_name') ||
        getCellByHeader_(row, idx, 'owner_name') ||
        getCellByHeader_(row, idx, 'owner') ||
        '',
      lastUpdatedAt:
        getCellByHeader_(row, idx, 'updated_at') ||
        getCellByHeader_(row, idx, 'last_contact_at') ||
        getCellByHeader_(row, idx, 'date_added') ||
        '',
      activeTask: getCellByHeader_(row, idx, 'Active Task') || '',
      taskType: getCellByHeader_(row, idx, 'Task Type') || '',
      taskDueAt: formatDateTimeForInput_(getCellByHeader_(row, idx, 'Task Due At')),
      taskStatus: getCellByHeader_(row, idx, 'Task Status') || ''
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

        address: getCellByHeader_(row, idx, 'address') || '',
        website: getCellByHeader_(row, idx, 'website') || '',

        mainPhone:
          getCellByHeader_(row, idx, 'Main Phone') ||
          getCellByHeader_(row, idx, 'phone') ||
          '',

        mobilePhone:
          getCellByHeader_(row, idx, 'Mobile Phone') ||
          '',

        mainEmail:
          getCellByHeader_(row, idx, 'Main Email') ||
          getCellByHeader_(row, idx, 'email') ||
          '',

        contactName:
          getCellByHeader_(row, idx, 'Contact Name') ||
          getCellByHeader_(row, idx, 'contact_name') ||
          getCellByHeader_(row, idx, 'owner_name') ||
          getCellByHeader_(row, idx, 'owner') ||
          '',

        contactRole:
          getCellByHeader_(row, idx, 'Contact Role') ||
          '',

        secondaryContactName:
          getCellByHeader_(row, idx, 'Secondary Contact Name') ||
          '',

        secondaryContactRole:
          getCellByHeader_(row, idx, 'Secondary Contact Role') ||
          '',

        secondaryContactPhone:
          getCellByHeader_(row, idx, 'Secondary Contact Phone') ||
          '',

        secondaryContactEmail:
          getCellByHeader_(row, idx, 'Secondary Contact Email') ||
          '',

        secondaryAddress:
          getCellByHeader_(row, idx, 'Secondary Address') ||
          '',

        notes: getCellByHeader_(row, idx, 'crm_notes') || getCellByHeader_(row, idx, 'notes'),
        assignedTo: getCellByHeader_(row, idx, 'Assigned To'),
        lastUpdatedAt:
          getCellByHeader_(row, idx, 'updated_at') ||
          getCellByHeader_(row, idx, 'last_contact_at') ||
          getCellByHeader_(row, idx, 'date_added') ||
          '',
        activeTask: getCellByHeader_(row, idx, 'Active Task') || '',
        taskType: getCellByHeader_(row, idx, 'Task Type') || '',
        taskDueAt: formatDateTimeForInput_(getCellByHeader_(row, idx, 'Task Due At')),
        taskStatus: getCellByHeader_(row, idx, 'Task Status') || ''
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

function buildRepNoteEntry_(rep, noteText) {
  var tz = (APP && APP.TZ) ? APP.TZ : Session.getScriptTimeZone() || 'America/Montreal';
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  var who = String(rep || 'Rep').trim() || 'Rep';
  var body = String(noteText || '').trim();

  if (!body) return '';

  return '[' + stamp + '] ' + who + ': ' + body;
}

function saveRepLeadUpdate(
  leadId,
  status,
  newNote,
  rep,
  activeTask,
  taskType,
  taskDueAt,
  taskStatus,
  businessName,
  address,
  website,
  mainPhone,
  mobilePhone,
  mainEmail,
  contactName,
  contactRole,
  secondaryContactName,
  secondaryContactRole,
  secondaryContactPhone,
  secondaryContactEmail,
  secondaryAddress
) {
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
      var cleanStatus = String(status || '').trim();
      var cleanNewNote = String(newNote || '').trim();

      var cleanActiveTask = String(activeTask || '').trim();
      var cleanTaskType = String(taskType || '').trim();
      var cleanTaskDueAt = String(taskDueAt || '').trim();
      var cleanTaskStatus = String(taskStatus || '').trim();

      var cleanBusinessName = String(businessName || '').trim();
      var cleanAddress = String(address || '').trim();
      var cleanWebsite = String(website || '').trim();
      var cleanMainPhone = String(mainPhone || '').trim();
      var cleanMobilePhone = String(mobilePhone || '').trim();
      var cleanMainEmail = String(mainEmail || '').trim();
      var cleanContactName = String(contactName || '').trim();
      var cleanContactRole = String(contactRole || '').trim();
      var cleanSecondaryContactName = String(secondaryContactName || '').trim();
      var cleanSecondaryContactRole = String(secondaryContactRole || '').trim();
      var cleanSecondaryContactPhone = String(secondaryContactPhone || '').trim();
      var cleanSecondaryContactEmail = String(secondaryContactEmail || '').trim();
      var cleanSecondaryAddress = String(secondaryAddress || '').trim();

      var notesHeader = hasHeader_(idx, 'crm_notes') ? 'crm_notes' : (hasHeader_(idx, 'notes') ? 'notes' : '');
      var existingNotes = notesHeader ? String(getCellByHeader_(row, idx, notesHeader) || '').trim() : '';
      var appendedEntry = '';

      setCellByHeader_(sheet, r + 1, idx, 'status', cleanStatus);

      if (hasHeader_(idx, 'business_name')) {
        setCellByHeader_(sheet, r + 1, idx, 'business_name', cleanBusinessName);
      }

      if (hasHeader_(idx, 'address')) {
        setCellByHeader_(sheet, r + 1, idx, 'address', cleanAddress);
      }

      if (hasHeader_(idx, 'website')) {
        setCellByHeader_(sheet, r + 1, idx, 'website', cleanWebsite);
      }

      if (hasHeader_(idx, 'Main Phone')) {
        setCellByHeader_(sheet, r + 1, idx, 'Main Phone', cleanMainPhone);
      }
      if (hasHeader_(idx, 'phone')) {
        setCellByHeader_(sheet, r + 1, idx, 'phone', cleanMainPhone);
      }

      if (hasHeader_(idx, 'Mobile Phone')) {
        setCellByHeader_(sheet, r + 1, idx, 'Mobile Phone', cleanMobilePhone);
      }

      if (hasHeader_(idx, 'Main Email')) {
        setCellByHeader_(sheet, r + 1, idx, 'Main Email', cleanMainEmail);
      }
      if (hasHeader_(idx, 'email')) {
        setCellByHeader_(sheet, r + 1, idx, 'email', cleanMainEmail);
      }

      if (hasHeader_(idx, 'Contact Name')) {
        setCellByHeader_(sheet, r + 1, idx, 'Contact Name', cleanContactName);
      }
      if (hasHeader_(idx, 'contact_name')) {
        setCellByHeader_(sheet, r + 1, idx, 'contact_name', cleanContactName);
      }

      if (hasHeader_(idx, 'Contact Role')) {
        setCellByHeader_(sheet, r + 1, idx, 'Contact Role', cleanContactRole);
      }

      if (hasHeader_(idx, 'Secondary Contact Name')) {
        setCellByHeader_(sheet, r + 1, idx, 'Secondary Contact Name', cleanSecondaryContactName);
      }

      if (hasHeader_(idx, 'Secondary Contact Role')) {
        setCellByHeader_(sheet, r + 1, idx, 'Secondary Contact Role', cleanSecondaryContactRole);
      }

      if (hasHeader_(idx, 'Secondary Contact Phone')) {
        setCellByHeader_(sheet, r + 1, idx, 'Secondary Contact Phone', cleanSecondaryContactPhone);
      }

      if (hasHeader_(idx, 'Secondary Contact Email')) {
        setCellByHeader_(sheet, r + 1, idx, 'Secondary Contact Email', cleanSecondaryContactEmail);
      }

      if (hasHeader_(idx, 'Secondary Address')) {
        setCellByHeader_(sheet, r + 1, idx, 'Secondary Address', cleanSecondaryAddress);
      }

      if (hasHeader_(idx, 'Active Task')) {
        setCellByHeader_(sheet, r + 1, idx, 'Active Task', cleanActiveTask);
      }

      if (hasHeader_(idx, 'Task Type')) {
        setCellByHeader_(sheet, r + 1, idx, 'Task Type', cleanTaskType);
      }

      if (hasHeader_(idx, 'Task Due At')) {
        setCellByHeader_(sheet, r + 1, idx, 'Task Due At', cleanTaskDueAt);
      }

      if (!cleanTaskStatus && cleanActiveTask) {
        cleanTaskStatus = 'Open';
      }

      if (hasHeader_(idx, 'Task Status')) {
        setCellByHeader_(sheet, r + 1, idx, 'Task Status', cleanTaskStatus);
      }

      if (cleanNewNote) {
        appendedEntry = buildRepNoteEntry_(rep, cleanNewNote);
        if (notesHeader) {
          var mergedNotes = existingNotes ? (existingNotes + '\n' + appendedEntry) : appendedEntry;
          setCellByHeader_(sheet, r + 1, idx, notesHeader, mergedNotes);
          existingNotes = mergedNotes;
        }
      }

      if (hasHeader_(idx, 'updated_at')) {
        setCellByHeader_(sheet, r + 1, idx, 'updated_at', new Date());
      }

      if (cleanStatus === 'Contacted' && hasHeader_(idx, 'last_contact_at')) {
        setCellByHeader_(sheet, r + 1, idx, 'last_contact_at', new Date());
      }

      return {
        ok: true,
        leadId: leadId,
        status: cleanStatus,
        notes: existingNotes,
        appendedEntry: appendedEntry,
        activeTask: cleanActiveTask,
        taskType: cleanTaskType,
        taskDueAt: cleanTaskDueAt,
        taskStatus: cleanTaskStatus,
        businessName: cleanBusinessName,
        address: cleanAddress,
        website: cleanWebsite,
        mainPhone: cleanMainPhone,
        mobilePhone: cleanMobilePhone,
        mainEmail: cleanMainEmail,
        contactName: cleanContactName,
        contactRole: cleanContactRole,
        secondaryContactName: cleanSecondaryContactName,
        secondaryContactRole: cleanSecondaryContactRole,
        secondaryContactPhone: cleanSecondaryContactPhone,
        secondaryContactEmail: cleanSecondaryContactEmail,
        secondaryAddress: cleanSecondaryAddress
      };
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

function formatDateTimeForInput_(value) {
  if (!value) return '';

  try {
    var date = new Date(value);
    if (isNaN(date)) return '';

    var tz = Session.getScriptTimeZone() || 'America/Montreal';

    return Utilities.formatDate(date, tz, "yyyy-MM-dd'T'HH:mm");
  } catch (e) {
    return '';
  }
}