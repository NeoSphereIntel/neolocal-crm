# CLAUDE.md — NeoLocal™ CRM Project Governance
> This file governs all Claude Code behavior in this repository.
> Read this ENTIRE file before executing any command. No exceptions.

---

## 0. GOLDEN RULES

1. **Read before write.** Never modify a file you haven't read in this session.
2. **Verify before referencing.** Never call a function, use a variable, or import a module without confirming it exists in the codebase. Grep first.
3. **Confirm before destroying.** Never delete a file, remove a function, or change a data schema without explicit user approval.
4. **One change at a time.** Make a single logical change, verify it works, then move on. No multi-file refactors in a single step.
5. **If unsure, ask.** Do not guess at business logic, field names, or user intent. Ask.

---

## 1. PROJECT ARCHITECTURE

### Stack
- **Backend:** Google Apps Script (clasp-managed, deployed as web app)
- **Database:** Google Sheets ("Leads Master" sheet — ~100 columns)
- **Frontend (current):** Apps Script HtmlService (files 20–22)
- **Frontend (target):** Decoupled static site (HTML/CSS/JS), hosted separately, calling Apps Script API endpoints
- **External APIs:** SerpAPI (Google Maps lead import), Anthropic API (narrative generation)
- **Deployment:** clasp push → Apps Script editor → deploy as web app

### File Structure
The repo is a flat folder of `.js` and `.html` files pulled via clasp. Key files:
- `19_rep_webapp.js` — doGet/doPost handlers, server-side functions
- `20_rep_dashboard.html` — rep dashboard template
- `21_rep_lead.html` — lead detail view
- `22_rep_add_lead.html` — add lead form
- Other `.js` files — scoring, narrative generation, SerpAPI import, Market Mirror, utilities

### Data Model
- Leads Master is a single flat sheet with ~100 columns
- Column positions may shift — always reference by header name, never by index
- Never assume column order. Always use a header-lookup pattern.

---

## 2. READ-BEFORE-WRITE PROTOCOL

### Before touching ANY file:
```
1. Read the file completely
2. Identify all functions defined in it
3. Grep the codebase for where those functions are called
4. Understand the dependency chain
5. THEN propose changes
```

### Before ANY session of work:
```
1. List all files in the repo
2. Read the files relevant to the task
3. State what you found and what you plan to do
4. Wait for user confirmation before proceeding
```

### Before modifying a function:
```
1. Read the function
2. Grep for all call sites: grep -r "functionName" *.js *.html
3. List every file that calls it
4. Confirm your change won't break callers
5. If signature changes, update ALL callers in the same commit
```

---

## 3. VERIFICATION RULES

### No Hallucinated Code
- **Functions:** Never call a function unless you've confirmed it exists via `grep -r "function functionName" *.js` or by reading the file that defines it.
- **Variables:** Never reference a global variable or property without confirming it exists.
- **Sheet columns:** Never reference a column name without verifying it exists in the header row pattern or in the codebase.
- **Libraries:** Never import or require a library without confirming it's available in the Apps Script environment or listed in `package.json`.
- **APIs:** Never assume an API endpoint, parameter, or response shape. Read the code that calls it.

### Apps Script Specific
- Apps Script does NOT support `require()`, `import`, `export`, or ES modules. Everything is global scope.
- Apps Script does NOT support `fetch()` — use `UrlFetchApp.fetch()`.
- Apps Script does NOT support `async/await` — use synchronous patterns.
- Apps Script does NOT support arrow functions in older runtimes — confirm V8 runtime is enabled before using them.
- `HtmlService` templates use `<?= ?>` and `<?!= ?>` for scriptlets — do not confuse with other template syntaxes.
- `google.script.run` is the client→server bridge in HtmlService — it is asynchronous with `.withSuccessHandler()` and `.withFailureHandler()`.

### Before Declaring Anything "Done"
```
1. Re-read the modified file(s) to confirm changes are correct
2. Check for syntax errors (unmatched braces, missing semicolons)
3. Verify no function signatures were broken
4. Confirm the change addresses what the user asked for — nothing more, nothing less
5. State what was changed and what was NOT changed
```

---

## 4. SECURITY RULES

