import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Plane } from "lucide-react";
import { Trip, TripExpense, getTrips, saveTrips, formatINR } from "@/lib/finance-store";

export default function TripTracker() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [newTripName, setNewTripName] = useState("");
  const [newMember, setNewMember] = useState("");
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");

  useEffect(() => {
    const t = getTrips();
    setTrips(t);
    if (t.length > 0) setSelectedTripId(t[0].id);
  }, []);

  const persist = (t: Trip[]) => { setTrips(t); saveTrips(t); };

  const createTrip = () => {
    if (!newTripName.trim() || newMembers.length < 2) return;
    const trip: Trip = { id: crypto.randomUUID(), name: newTripName.trim(), members: newMembers, expenses: [] };
    const updated = [...trips, trip];
    persist(updated);
    setSelectedTripId(trip.id);
    setNewTripName("");
    setNewMembers([]);
  };

  const addMember = () => {
    const m = newMember.trim();
    if (m && !newMembers.includes(m)) { setNewMembers([...newMembers, m]); setNewMember(""); }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const addExpense = () => {
    if (!selectedTrip || !expDesc.trim() || !expAmount || !expPaidBy) return;
    const expense: TripExpense = { id: crypto.randomUUID(), description: expDesc.trim(), amount: parseFloat(expAmount), paidBy: expPaidBy };
    const updated = trips.map((t) => t.id === selectedTripId ? { ...t, expenses: [...t.expenses, expense] } : t);
    persist(updated);
    setExpDesc(""); setExpAmount(""); setExpPaidBy("");
  };

  const deleteExpense = (eid: string) => {
    const updated = trips.map((t) => t.id === selectedTripId ? { ...t, expenses: t.expenses.filter((e) => e.id !== eid) } : t);
    persist(updated);
  };

  const deleteTrip = () => {
    if (!selectedTripId) return;
    const updated = trips.filter((t) => t.id !== selectedTripId);
    persist(updated);
    setSelectedTripId(updated.length > 0 ? updated[0].id : null);
  };

  // Calculate balances
  const calcBalances = () => {
    if (!selectedTrip) return [];
    const totals: Record<string, number> = {};
    selectedTrip.members.forEach((m) => (totals[m] = 0));
    selectedTrip.expenses.forEach((e) => { totals[e.paidBy] = (totals[e.paidBy] || 0) + e.amount; });
    const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
    const fair = totalSpent / selectedTrip.members.length;
    const balances: { from: string; to: string; amount: number }[] = [];
    const diffs = selectedTrip.members.map((m) => ({ name: m, diff: totals[m] - fair }));
    const debtors = diffs.filter((d) => d.diff < 0).sort((a, b) => a.diff - b.diff);
    const creditors = diffs.filter((d) => d.diff > 0).sort((a, b) => b.diff - a.diff);
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(-debtors[i].diff, creditors[j].diff);
      if (amt > 0) balances.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(amt) });
      debtors[i].diff += amt;
      creditors[j].diff -= amt;
      if (debtors[i].diff >= -0.5) i++;
      if (creditors[j].diff <= 0.5) j++;
    }
    return balances;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>✈️</span> Trip Expense Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Manage shared trip expenses and settle balances</p>
      </div>

      {/* Create Trip */}
      <Card className="shadow-md">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plane className="h-5 w-5 text-primary" /> New Trip</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Trip Name" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} />
          <div className="flex gap-2">
            <Input placeholder="Member name" value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} />
            <Button size="icon" onClick={addMember}><Plus className="h-4 w-4" /></Button>
          </div>
          {newMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newMembers.map((m) => (
                <span key={m} className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">
                  {m}
                  <button onClick={() => setNewMembers(newMembers.filter((x) => x !== m))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <Button onClick={createTrip} disabled={!newTripName.trim() || newMembers.length < 2}>Create Trip</Button>
        </CardContent>
      </Card>

      {trips.length > 0 && (
        <>
          {/* Trip Selector */}
          <div className="flex gap-3 items-center">
            <Select value={selectedTripId || ""} onValueChange={setSelectedTripId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select trip" /></SelectTrigger>
              <SelectContent>
                {trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={deleteTrip}>Delete</Button>
          </div>

          {selectedTrip && (
            <>
              {/* Add Expense */}
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-lg">Add Expense</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Description" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} />
                  <Input type="number" placeholder="Amount (₹)" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
                  <Select value={expPaidBy} onValueChange={setExpPaidBy}>
                    <SelectTrigger><SelectValue placeholder="Paid by" /></SelectTrigger>
                    <SelectContent>
                      {selectedTrip.members.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={addExpense}>Add Expense</Button>
                </CardContent>
              </Card>

              {/* Expenses Table */}
              {selectedTrip.expenses.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader><CardTitle className="text-lg">Expense History</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Paid By</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTrip.expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{e.description}</TableCell>
                            <TableCell>{e.paidBy}</TableCell>
                            <TableCell className="text-right font-semibold">{formatINR(e.amount)}</TableCell>
                            <TableCell><button onClick={() => deleteExpense(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Balances */}
              {selectedTrip.expenses.length > 0 && (
                <Card className="shadow-md border-primary/20">
                  <CardHeader><CardTitle className="text-lg">Settlement</CardTitle></CardHeader>
                  <CardContent>
                    {calcBalances().length > 0 ? (
                      <ul className="space-y-2">
                        {calcBalances().map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-destructive">{b.from}</span>
                            <span className="text-muted-foreground">owes</span>
                            <span className="font-semibold text-success">{b.to}</span>
                            <span className="ml-auto font-bold text-primary">{formatINR(b.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center">All settled! 🎉</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
