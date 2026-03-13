import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Tv } from "lucide-react";
import { Subscription, getSubscriptions, saveSubscriptions, formatINR } from "@/lib/finance-store";

const PRESETS = ["Netflix", "Spotify", "Amazon Prime", "YouTube Premium", "Disney+ Hotstar", "JioCinema"];

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => setSubs(getSubscriptions()), []);

  const persist = (s: Subscription[]) => { setSubs(s); saveSubscriptions(s); };

  const add = () => {
    if (!name.trim() || !cost) return;
    persist([...subs, { id: crypto.randomUUID(), name: name.trim(), monthlyCost: parseFloat(cost) }]);
    setName(""); setCost("");
  };

  const remove = (id: string) => persist(subs.filter((s) => s.id !== id));

  const totalMonthly = subs.reduce((a, b) => a + b.monthlyCost, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>📺</span> Subscription Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track your recurring subscription costs</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Tv className="h-5 w-5 text-primary" /> Add Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => setName(p)} className={name === p ? "border-primary bg-primary/10" : ""}>
                {p}
              </Button>
            ))}
          </div>
          <Input placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" placeholder="Monthly cost (₹)" value={cost} onChange={(e) => setCost(e.target.value)} />
          <Button onClick={add} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add</Button>
        </CardContent>
      </Card>

      {subs.length > 0 && (
        <>
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Your Subscriptions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{formatINR(s.monthlyCost)}</TableCell>
                      <TableCell>
                        <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-2xl font-bold text-primary">{formatINR(totalMonthly)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Yearly</p>
                <p className="text-2xl font-bold text-secondary">{formatINR(totalMonthly * 12)}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
