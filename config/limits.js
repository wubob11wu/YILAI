const FREE_PLAN_LIMITS = {
  maxItems: 30,
  maxBatchImport: 9,
  recommendationChangesPerDay: 20,
  calendarHistoryDays: 30
};

function getPlanLimits() {
  return FREE_PLAN_LIMITS;
}

function getRemainingItemSlots(currentCount) {
  return Math.max(0, getPlanLimits().maxItems - currentCount);
}

module.exports = {
  FREE_PLAN_LIMITS,
  getPlanLimits,
  getRemainingItemSlots
};