### API Keys & Credentials
- **Never hardcode API keys** in any file. All keys go in Script Properties (`PropertiesService.getScriptProperties()`).
- **Never log API keys** — not in console.log, not in Logger.log, not in comments.
- **Never expose API keys in client-side code** — HtmlService templates run in the browser. Keys stay server-side.
- If you find a hardcoded key in existing code, flag it immediately. Do not silently move it.

### Data Exposure
- **Never expose the full Sheets data** to the client. Server-side functions should return only the fields the frontend needs.
- **Never include raw Sheets API calls in client-side code.**
- **Sanitize all user input** before writing to Sheets — prevent formula injection (`=`, `+`, `-`, `@` at start of cell values).
- **Never trust client-supplied IDs** without server-side validation.

### doGet / doPost
- Validate all incoming parameters server-side.
- Return proper error responses — never expose stack traces to the client.
- When building API endpoints: use a consistent response envelope (e.g., `{ success: true, data: {...} }` or `{ success: false, error: "message" }`).

### Auth
- The current app relies on Google account gating via Apps Script deployment settings.
- Do not introduce any auth bypass patterns.
- If building a decoupled frontend, auth tokens must be handled via the Apps Script execution API or a similar secure mechanism — never via query string parameters.

---

## 5. NAMING & CODE STYLE

### Existing Conventions (Follow These)
- Read the existing code to identify naming patterns before writing new code.
- Match the existing style: if the codebase uses `camelCase` for functions, use `camelCase`. If it uses `snake_case` for Sheet column headers, use `snake_case`.
- Do not "improve" naming conventions in existing code without explicit permission.

### New Code
- Functions: `camelCase` — descriptive verb-noun pattern (e.g., `getLeadById`, `updateScore`, `buildDashboardCard`)
- Constants: `UPPER_SNAKE_CASE`
- Sheet column headers: match existing convention (likely `Title Case` or `snake_case` — verify before adding columns)
- CSS classes (decoupled frontend): `nl-` prefix, `kebab-case` (e.g., `nl-dashboard-card`, `nl-lead-detail`)
- HTML IDs: `camelCase` or `kebab-case` — match existing

### Comments
- Comment the WHY, not the WHAT.
- Every new function gets a one-line JSDoc comment explaining purpose and return type.
- Do not add decorative comment blocks or ASCII art.

---

## 6. BRAND & DESIGN RULES

### NeoLocal™ Brand (Applies to ALL UI work)

**Product names — always with ™ on first mention:**
- NeoLocal™
- NeoSphereIntel™

**CRITICAL BRAND RULE:** NeoLocal does NOT limit clients to one per market or per vertical. Never imply market exclusivity or competitive overlap protection in any copy.

