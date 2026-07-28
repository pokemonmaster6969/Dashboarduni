import { useState } from "react";
import { useListPayments, useCreatePayment, useUpdatePayment, useDeletePayment, getListPaymentsQueryKey, useListProjects, useListInvoices } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const paymentSchema = z.object({
  projectId: z.coerce.number().min(1, "Project is required"),
  invoiceId: z.coerce.number().optional(),
  receivedAmount: z.coerce.number().min(0, "Received amount is required"),
  paymentReceivedDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function Payments() {
  const [page, setPage] = useState(1);
  const { data: paymentsData, isLoading } = useListPayments({ page, pageSize: 15 });
  const payments = paymentsData?.data || [];
  const totalPages = Math.ceil((paymentsData?.total || 0) / (paymentsData?.pageSize || 15));

  const { data: projectsData } = useListProjects({ pageSize: 100 });
  const projects = projectsData?.data || [];
  
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { projectId: 0, invoiceId: undefined, receivedAmount: 0, paymentReceivedDate: new Date().toISOString().split('T')[0], notes: "" },
  });

  const onSubmit = (data: PaymentFormValues) => {
    if (editingId) {
      updatePayment.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          setIsOpen(false);
          toast({ title: "Payment updated successfully" });
        }
      });
    } else {
      createPayment.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          setIsOpen(false);
          toast({ title: "Payment recorded successfully" });
        }
      });
    }
  };

  const handleEdit = (payment: any) => {
    setEditingId(payment.id);
    form.reset({ 
      projectId: payment.projectId,
      invoiceId: payment.invoiceId || undefined,
      receivedAmount: payment.receivedAmount || 0,
      paymentReceivedDate: payment.paymentReceivedDate ? payment.paymentReceivedDate.split('T')[0] : "",
      notes: payment.notes || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      deletePayment.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          toast({ title: "Payment deleted successfully" });
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({ projectId: 0, invoiceId: undefined, receivedAmount: 0, paymentReceivedDate: new Date().toISOString().split('T')[0], notes: "" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Record and track payment receipts.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Record"} Payment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem><FormLabel>Project *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.projectCode} - {p.clientName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="receivedAmount" render={({ field }) => (
                    <FormItem><FormLabel>Received Amount *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentReceivedDate" render={({ field }) => (
                    <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes / Reference</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createPayment.isPending || updatePayment.isPending}>
                    {editingId ? "Save Changes" : "Record Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invoice Ref</TableHead>
                <TableHead className="text-right">Amount Received</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No payments found.</TableCell></TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">{formatDate(payment.paymentReceivedDate)}</TableCell>
                    <TableCell className="font-medium">{payment.clientName}</TableCell>
                    <TableCell className="font-mono text-xs">{payment.invoiceNo || "Unlinked"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 font-semibold">+{formatCurrency(payment.receivedAmount)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{payment.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(payment)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(payment.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
