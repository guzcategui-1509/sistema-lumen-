(function exposeLumenPhaseReorder(globalScope) {
  function phaseIdentity(phase) {
    return String(phase?.dbId || phase?.id || "");
  }

  function comparePhases(left, right) {
    const orderDifference = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0);
    if (orderDifference) return orderDifference;

    const createdDifference = String(left?.createdAt || "").localeCompare(String(right?.createdAt || ""));
    if (createdDifference) return createdDifference;

    return phaseIdentity(left).localeCompare(phaseIdentity(right));
  }

  function sortedPhases(phases = []) {
    return phases.slice().sort(comparePhases);
  }

  function movePhase(items = [], fromIndex, toIndex) {
    const nextItems = items.slice();
    const normalizedFromIndex = Number(fromIndex);
    const normalizedToIndex = Number(toIndex);

    if (
      !Number.isInteger(normalizedFromIndex)
      || !Number.isInteger(normalizedToIndex)
      || normalizedFromIndex < 0
      || normalizedFromIndex >= nextItems.length
      || normalizedToIndex < 0
      || normalizedToIndex >= nextItems.length
    ) {
      throw new Error("invalid_phase_move");
    }

    const [movedItem] = nextItems.splice(normalizedFromIndex, 1);
    nextItems.splice(normalizedToIndex, 0, movedItem);
    return nextItems;
  }

  function phaseOrderAfterDrag({ phaseIds = [], fromIndex, toIndex, dragging = false, cancelled = false } = {}) {
    if (!dragging || cancelled) return phaseIds.slice();
    return movePhase(phaseIds, fromIndex, toIndex);
  }

  function applyPhaseOrder(phases = [], orderedPhaseIds = []) {
    const current = sortedPhases(phases);
    const phaseById = new Map(current.map((phase) => [phaseIdentity(phase), phase]));
    const normalizedIds = orderedPhaseIds.map(String);
    const uniqueIds = new Set(normalizedIds);

    if (
      normalizedIds.length !== current.length
      || uniqueIds.size !== current.length
      || normalizedIds.some((phaseId) => !phaseById.has(phaseId))
    ) {
      throw new Error("invalid_phase_order");
    }

    return normalizedIds.map((phaseId, index) => ({
      ...phaseById.get(phaseId),
      sortOrder: index,
    }));
  }

  function hasSamePhaseOrder(left = [], right = []) {
    const leftIds = sortedPhases(left).map(phaseIdentity);
    const rightIds = sortedPhases(right).map(phaseIdentity);
    return leftIds.length === rightIds.length && leftIds.every((phaseId, index) => phaseId === rightIds[index]);
  }

  async function commitPhaseOrder({ phases = [], orderedPhaseIds = [], persist, onChange = () => {} }) {
    const previousPhases = sortedPhases(phases);
    const nextPhases = applyPhaseOrder(previousPhases, orderedPhaseIds);
    if (hasSamePhaseOrder(previousPhases, nextPhases)) {
      return { changed: false, phases: previousPhases };
    }

    onChange(nextPhases);
    try {
      const persistedPhases = await persist(nextPhases);
      return {
        changed: true,
        phases: Array.isArray(persistedPhases) ? persistedPhases : nextPhases,
      };
    } catch (error) {
      onChange(previousPhases);
      throw error;
    }
  }

  const api = {
    applyPhaseOrder,
    commitPhaseOrder,
    comparePhases,
    hasSamePhaseOrder,
    movePhase,
    phaseOrderAfterDrag,
    phaseIdentity,
    sortedPhases,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  globalScope.LumenPhaseReorder = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
