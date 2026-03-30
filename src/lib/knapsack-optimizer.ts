export interface KnapsackExpense {
  id: string;
  name: string;
  amount: number;
  importance: number; // 1–10
}

export interface KnapsackResult {
  selectedExpenses: KnapsackExpense[];
  postponedExpenses: KnapsackExpense[];
  totalUsedBudget: number;
  remainingBudget: number;
  totalImportanceScore: number;
  explanation: string;
}

export function optimizeBudget(
  monthlyBudget: number,
  expenses: KnapsackExpense[]
): KnapsackResult {
  const n = expenses.length;
  const budget = Math.floor(monthlyBudget);

  if (n === 0 || budget <= 0) {
    return {
      selectedExpenses: [],
      postponedExpenses: [...expenses],
      totalUsedBudget: 0,
      remainingBudget: monthlyBudget,
      totalImportanceScore: 0,
      explanation: n === 0
        ? "No expenses to optimize."
        : "Budget is zero — all expenses are postponed.",
    };
  }

  // Scale amounts to integers for DP (work in whole rupees)
  const amounts = expenses.map((e) => Math.round(e.amount));

  // Check if all expenses exceed budget
  if (amounts.every((a) => a > budget)) {
    return {
      selectedExpenses: [],
      postponedExpenses: [...expenses],
      totalUsedBudget: 0,
      remainingBudget: monthlyBudget,
      totalImportanceScore: 0,
      explanation:
        "All expenses exceed the available budget. Consider increasing your budget or reducing expense amounts.",
    };
  }

  // 0/1 Knapsack DP — using 1D optimized array
  const dp = new Array(budget + 1).fill(0);
  // Track which items are selected using a 2D keep table
  const keep: boolean[][] = Array.from({ length: n }, () =>
    new Array(budget + 1).fill(false)
  );

  for (let i = 0; i < n; i++) {
    // Traverse budget from high to low to avoid reusing items
    for (let w = budget; w >= amounts[i]; w--) {
      const withItem = dp[w - amounts[i]] + expenses[i].importance;
      if (withItem > dp[w]) {
        dp[w] = withItem;
        keep[i][w] = true;
      }
    }
  }

  // Backtrack to find selected items
  const selectedIds = new Set<string>();
  let w = budget;
  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][w]) {
      selectedIds.add(expenses[i].id);
      w -= amounts[i];
    }
  }

  const selectedExpenses = expenses.filter((e) => selectedIds.has(e.id));
  const postponedExpenses = expenses.filter((e) => !selectedIds.has(e.id));
  const totalUsedBudget = selectedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalImportanceScore = selectedExpenses.reduce((s, e) => s + e.importance, 0);
  const remainingBudget = monthlyBudget - totalUsedBudget;

  // Generate explanation
  const topSelected = selectedExpenses
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
    .map((e) => e.name);
  const topPostponed = postponedExpenses
    .sort((a, b) => a.importance - b.importance)
    .slice(0, 3)
    .map((e) => e.name);

  let explanation = "Based on your budget, we prioritized high-value expenses";
  if (topSelected.length > 0) {
    explanation += ` like ${topSelected.join(", ")}`;
  }
  if (topPostponed.length > 0) {
    explanation += `, while postponing lower-impact spending like ${topPostponed.join(", ")}`;
  }
  explanation += ".";

  return {
    selectedExpenses,
    postponedExpenses,
    totalUsedBudget,
    remainingBudget,
    totalImportanceScore,
    explanation,
  };
}
