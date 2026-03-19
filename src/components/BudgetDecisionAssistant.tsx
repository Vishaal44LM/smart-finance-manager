import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";
import { minimaxDecision, DecisionResult } from "@/lib/minimax-budget";
import { formatINR } from "@/lib/finance-store";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment"];

interface Props {
  monthlyIncome: number;
  totalSpent: number;
}

export default function BudgetDecisionAssistant({ monthlyIncome, totalSpent }: Props) {
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [reserve, setReserve] = useState<number>(1500);
  const [result, setResult] = useState<DecisionResult | null>(null);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const remainingDays = Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000));

  const handleAnalyze = () => {
    if (!expenseAmount || !category) return;
    const res = minimaxDecision({
      monthlyBudget: monthlyIncome,
      totalSpent,
      newExpenseAmount: expenseAmount,
      expenseCategory: category,
      remainingDays,
      minimumReserve: reserve,
    });
    setResult(res);
  };

  const isSpend = result?.recommendation === "SPEND";

  return (
    <Card className="shadow-md border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Budget Decision Assistant
          <span className="text-xs font-normal text-muted-foreground ml-auto">Minimax Algorithm</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a potential expense and the AI will analyze whether you should <strong>Spend</strong> or <strong>Save</strong> using a Minimax decision tree.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-muted-foreground">New Expense Amount (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 2000"
              value={expenseAmount || ""}
              onChange={(e) => { setExpenseAmount(parseFloat(e.target.value) || 0); setResult(null); }}
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setResult(null); }}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Minimum Safe Reserve (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              value={reserve || ""}
              onChange={(e) => { setReserve(parseFloat(e.target.value) || 0); setResult(null); }}
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Days Left in Month</Label>
            <Input type="number" value={remainingDays} disabled />
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Budget: <strong className="text-foreground">{formatINR(monthlyIncome)}</strong></span>
          <span>•</span>
          <span>Spent: <strong className="text-foreground">{formatINR(totalSpent)}</strong></span>
          <span>•</span>
          <span>Available: <strong className="text-foreground">{formatINR(monthlyIncome - totalSpent)}</strong></span>
        </div>

        <Button onClick={handleAnalyze} disabled={!expenseAmount || !category} className="w-full gap-2">
          <Sparkles className="h-4 w-4" /> Analyze with Minimax AI
        </Button>

        {result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Alert variant={isSpend ? "default" : "destructive"} className={isSpend ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : ""}>
              {isSpend ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription className="font-semibold">
                {isSpend ? "✅" : "⚠️"} Recommendation: <span className={isSpend ? "text-green-700 dark:text-green-400" : "text-destructive"}>{result.recommendation}</span>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">{result.reason}</p>

            <div className="grid grid-cols-2 gap-3">
              <Card className={`shadow-sm ${isSpend ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/10" : "border-muted"}`}>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Spend Score</p>
                  <p className="text-xl font-bold">{result.spendScore}</p>
                </CardContent>
              </Card>
              <Card className={`shadow-sm ${!isSpend ? "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/10" : "border-muted"}`}>
                <CardContent className="pt-4 text-center">
                  <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Save Score</p>
                  <p className="text-xl font-bold">{result.saveScore}</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Minimax tree: MAX(user) picks best of MIN(risk) evaluated scenarios for both Spend &amp; Save options.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
