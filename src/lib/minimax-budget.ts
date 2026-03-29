// Minimax-based Budget Decision Assistant
// MAX level: user wants to maximize usefulness of spending
// MIN level: system wants to minimize risk of overspending

export interface DecisionInput {
  monthlyBudget: number;
  totalSpent: number;
  newExpenseAmount: number;
  expenseCategory: string;
  remainingDays: number;
  minimumReserve: number;
}

export interface DecisionResult {
  recommendation: "SPEND" | "SAVE";
  score: number;
  reason: string;
  spendScore: number;
  saveScore: number;
}

const ESSENTIAL_CATEGORIES = ["food", "transport", "bills"];
const NON_ESSENTIAL_CATEGORIES = ["shopping", "entertainment"];

function isEssential(category: string): boolean {
  return ESSENTIAL_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Evaluate a terminal node's utility score.
 * Higher score = better outcome for the user.
 * Range roughly -100 to +100.
 */
function evaluateUtility(
  balanceAfter: number,
  minimumReserve: number,
  remainingDays: number,
  category: string,
  didSpend: boolean
): number {
  let score = 0;

  const balanceBeforeSpend = didSpend ? balanceAfter + 0 : balanceAfter; // balanceAfter already reflects the choice

  if (didSpend) {
    // 1. Reserve safety check
    if (balanceAfter < 0) {
      score -= 50;
    } else if (balanceAfter < minimumReserve) {
      score -= 30;
    } else {
      score += 20;
    }

    // 2. Category importance
    if (isEssential(category)) {
      score += 25;
    } else {
      score -= 10;
    }

    // 3. Daily budget sustainability
    const dailyBudget = remainingDays > 0 ? balanceAfter / remainingDays : 0;
    if (dailyBudget < minimumReserve / 10) {
      score -= 15;
    } else {
      score += 10;
    }

    // 4. Buffer ratio
    if (minimumReserve > 0) {
      const bufferRatio = balanceAfter / minimumReserve;
      if (bufferRatio >= 2) score += 10;
      else if (bufferRatio >= 1) score += 5;
      else score -= 10;
    }
  } else {
    // SAVE path — score based on how much saving helps

    // 1. Base save benefit
    score += 10;

    // 2. How tight is the budget? Saving is more valuable when budget is tight
    if (minimumReserve > 0) {
      const bufferRatio = balanceAfter / minimumReserve;
      if (bufferRatio < 1) {
        score += 25; // already below reserve, saving is critical
      } else if (bufferRatio < 1.5) {
        score += 18; // close to reserve, saving is important
      } else if (bufferRatio < 2) {
        score += 10;
      } else {
        score += 3; // plenty of buffer, saving has less urgency
      }
    }

    // 3. Category consideration — skipping essential expenses has a cost
    if (isEssential(category)) {
      score -= 15; // penalty for not spending on essentials
    } else {
      score += 12; // bonus for skipping non-essentials
    }

    // 4. Daily sustainability — if daily budget is already low, saving helps more
    const dailyBudget = remainingDays > 0 ? balanceAfter / remainingDays : 0;
    if (dailyBudget < minimumReserve / 10) {
      score += 15; // very tight daily budget, saving is wise
    } else if (dailyBudget < minimumReserve / 5) {
      score += 8;
    } else {
      score += 2;
    }
  }

  return score;
}

/**
 * Minimax decision tree (depth 2):
 *
 * Root (MAX — user's turn: choose spend or save)
 * ├── SPEND (MIN — system evaluates worst-case risk)
 * │   ├── Scenario: remaining days are low → utility(...)
 * │   └── Scenario: remaining days are normal → utility(...)
 * └── SAVE  (MIN — system evaluates worst-case risk)
 *     ├── Scenario: remaining days are low → utility(...)
 *     └── Scenario: remaining days are normal → utility(...)
 *
 * At MIN level we take the minimum (worst case).
 * At MAX level we take the maximum (best choice for user).
 */
export function minimaxDecision(input: DecisionInput): DecisionResult {
  const {
    monthlyBudget,
    totalSpent,
    newExpenseAmount,
    expenseCategory,
    remainingDays,
    minimumReserve,
  } = input;

  const balanceIfSpend = monthlyBudget - (totalSpent + newExpenseAmount);
  const balanceIfSave = monthlyBudget - totalSpent;

  // --- MIN level for SPEND: evaluate two scenarios (pessimistic & normal) ---
  const spendScoreWorst = evaluateUtility(
    balanceIfSpend,
    minimumReserve,
    Math.max(1, Math.floor(remainingDays * 0.5)), // pessimistic: fewer days left
    expenseCategory,
    true
  );
  const spendScoreNormal = evaluateUtility(
    balanceIfSpend,
    minimumReserve,
    remainingDays,
    expenseCategory,
    true
  );
  // MIN picks worst case
  const spendScore = Math.min(spendScoreWorst, spendScoreNormal);

  // --- MIN level for SAVE: evaluate two scenarios ---
  const saveScoreWorst = evaluateUtility(
    balanceIfSave,
    minimumReserve,
    Math.max(1, Math.floor(remainingDays * 0.5)),
    expenseCategory,
    false
  );
  const saveScoreNormal = evaluateUtility(
    balanceIfSave,
    minimumReserve,
    remainingDays,
    expenseCategory,
    false
  );
  const saveScore = Math.min(saveScoreWorst, saveScoreNormal);

  // --- MAX level: user picks the best option ---
  const recommendation: "SPEND" | "SAVE" = spendScore >= saveScore ? "SPEND" : "SAVE";

  // Generate human-readable reason
  const reason = generateReason(input, balanceIfSpend, recommendation);

  return {
    recommendation,
    score: Math.max(spendScore, saveScore),
    reason,
    spendScore,
    saveScore,
  };
}

function generateReason(
  input: DecisionInput,
  balanceAfterSpend: number,
  rec: "SPEND" | "SAVE"
): string {
  const { minimumReserve, expenseCategory, remainingDays, newExpenseAmount } = input;
  const essential = isEssential(expenseCategory);

  if (rec === "SPEND") {
    if (essential && balanceAfterSpend >= minimumReserve) {
      return `Recommended: "${expenseCategory}" is an essential expense and your remaining budget (₹${balanceAfterSpend.toLocaleString("en-IN")}) is still above your safe reserve.`;
    }
    if (balanceAfterSpend >= minimumReserve) {
      return `Acceptable: your remaining balance (₹${balanceAfterSpend.toLocaleString("en-IN")}) stays above the safety reserve of ₹${minimumReserve.toLocaleString("en-IN")}.`;
    }
    return `Proceed with caution: spending ₹${newExpenseAmount.toLocaleString("en-IN")} leaves a tight budget, but the expense may be justified.`;
  }

  // SAVE
  if (balanceAfterSpend < 0) {
    return `Not recommended: this expense would exceed your total monthly budget.`;
  }
  if (balanceAfterSpend < minimumReserve) {
    return `Not recommended: spending ₹${newExpenseAmount.toLocaleString("en-IN")} would reduce your balance below the safe reserve of ₹${minimumReserve.toLocaleString("en-IN")}.`;
  }
  if (!essential && remainingDays <= 7) {
    return `Not recommended: with only ${remainingDays} days left, saving on non-essential "${expenseCategory}" expenses is wiser.`;
  }
  return `Saving is the better choice right now to maintain a healthy budget for the remaining ${remainingDays} days.`;
}
