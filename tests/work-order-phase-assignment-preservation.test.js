const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("maps Supabase phase assignee and deadline fields into UI fields", () => {
  const mapperStart = appSource.indexOf("function mapDbWorkOrderPhase(row)");
  assert.notEqual(mapperStart, -1, "mapDbWorkOrderPhase should exist");
  const mapperEnd = appSource.indexOf("function mapDbWorkOrderPhaseComment", mapperStart);
  const mapperSource = appSource.slice(mapperStart, mapperEnd);

  assert.match(mapperSource, /assignedTo:\s*row\.assigned_to\s*\|\|\s*""/);
  assert.match(mapperSource, /dueDate:\s*row\.due_date\s*\|\|\s*""/);
});

test("renders phase assignee and deadline from normalized phase fields", () => {
  assert.match(appSource, /phaseAssigneeLabel\(phase\.assignedTo\)/);
  assert.match(appSource, /phase\.dueDate\s*\?\s*escapeHtml\(formatDate\(phase\.dueDate\)\)\s*:\s*"Sin deadline"/);
});

test("keeps the selected phase assignee available even if the profile is not in the local user list", () => {
  const optionsStart = appSource.indexOf("function renderPhaseAssigneeOptions");
  assert.notEqual(optionsStart, -1, "renderPhaseAssigneeOptions should exist");
  const optionsEnd = appSource.indexOf("function renderWorkOrderPhaseEditorRow", optionsStart);
  const optionsSource = appSource.slice(optionsStart, optionsEnd);

  assert.match(optionsSource, /activeUserId && !hasActiveUserOption/);
  assert.match(optionsSource, /phaseAssigneeLabel\(activeUserId\)/);
});

test("blocks saving when loaded phase assignee or deadline would be cleared implicitly", () => {
  const guardStart = appSource.indexOf("function validateLoadedPhaseIntegrityBeforeSave");
  assert.notEqual(guardStart, -1, "validateLoadedPhaseIntegrityBeforeSave should exist");
  const guardEnd = appSource.indexOf("function validateWorkOrderValues", guardStart);
  const guardSource = appSource.slice(guardStart, guardEnd);

  assert.match(guardSource, /assigned_to_would_be_cleared/);
  assert.match(guardSource, /due_date_would_be_cleared/);
  assert.match(appSource, /work-order-edit:blocked-phases-not-ready/);
  assert.match(appSource, /work-order-edit:blocked-phase-integrity/);
});