### Color Palette
```
Navy deep:    #000e38   (dark backgrounds)
Navy:         #00195c   (primary brand, headings)
Orange:       #ed8220   (CTAs, accents, highlights)
Off white:    #f4f3ef   (section backgrounds)
Off white 2:  #e4e2db   (borders, dividers)
Gray:         #5a6378   (body text)
Dark:         #080e22   (headings on light backgrounds)
Green:        #1a6640   (success states)
Red:          #bd0e20   (error/alert states)
```
- Never use pure black (#000000) — use #080e22
- Never use orange as a large area background
- Never place orange text on white backgrounds (insufficient contrast)

### Typography
```
Headlines:    Bebas Neue 400 — text-transform: none
Labels:       Barlow Condensed 700 — uppercase, letter-spacing 2.5–3.5px
Body:         Barlow 300/400 — line-height 1.65–1.7
Buttons/CTAs: Barlow Condensed 700 — uppercase, letter-spacing 2–2.5px

Google Fonts:
https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&family=Barlow+Condensed:wght@300;400;600;700&display=swap
```

### UI Components
- Buttons: `border-radius: 3px` — never rounded
- Primary CTA: orange fill, white text, Barlow Condensed uppercase
- Ghost button (on dark): transparent, white border, white text
- Cards: `border-radius: 8px`, subtle shadow or border

### CSS Constraints (Themify Compatibility — for any code that may end up in Themify)
- NO CSS variables (`var(--x)`)
- NO CSS Grid (`grid-template-columns`, `1fr`)
- NO `clamp()`
- Use flexbox with `-webkit-` prefixes
- All font-family declarations use `!important` to beat Themify's Comfortaa
- All colors as direct hex values

### CSS Constraints (Decoupled Frontend — if building standalone app)
- CSS variables ARE allowed
- CSS Grid IS allowed
- Modern CSS IS allowed
- Still follow the brand color palette and typography stack
- Still use the `nl-` class prefix to maintain consistency

---

## 7. GIT & COMMIT DISCIPLINE

### Commit Messages
Format: `type: short description`

Types:
- `feat:` — new feature or capability
- `fix:` — bug fix
- `refactor:` — code restructuring, no behavior change
- `style:` — CSS/UI changes only
- `docs:` — documentation changes
- `chore:` — config, build, tooling

Examples:
```
feat: add API endpoint for lead detail
fix: column header lookup failing on Leads Master
refactor: extract scoring logic into separate functions
style: redesign dashboard card layout
```

### Branch Discipline
- Never commit directly to `main` without user approval.
- When making significant changes, ask if the user wants a feature branch.

### What NOT to Commit
- API keys or credentials
- `.clasp.json` with script IDs (if not already tracked)
- `node_modules/`
- `.env` files
- Build artifacts

---

## 8. QUALITY CONTROL CHECKLIST

### Before Every Deliverable
```
[ ] All modified files re-read and verified
[ ] No hallucinated function calls or variables
[ ] No hardcoded API keys or credentials
[ ] No broken function signatures or missing callers
[ ] Column references verified against actual sheet headers
[ ] Brand colors and fonts correct (if UI work)
[ ] Commit message follows convention
[ ] User has been told exactly what changed and what didn't
```

### After Refactoring
```
[ ] Every function that existed before still exists (or was explicitly removed with approval)
[ ] Every call site was updated if signatures changed
[ ] No orphaned functions (defined but never called — unless intentionally public API)
[ ] Tested mentally or described: "When the rep clicks X, this function fires, calls Y, returns Z"
```

---

## 9. COMMUNICATION RULES

### Always Tell the User:
- What you read before making changes
- What you plan to do before doing it
- What you changed after doing it
- What you did NOT change (if the user might expect otherwise)
- Any risks, assumptions, or open questions

### Never:
- Silently change files without explaining what and why
- Assume business logic — ask about scoring weights, field meanings, workflow steps
- Refactor code that works fine just to make it "cleaner" unless asked
- Add features that weren't requested
- Change the data schema without explicit discussion

### When You Hit a Problem:
```
1. State what you were trying to do
2. State what went wrong
3. State what you think the options are
4. Ask which direction to go
```

---

## 10. APPS SCRIPT ENVIRONMENT REFERENCE

### Available Global Objects (Do NOT import these)
```
SpreadsheetApp, DriveApp, UrlFetchApp, PropertiesService,
HtmlService, Logger, ContentService, ScriptApp, Session,
CacheService, LockService, Utilities, MailApp, GmailApp
```

### HtmlService Patterns
```javascript
// Server-side: return HTML
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('template')
    .setTitle('Page Title')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Client-side: call server
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .serverFunction(args);
```

### Execution Limits
- Script runtime: 6 minutes (30 minutes for Workspace accounts)
- UrlFetchApp: 100MB response, 50 calls per script run
- Properties: 9KB per property, 500KB total
- HtmlService: 10MB HTML output

---

## 11. SCOPE OF WORK — CURRENT PROJECT

### Phase 1: Architecture Mapping (DO FIRST)
- Read all files, map dependencies, understand data flow
- Document what each file does
- Present findings before any code changes

### Phase 2: API Layer
- Convert doGet/doPost to clean JSON API endpoints
- Keep all existing business logic in place
- Add response envelope pattern

### Phase 3: Frontend Rebuild
- Build decoupled frontend (HTML/CSS/JS or lightweight framework)
- Follow the rep workflow: Score → Understand → Market Mirror → Outreach → Log → Next
- Use NeoLocal brand system throughout

### Phase 4: Scoring Reframe
- Shift from review-centric to market position intelligence
- Update scoring inputs and narrative generation
- Align with NeoLocal value prop

**Do NOT jump phases. Complete each phase before starting the next.**

---

*This document is the source of truth for Claude Code behavior in this project.*
*Last updated: May 2026*
