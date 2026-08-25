const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyPhaseOrder,
  commitPhaseOrder,
  movePhase,
  phaseOrderAfterDrag,
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

test("moves phases by insertion index without off-by-one errors", () => {
  const ids = ["a", "b", "c", "d"];

  assert.deepEqual(movePhase(ids, 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(movePhase(ids, 2, 0), ["c", "a", "b", "d"]);
  assert.deepEqual(movePhase(ids, 1, 3), ["a", "c", "d", "b"]);
  assert.deepEqual(movePhase(ids, 3, 1), ["a", "d", "b", "c"]);
});

test("rejects invalid move indexes without mutating the original order", () => {
  const ids = ["a", "b", "c"];

  assert.throws(() => movePhase(ids, -1, 1), /invalid_phase_move/);
  assert.throws(() => movePhase(ids, 0, 3), /invalid_phase_move/);
  assert.deepEqual(ids, ["a", "b", "c"]);
});

test("pointer release finalizes the drag independently of the release target", () => {
  const phaseIds = ["a", "b", "c", "d"];
  const reordered = phaseOrderAfterDrag({
    phaseIds,
    fromIndex: 0,
    toIndex: 2,
    dragging: true,
  });

  assert.deepEqual(reordered, ["b", "c", "a", "d"]);
});

test("pointer cancellation restores the original order", () => {
  const phaseIds = ["a", "b", "c", "d"];
  const reordered = phaseOrderAfterDrag({
    phaseIds,
    fromIndex: 0,
    toIndex: 2,
    dragging: true,
    cancelled: true,
  });

  assert.deepEqual(reordered, phaseIds);
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

test("persistence receives the complete phases with only sortOrder renumbered", async () => {
  const phases = [
    phase("phase-a", 0, {
      title: "Diseño",
      description: "Brief estable",
      status: "in_progress",
      assignedTo: "uuid-user-a",
      dueDate: "2026-08-30",
      completedAt: null,
    }),
    phase("phase-b", 1, {
      title: "Edición",
      description: "Mantener cortes aprobados",
      status: "pending",
      assignedTo: "uuid-user-b",
      dueDate: "2026-08-31",
      completedAt: null,
    }),
    phase("phase-c", 2, {
      title: "Entrega",
      description: "Entrega final",
      status: "completed",
      assignedTo: "uuid-user-c",
      dueDate: "2026-09-01",
      completedAt: "2026-08-29T18:25:00Z",
    }),
  ];
  let persisted = [];

  await commitPhaseOrder({
    phases,
    orderedPhaseIds: ["phase-b", "phase-c", "phase-a"],
    persist: async (nextPhases) => {
      persisted = nextPhases;
      return nextPhases;
    },
  });

  assert.deepEqual(persisted.map((item) => item.sortOrder), [0, 1, 2]);
  assert.deepEqual(
    persisted.map(({ id, title, description, status, assignedTo, dueDate, completedAt }) => ({
      id,
      title,
      description,
      status,
      assignedTo,
      dueDate,
      completedAt,
    })),
    [phases[1], phases[2], phases[0]].map(
      ({ id, title, description, status, assignedTo, dueDate, completedAt }) => ({
        id,
        title,
        description,
        status,
        assignedTo,
        dueDate,
        completedAt,
      }),
    ),
  );
});
