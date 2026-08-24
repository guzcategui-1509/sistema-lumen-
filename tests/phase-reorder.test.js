const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyPhaseOrder,
  commitPhaseOrder,
  sortedPhases,
} = require("../phase-reorder.js");

function phase(id, sortOrder, overrides = {}) {
  return {
    id,
    dbId: id,
    title: `Fase ${id}`,
    status: "pending",
    assignedTo: `user-${id}`,
    dueDate: `2026-08-${String(sortOrder + 10).padStart(2, "0")}`,
    completedAt: "",
    sortOrder,
    createdAt: `2026-08-0${sortOrder + 1}T10:00:00Z`,
    ...overrides,
  };
}

test("reorders the first phase into the third position and renumbers from zero", () => {
  const phases = [phase("a", 0), phase("b", 1), phase("c", 2), phase("d", 3)];
  const reordered = applyPhaseOrder(phases, ["b", "c", "a", "d"]);

  assert.deepEqual(reordered.map((item) => item.id), ["b", "c", "a", "d"]);
  assert.deepEqual(reordered.map((item) => item.sortOrder), [0, 1, 2, 3]);
});

test("reorders the fourth phase into the first position", () => {
  const phases = [phase("a", 0), phase("b", 1), phase("c", 2), phase("d", 3)];
  const reordered = applyPhaseOrder(phases, ["d", "a", "b", "c"]);

  assert.deepEqual(reordered.map((item) => item.id), ["d", "a", "b", "c"]);
});

test("moving a completed phase preserves status, assignment and historical dates", () => {
  const completed = phase("completed", 2, {
    status: "completed",
    assignedTo: "user-finished",
    dueDate: "2026-08-12",
    completedAt: "2026-08-11T18:25:00Z",
  });
  const phases = [phase("a", 0), phase("b", 1), completed, phase("d", 3)];
  const reordered = applyPhaseOrder(phases, ["completed", "a", "b", "d"]);
  const moved = reordered[0];

  assert.equal(moved.status, "completed");
  assert.equal(moved.assignedTo, "user-finished");
  assert.equal(moved.dueDate, "2026-08-12");
  assert.equal(moved.completedAt, "2026-08-11T18:25:00Z");
  assert.equal(moved.title, completed.title);
});

test("uses createdAt and id as stable fallbacks when sort_order ties", () => {
  const phases = [
    phase("c", 0, { createdAt: "2026-08-02T10:00:00Z" }),
    phase("b", 0, { createdAt: "2026-08-01T10:00:00Z" }),
    phase("a", 0, { createdAt: "2026-08-01T10:00:00Z" }),
  ];

  assert.deepEqual(sortedPhases(phases).map((item) => item.id), ["a", "b", "c"]);
});

test("rejects an incomplete or duplicated phase order", () => {
  const phases = [phase("a", 0), phase("b", 1), phase("c", 2)];

  assert.throws(() => applyPhaseOrder(phases, ["a", "b"]), /invalid_phase_order/);
  assert.throws(() => applyPhaseOrder(phases, ["a", "a", "c"]), /invalid_phase_order/);
});

test("restores the previous order when persistence fails", async () => {
  const phases = [phase("a", 0), phase("b", 1), phase("c", 2)];
  const renderedOrders = [];

  await assert.rejects(
    commitPhaseOrder({
      phases,
      orderedPhaseIds: ["c", "a", "b"],
      persist: async () => {
        throw new Error("backend_unavailable");
      },
      onChange: (nextPhases) => renderedOrders.push(nextPhases.map((item) => item.id)),
    }),
    /backend_unavailable/,
  );

  assert.deepEqual(renderedOrders, [
    ["c", "a", "b"],
    ["a", "b", "c"],
  ]);
});
