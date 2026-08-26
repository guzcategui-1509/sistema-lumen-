const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const source = readFileSync("app.js", "utf8");

function functionBody(name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist`);
  const signatureEnd = source.indexOf(") {", start);
  assert.notEqual(signatureEnd, -1, `${name} should have a parseable signature`);
  const braceStart = signatureEnd + 2;
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(braceStart + 1, index);
  }
  throw new Error(`Could not parse ${name}`);
}

test("general conversation uses the stable comments and mentions contract", () => {
  const loadBody = functionBody("loadWorkOrderConversation");
  assert.match(loadBody, /\.from\("work_order_comments"\)/);
  assert.match(loadBody, /mentions:work_order_comment_mentions/);
  assert.doesNotMatch(loadBody, /edited_at/);

  const mapperBody = functionBody("mapDbWorkOrderComment");
  assert.match(mapperBody, /mentions:\s*\(row\.mentions \|\| \[\]\)/);
  assert.doesNotMatch(mapperBody, /editedAt|edited_at/);
});

test("phase comments use the stable table and two-argument RPC contract", () => {
  assert.match(
    source,
    /\.from\("work_order_phase_comments"\)\.select\("\*"\)\.order\("created_at"/,
  );
  assert.doesNotMatch(source, /work_order_phase_comment_mentions/);

  const addBody = functionBody("addWorkOrderPhaseComment");
  assert.match(addBody, /rpc\("add_work_order_phase_comment",\s*\{[\s\S]*target_phase_id:[\s\S]*comment_body:/);
  assert.doesNotMatch(addBody, /mentioned_user_ids|phaseCommentMentionContext/);
});

test("unsupported comment editing and unified mention RPCs stay disabled", () => {
  assert.doesNotMatch(source, /update_work_order_comment/);
  assert.doesNotMatch(source, /update_work_order_phase_comment/);
  assert.doesNotMatch(source, /list_my_work_order_mentions/);
  assert.doesNotMatch(source, /mark_work_order_mention_read/);
  assert.doesNotMatch(source, /workOrderCommentEditing|workOrderCommentEditSaving/);
});

test("general mention inbox keeps read state and comment deep links", () => {
  const loadBody = functionBody("loadMyWorkOrderMentions");
  assert.match(loadBody, /rpc\("list_my_work_order_comment_mentions"/);

  const openBody = functionBody("openWorkOrderMention");
  assert.match(openBody, /rpc\("mark_work_order_comment_mention_read"/);
  assert.match(openBody, /commentId:\s*mention\.commentId/);
  assert.doesNotMatch(openBody, /phaseId:|phaseCommentId:|mention\.kind/);
});

test("conversation load errors remain fail-closed and preserve cached comments", () => {
  const loadBody = functionBody("loadWorkOrderConversation");
  const errorStart = loadBody.indexOf("if (error)");
  assert.notEqual(errorStart, -1, "conversation load should handle query errors");
  const errorEnd = loadBody.indexOf("} else {", errorStart);
  const errorBlock = loadBody.slice(errorStart, errorEnd);
  assert.match(errorBlock, /status:\s*"error"/);
  assert.doesNotMatch(errorBlock, /comments:\s*\[\]/);
});

test("general publishing keeps structured mentions and the canonical email producer", () => {
  const publishBody = functionBody("publishWorkOrderComment");
  assert.match(publishBody, /rpc\("create_work_order_comment"/);
  assert.match(publishBody, /mentioned_user_ids:\s*mentionedUserIds/);
  assert.match(source, /Orden archivada: la conversación permanece visible en modo solo lectura/);
});
