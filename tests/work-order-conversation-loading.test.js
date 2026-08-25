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

test("mention candidate errors stay stable instead of auto-refreshing every render", () => {
  const body = functionBody("refreshWorkOrderMentionCandidates");
  const errorBlockStart = body.indexOf('status: hasCachedItems ? "loaded" : "error"');
  assert.notEqual(errorBlockStart, -1, "candidate error state should be explicit");
  const errorBlock = body.slice(errorBlockStart, body.indexOf("return workOrderMentionCandidateState", errorBlockStart));
  assert.match(errorBlock, /needsRefresh:\s*false/);
  assert.doesNotMatch(errorBlock, /needsRefresh:\s*true/);
});

test("candidate refresh completion does not trigger a global render loop", () => {
  const body = functionBody("refreshWorkOrderMentionCandidates");
  const finallyStart = body.indexOf("finally");
  assert.notEqual(finallyStart, -1, "candidate refresh should clean up pending requests");
  const finallyBlock = body.slice(finallyStart);
  assert.doesNotMatch(finallyBlock, /\brender\(\)/);
});

test("conversation loading is idempotent and does not render before requests finish", () => {
  const body = functionBody("loadWorkOrderConversation");
  assert.match(body, /currentState\.status\s*===\s*"idle"/);
  assert.match(body, /candidateState\.status\s*===\s*"idle"/);
  const loadingStart = body.indexOf('setWorkOrderConversationState(order, { status: "loading"');
  assert.notEqual(loadingStart, -1, "conversation should still record loading state");
  const requestStart = body.indexOf("const commentsPromise", loadingStart);
  assert.notEqual(requestStart, -1, "conversation request should follow loading state");
  const loadingBlock = body.slice(loadingStart, requestStart);
  assert.doesNotMatch(loadingBlock, /\brender\(\)/);
});
