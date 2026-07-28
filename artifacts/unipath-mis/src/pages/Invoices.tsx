import { useState } from "react";
import { useLocation } from "wouter";
import { useListInvoices, useDeleteInvoice, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Filter, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getPaymentStatusColor } from "@/lib/utils";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();
  
  const { data: invoicesData, isLoading } = useListInvoices({ 
    search: search || undefined,
    paymentStatus: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    pageSize: 15
  });
  const invoices = invoicesData?.data || [];
  const totalPages = Math.ceil((invoicesData?.total || 0) / (invoicesData?.pageSize || 15));

  const deleteInvoice = useDeleteInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEdit = (invoice: any) => {
    setLocation(`/invoices/${invoice.id}/edit`);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          toast({ title: "Invoice deleted successfully" });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing and invoice generation.</p>
        </div>
        <Button className="gap-2" onClick={() => setLocation("/invoices/new")}>
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search invoices by number or project..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No invoices found.</TableCell></TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{invoice.invoiceNo}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell className="font-mono text-xs">{invoice.projectCode}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{invoice.clientName}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(invoice.paymentStatus)} variant="outline">{invoice.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.invoiceFileId && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" asChild>
                            <a href={`/api/attachments/${invoice.invoiceFileId}`} target="_blank" rel="noreferrer" title="View attached invoice">
                              <FileText className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(invoice)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(invoice.id)}>
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
