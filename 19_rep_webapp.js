function doGet(e) {
  try {
    var rep = e && e.parameter ? (e.parameter.rep || '') : '';
    var leadId = e && e.parameter ? (e.parameter.leadId || '') : '';
    var mode = e && e.parameter ? (e.parameter.mode || '') : '';

    if (mode === 'add') {
      return renderRepAddLeadPage_(rep);
    }

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

function renderRepAddLeadPage_(rep) {
  var template = HtmlService.createTemplateFromFile('22_rep_add_lead');
  template.rep = rep || '';
  template.appUrl = APP.MARKET_MIRROR_WEBAPP_URL || ScriptApp.getService().getUrl();
  return template
    .evaluate()
    .setTitle('NeoLocal Add Lead')
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
        getCellByHeader_(row, idx, 'created_at') ||
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
        lead_id: rowLeadId,
        businessName: getCellByHeader_(row, idx, 'business_name'),
        city: getCellByHeader_(row, idx, 'city'),
        category: getCellByHeader_(row, idx, 'category'),
        status: getCellByHeader_(row, idx, 'status'),
        reviews: toNumber_(getCellByHeader_(row, idx, 'reviews_count')),
        rating: toNumber_(getCellByHeader_(row, idx, 'rating')),

        address: getCellByHeader_(row, idx, 'address') || '',
        website: getCellByHeader_(row, idx, 'website') || '',
        placeId: getCellByHeader_(row, idx, 'place_id') || '',

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
          getCellByHeader_(row, idx, 'created_at') ||
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
    lead_id: lead.leadId || lead.lead_id,
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

function lookupManualLeadFromSerpApi(identifier) {
  var parsed = parseMapsIdentifier_(identifier);
  if (!parsed.value) {
    throw new Error('Paste a Google Maps URL or a valid Place ID.');
  }

  if (parsed.type !== 'place_id') {
    throw new Error('Could not extract a valid Place ID from that input. Use a Maps URL containing place_id, or paste the Place ID directly.');
  }

  var raw = fetchSerpApiPlaceByPlaceId_(parsed.value);
  var normalized = normalizeSerpApiPlaceDetails_(raw);

  return {
    ok: true,
    inputType: parsed.type,
    placeId: normalized.placeId,
    businessName: normalized.businessName,
    category: normalized.category,
    address: normalized.address,
    city: normalized.city,
    website: normalized.website,
    mainPhone: normalized.mainPhone,
    rating: normalized.rating,
    reviews: normalized.reviews,
    source: 'manual_serpapi'
  };
}

function saveManualLead(
  rep,
  placeIdentifier,
  businessName,
  category,
  city,
  address,
  website,
  mainPhone,
  mainEmail,
  contactName,
  contactRole,
  notes,
  activeTask,
  taskType,
  taskDueAt,
  taskStatus
) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads Master');
  if (!sheet) throw new Error('Leads Master sheet not found.');

  var values = sheet.getDataRange().getValues();
  if (!values || !values.length) throw new Error('Leads Master is missing headers.');

  var headers = values[0];
  var idx = buildHeaderIndex_(headers);
  var now = new Date();

  var parsed = parseMapsIdentifier_(placeIdentifier);
  if (!parsed.value || parsed.type !== 'place_id') {
    throw new Error('A valid Place ID is required for manual SerpAPI lead creation.');
  }

  var serpRaw = fetchSerpApiPlaceByPlaceId_(parsed.value);
  var serpLead = normalizeSerpApiPlaceDetails_(serpRaw);

  var finalBusinessName = String(businessName || serpLead.businessName || '').trim();
  var finalCategory = String(category || serpLead.category || '').trim();
  var finalCity = String(city || serpLead.city || '').trim();
  var finalAddress = String(address || serpLead.address || '').trim();
  var finalWebsite = String(website || serpLead.website || '').trim();
  var finalMainPhone = String(mainPhone || serpLead.mainPhone || '').trim();
  var finalMainEmail = String(mainEmail || '').trim();
  var finalContactName = String(contactName || '').trim();
  var finalContactRole = String(contactRole || '').trim();
  var finalNotes = String(notes || '').trim();
  var finalActiveTask = String(activeTask || '').trim();
  var finalTaskType = String(taskType || '').trim();
  var finalTaskDueAt = String(taskDueAt || '').trim();
  var finalTaskStatus = String(taskStatus || '').trim();

  if (!finalBusinessName) throw new Error('Business name is required.');
  if (!finalCity) throw new Error('City is required.');
  if (!finalCategory) throw new Error('Category is required.');

  var leadId = generateManualLeadId_();
  var leadSignature = makeManualLeadSignature_(finalBusinessName, finalCity, finalCategory);

  var existingLeadId = findLeadByPlaceIdOrSignature_(sheet, idx, serpLead.placeId, leadSignature);
  if (existingLeadId) {
    throw new Error('Lead already exists: ' + existingLeadId);
  }

  if (!finalTaskStatus && finalActiveTask) {
    finalTaskStatus = 'Open';
  }

  var noteEntry = finalNotes ? buildRepNoteEntry_(rep, finalNotes) : '';

  var leadObj = {};
  leadObj.lead_id = leadId;
  leadObj.search_id = '';
  leadObj.search_config_id = '';
  leadObj.created_at = now;
  leadObj.updated_at = now;
  leadObj.last_seen_at = now;
  leadObj.status = (APP && APP.LEAD_STATUS_DEFAULT) ? APP.LEAD_STATUS_DEFAULT : 'New Lead';
  leadObj.business_name = finalBusinessName;
  leadObj.title = finalBusinessName;
  leadObj.category = finalCategory;
  leadObj.city = finalCity;
  leadObj.address = finalAddress;
  leadObj.website = finalWebsite;
  leadObj.phone = finalMainPhone;
  leadObj['Main Phone'] = finalMainPhone;
  leadObj['Main Email'] = finalMainEmail;
  leadObj.email = finalMainEmail;
  leadObj['Contact Name'] = finalContactName;
  leadObj.contact_name = finalContactName;
  leadObj['Contact Role'] = finalContactRole;
  leadObj.place_id = serpLead.placeId || parsed.value;
  leadObj.rating = toNumber_(serpLead.rating);
  leadObj.reviews_count = toNumber_(serpLead.reviews);
  leadObj.review_text = '';
  leadObj.country = serpLead.country || '';
  leadObj.province_state = serpLead.provinceState || '';
  leadObj.gps = serpLead.gps || '';
  leadObj.hours = serpLead.hours || '';
  leadObj.website_present = finalWebsite ? 'Yes' : 'No';
  leadObj.phone_present = finalMainPhone ? 'Yes' : 'No';
  leadObj.source = 'manual_serpapi';
  leadObj.full_query = 'manual place_id';
  leadObj.maps_position = '';
  leadObj.owner = '';
  leadObj.priority_bucket = '';
  leadObj.lead_signature = leadSignature;
  leadObj['Assigned To'] = String(rep || '').trim();
  leadObj['Active Task'] = finalActiveTask;
  leadObj['Task Type'] = finalTaskType;
  leadObj['Task Due At'] = finalTaskDueAt;
  leadObj['Task Status'] = finalTaskStatus;
  leadObj.crm_notes = noteEntry;
  leadObj.notes = noteEntry;

  var row = headers.map(function(h) {
    return leadObj[h] !== undefined ? leadObj[h] : '';
  });

  sheet.appendRow(row);
  var newRowNumber = sheet.getLastRow();

  return {
    ok: true,
    leadId: leadId,
    rowNumber: newRowNumber,
    redirectUrl: (APP.MARKET_MIRROR_WEBAPP_URL || ScriptApp.getService().getUrl()) +
      '?leadId=' + encodeURIComponent(leadId) +
      '&rep=' + encodeURIComponent(rep || ''),
    businessName: finalBusinessName
  };
}

function fetchSerpApiPlaceByPlaceId_(placeId) {
  var apiKey = getScriptPropertyOrThrow_('SERPAPI_KEY');
  var params = {
    engine: 'google_maps',
    type: 'place',
    place_id: placeId,
    hl: 'en',
    api_key: apiKey
  };

  var url = 'https://serpapi.com/search.json?' + toQueryString_(params);
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('SerpAPI HTTP ' + code + ': ' + text);
  }

  var json = JSON.parse(text);
  if (!json || json.error) {
    throw new Error(json && json.error ? json.error : 'SerpAPI returned an invalid place response.');
  }

  return json;
}

function normalizeSerpApiPlaceDetails_(json) {
  var placeResults = json && json.place_results ? json.place_results : {};
  var title = safeTextManual_(placeResults.title || placeResults.name);
  var address = safeTextManual_(placeResults.address);
  var category = normalizeCategoryManual_(placeResults.type || placeResults.types);
  var website = safeTextManual_(placeResults.website);
  var phone = safeTextManual_(placeResults.phone);
  var rating = Number(placeResults.rating) || 0;
  var reviews = parseInt(placeResults.reviews, 10) || 0;
  var city = extractCityFromAddressManual_(address);
  var provinceState = extractProvinceFromAddressManual_(address);
  var country = extractCountryFromAddressManual_(address);
  var gps = buildGpsStringManual_(placeResults.gps_coordinates);
  var hours = normalizeHoursManual_(placeResults.hours);

  return {
    placeId: safeTextManual_(json.search_parameters && json.search_parameters.place_id) || safeTextManual_(placeResults.place_id),
    businessName: title,
    category: category,
    address: address,
    city: city,
    provinceState: provinceState,
    country: country,
    website: website,
    mainPhone: phone,
    rating: rating,
    reviews: reviews,
    gps: gps,
    hours: hours
  };
}

function parseMapsIdentifier_(input) {
  var raw = String(input || '').trim();
  if (!raw) return { type: '', value: '' };

  if (/^[A-Za-z0-9_\-]{20,}$/.test(raw) && raw.indexOf('http') !== 0) {
    return { type: 'place_id', value: raw };
  }

  var placeIdMatch = raw.match(/[?&]place_id=([^&#]+)/i);
  if (placeIdMatch && placeIdMatch[1]) {
    return { type: 'place_id', value: decodeURIComponent(placeIdMatch[1]) };
  }

  var rawPlaceMatch = raw.match(/ChI[a-zA-Z0-9_\-]+/);
  if (rawPlaceMatch && rawPlaceMatch[0]) {
    return { type: 'place_id', value: rawPlaceMatch[0] };
  }

  return { type: 'unknown', value: '' };
}

function findLeadByPlaceIdOrSignature_(sheet, idx, placeId, leadSignature) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return '';

  var targetPlaceId = String(placeId || '').trim();
  var targetSignature = String(leadSignature || '').trim();

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var rowLeadId = String(getCellByHeader_(row, idx, 'lead_id') || '').trim();
    var rowPlaceId = String(getCellByHeader_(row, idx, 'place_id') || '').trim();
    var rowSignature = String(getCellByHeader_(row, idx, 'lead_signature') || '').trim();

    if (targetPlaceId && rowPlaceId && rowPlaceId === targetPlaceId) {
      return rowLeadId;
    }

    if (targetSignature && rowSignature && rowSignature === targetSignature) {
      return rowLeadId;
    }
  }

  return '';
}

function generateManualLeadId_() {
  var stamp = Utilities.formatDate(
    new Date(),
    (APP && APP.TZ) ? APP.TZ : (Session.getScriptTimeZone() || 'America/Montreal'),
    'yyyyMMdd-HHmmss'
  );
  var suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return 'LEAD-' + stamp + '-' + suffix;
}

function makeManualLeadSignature_(businessName, city, category) {
  return [
    normalizeHeaderKey_(businessName),
    normalizeHeaderKey_(city),
    normalizeHeaderKey_(category)
  ].join('|');
}

function safeTextManual_(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeCategoryManual_(value) {
  if (Array.isArray(value)) return value.join(', ');
  return safeTextManual_(value);
}

function extractCityFromAddressManual_(address) {
  var parts = String(address || '').split(',').map(function(p) { return p.trim(); }).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 3] || parts[0] : '';
}

function extractProvinceFromAddressManual_(address) {
  var parts = String(address || '').split(',').map(function(p) { return p.trim(); }).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] || '' : '';
}

function extractCountryFromAddressManual_(address) {
  var parts = String(address || '').split(',').map(function(p) { return p.trim(); }).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function buildGpsStringManual_(gpsCoordinates) {
  if (!gpsCoordinates || gpsCoordinates.latitude == null || gpsCoordinates.longitude == null) return '';
  return String(gpsCoordinates.latitude) + ',' + String(gpsCoordinates.longitude);
}

function normalizeHoursManual_(hours) {
  if (!hours) return '';
  if (Array.isArray(hours)) return hours.join(' | ');
  if (typeof hours === 'object') return JSON.stringify(hours);
  return String(hours);
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
    var key = normalizeHeaderKey_(headers[i]);
    if (idx[key] === undefined) {
      idx[key] = i;
    }
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