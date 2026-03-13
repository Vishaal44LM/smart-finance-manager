import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Scissors } from "lucide-react";
import { formatINR } from "@/lib/finance-store";

export default function ExpenseSplitter() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  const billAmount = parseFloat(amount) || 0;
  const share = participants.length > 0 ? billAmount / participants.length : 0;

  const addParticipant = () => {
    const trimmed = name.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
      setName("");
    }
  };

  const reset = () => {
    setAmount("");
    setName("");
    setParticipants([]);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>💸</span> Expense Splitter
        </h1>
        <p className="text-muted-foreground mt-1">Split bills equally among friends</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Scissors className="h-5 w-5 text-primary" /> Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Total Bill Amount (₹)</label>
            <Input type="number" placeholder="e.g. 2000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Add Participants</label>
            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
              />
              <Button onClick={addParticipant} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">
                  {p}
                  <button onClick={() => setParticipants(participants.filter((x) => x !== p))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={reset} className="w-full">Reset</Button>
        </CardContent>
      </Card>

      {participants.length > 0 && billAmount > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Split Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p}>
                    <TableCell className="font-medium">{p}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatINR(Math.ceil(share))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
