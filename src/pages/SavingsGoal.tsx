import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar } from "lucide-react";
import { getSavingsGoal, saveSavingsGoal, formatINR, SavingsGoal } from "@/lib/finance-store";

export default function SavingsGoalPage() {
  const [goal, setGoal] = useState<SavingsGoal>({ targetAmount: 0, deadlineDate: "", savedSoFar: 0 });

  useEffect(() => setGoal(getSavingsGoal()), []);

  const update = (g: SavingsGoal) => { setGoal(g); saveSavingsGoal(g); };

  const daysLeft = goal.deadlineDate
    ? Math.max(0, Math.ceil((new Date(goal.deadlineDate).getTime() - Date.now()) / 86400000))
    : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedSoFar);
  const dailySaving = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
  const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedSoFar / goal.targetAmount) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>🎯</span> Savings Goal Calculator
        </h1>
        <p className="text-muted-foreground mt-1">Plan your savings to reach your financial goals</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Goal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Target Savings Amount (₹)</Label>
            <Input type="number" placeholder="e.g. 50000" value={goal.targetAmount || ""} onChange={(e) => update({ ...goal, targetAmount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label className="text-muted-foreground">Deadline Date</Label>
            <Input type="date" value={goal.deadlineDate} onChange={(e) => update({ ...goal, deadlineDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-muted-foreground">Already Saved (₹)</Label>
            <Input type="number" placeholder="0" value={goal.savedSoFar || ""} onChange={(e) => update({ ...goal, savedSoFar: parseFloat(e.target.value) || 0 })} />
          </div>
        </CardContent>
      </Card>

      {goal.targetAmount > 0 && (
        <Card className="shadow-md border-primary/20">
          <CardHeader><CardTitle className="text-lg">Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-4" />
            <p className="text-center text-sm text-muted-foreground">{progress}% of goal reached</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-primary">{formatINR(remaining)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> Days Left</p>
                <p className="text-xl font-bold text-foreground">{daysLeft}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Daily Saving</p>
                <p className="text-xl font-bold text-success">{formatINR(dailySaving)}/day</p>
              </div>
            </div>

            {progress >= 100 && (
              <p className="text-center text-success font-semibold text-lg mt-2">🎉 Goal Reached!</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
