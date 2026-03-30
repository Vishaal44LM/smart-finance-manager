import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Plus, Trash2, Sparkles, IndianRupee, TrendingUp,
  Wallet, ArrowDownCircle,
} from "lucide-react";
import { formatINR } from "@/lib/finance-store";
import { KnapsackExpense, KnapsackResult, optimizeBudget } from "@/lib/knapsack-optimizer";

let idCounter = 0;
const nextId = () => `knap-${++idCounter}`;

export default function BudgetOptimizer() {
  const [budget, setBudget] = useState(0);
  const [expenses, setExpenses] = useState<KnapsackExpense[]>([]);
  const [result, setResult] = useState<KnapsackResult | null>(null);

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(0);
  const [newImportance, setNewImportance] = useState(5);

  const addExpense = () => {
    if (!newName.trim() || newAmount <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: nextId(), name: newName.trim(), amount: newAmount, importance: newImportance },
    ]);
    setNewName("");
    setNewAmount(0);
    setNewImportance(5);
    setResult(null);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setResult(null);
  };

  const optimize = () => {
    if (expenses.length === 0 || budget <= 0) return;
    setResult(optimizeBudget(budget, expenses));
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const importanceColor = (imp: number) => {
    if (imp >= 8) return "default";
    if (imp >= 5) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Smart Budget Optimizer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Uses 0/1 Knapsack Algorithm to select the best expenses within your budget
        </p>
      </div>

      {/* Budget Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">₹</span>
            <Input
              type="number"
              min={0}
              value={budget || ""}
              onChange={(e) => { setBudget(Number(e.target.value)); setResult(null); }}
              placeholder="Enter your monthly budget"
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Expense */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rent"
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount (₹)</label>
              <Input
                type="number"
                min={0}
                value={newAmount || ""}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                placeholder="0"
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Importance (1–10)</label>
              <Select
                value={String(newImportance)}
                onValueChange={(v) => setNewImportance(Number(v))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addExpense} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expense Table */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Expenses ({expenses.length})</span>
              <span className="text-sm font-normal text-muted-foreground">
                Total: {formatINR(totalExpenses)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Importance</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={importanceColor(e.importance)}>{e.importance}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExpense(e.id)}
                        className="h-7 w-7 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Optimize Button */}
      {expenses.length > 0 && budget > 0 && (
        <Button onClick={optimize} className="w-full" size="lg">
          <Sparkles className="h-4 w-4 mr-2" /> Optimize Expenses
        </Button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Explanation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <p className="text-sm text-foreground italic">💡 {result.explanation}</p>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <IndianRupee className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Used Budget</p>
                <p className="text-lg font-bold text-foreground">{formatINR(result.totalUsedBudget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <Wallet className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-green-600">{formatINR(result.remainingBudget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Importance Score</p>
                <p className="text-lg font-bold text-foreground">{result.totalImportanceScore}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <ArrowDownCircle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                <p className="text-xs text-muted-foreground">You Saved</p>
                <p className="text-lg font-bold text-orange-500">
                  {formatINR(totalExpenses - result.totalUsedBudget)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Selected Expenses */}
          {result.selectedExpenses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" /> Recommended to Keep ({result.selectedExpenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Importance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.selectedExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={importanceColor(e.importance)}>{e.importance}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Postponed Expenses */}
          {result.postponedExpenses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                  <XCircle className="h-4 w-4" /> Postpone ({result.postponedExpenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Importance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.postponedExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={importanceColor(e.importance)}>{e.importance}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
