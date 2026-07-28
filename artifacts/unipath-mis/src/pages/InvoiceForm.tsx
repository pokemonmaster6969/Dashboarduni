import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useCreateInvoice, 
  useUpdateInvoice, 
  useGetInvoice,
  getGetInvoiceQueryKey,
  useListProjects,
  getListInvoicesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { ArrowLeft, Save, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const invoiceSchema = z.object({
  projectId: z.coerce.number().min(1, "Project is required"),
  invoiceNo: z.string().min(1, "Invoice No is required"),
  invoiceDate: z.string().min(1, "Date is required"),
  qcPassSamples: z.coerce.number().optional(),
  subtotal: z.coerce.number().optional(),
  gst: z.coerce.number().optional(),
  totalAmount: z.coerce.number().min(0, "Total amount is required"),
  paymentStatus: z.string().default("Pending"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoiceForm() {
  const { id } = useParams();
  const invoiceId = id ? parseInt(id, 10) : null;
  const isEditMode = invoiceId !== null && !isNaN(invoiceId);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  
  const { data: invoice } = useGetInvoice(invoiceId || 0, {
    query: { enabled: isEditMode, queryKey: getGetInvoiceQueryKey(invoiceId || 0) }
  });

  const { data: projectsData } = useListProjects({ pageSize: 200 });
  const projects = projectsData?.data || [];

  const [uploadingFile, setUploadingFile] = useState(false);
  const [invoiceFileId, setInvoiceFileId] = useState<number | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const queryProjectId = searchParams.get("projectId");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      projectId: queryProjectId ? parseInt(queryProjectId, 10) : 0,
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      qcPassSamples: 0,
      subtotal: 0,
      gst: 0,
      totalAmount: 0,
      paymentStatus: "Pending",
    },
  });

  // Pre-fill form values in Edit Mode
  useEffect(() => {
    if (isEditMode && invoice) {
      form.reset({
        projectId: invoice.projectId,
        invoiceNo: invoice.invoiceNo || "",
        invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : "",
        qcPassSamples: invoice.qcPassSamples || 0,
        subtotal: invoice.subtotal || 0,
        gst: invoice.gst || 0,
        totalAmount: invoice.totalAmount || 0,
        paymentStatus: invoice.paymentStatus || "Pending",
      });
      setInvoiceFileId(invoice.invoiceFileId || null);
      setInvoiceFileName(invoice.invoiceFileId ? `Attached File (ID: ${invoice.invoiceFileId})` : null);
    }
  }, [isEditMode, invoice, form]);

  const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const res = await fetch("/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data,
          }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const attachment = await res.json();
        setInvoiceFileId(attachment.id);
        setInvoiceFileName(file.name);
        toast({ title: "Invoice file uploaded successfully" });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Invoice file upload failed", description: err.message });
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    const payload = {
      ...data,
      invoiceFileId: invoiceFileId || undefined
    };

    try {
      if (isEditMode) {
        await updateInvoice.mutateAsync({ id: invoiceId!, data: payload }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId!) });
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            toast({ title: "Invoice updated successfully" });
            
            // Redirect back to project if referenced in search query
            const backProject = searchParams.get("backToProject");
            if (backProject) {
              setLocation(`/projects/${backProject}`);
            } else {
              setLocation("/invoices");
            }
          }
        });
      } else {
        await createInvoice.mutateAsync({ data: payload }, {
          onSuccess: (res) => {
            toast({ title: "Invoice created successfully" });
            
            const backProject = searchParams.get("backToProject");
            if (backProject) {
              setLocation(`/projects/${backProject}`);
            } else {
              setLocation("/invoices");
            }
          }
        });
      }
    } catch (err: any) {
      toast({ 
        title: isEditMode ? "Error updating invoice" : "Error creating invoice", 
        description: err.message || "Could not save invoice"
      });
    }
  };

  // Determine back navigation link
  const backProject = searchParams.get("backToProject");
  const handleBack = () => {
    if (backProject) {
      setLocation(`/projects/${backProject}`);
    } else {
      setLocation("/invoices");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 rounded-full border bg-background shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edit Invoice" : "New Invoice"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Modify invoice details and billing status." : "Create and register a new invoice."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm border-none">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project selector */}
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Project *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={projects.map(p => ({ value: String(p.id), label: `${p.projectCode} - ${p.clientName || 'No Client'}` }))}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder="Search or select project..."
                      emptyText="No projects found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="invoiceNo" render={({ field }) => (
                <FormItem><FormLabel>Invoice Number *</FormLabel><FormControl><Input placeholder="e.g. INV-2026-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                <FormItem><FormLabel>Invoice Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none border-t-4 border-t-primary">
            <CardHeader><CardTitle>Billing & Payments</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="subtotal" render={({ field }) => (
                <FormItem><FormLabel>Subtotal (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="gst" render={({ field }) => (
                <FormItem><FormLabel>GST (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="totalAmount" render={({ field }) => (
                <FormItem><FormLabel>Total Amount (₹) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                <FormItem><FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="qcPassSamples" render={({ field }) => (
                <FormItem><FormLabel>QC Pass Samples</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader><CardTitle>Attachment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormLabel>Invoice PDF or Image File</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <Input 
                      type="file" 
                      accept="application/pdf,image/*" 
                      onChange={handleInvoiceFileChange} 
                      disabled={uploadingFile}
                      className="cursor-pointer bg-background"
                    />
                    {uploadingFile && <p className="text-xs text-muted-foreground animate-pulse">Uploading file...</p>}
                    {!uploadingFile && invoiceFileName && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> ✓ Attached: {invoiceFileName}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-muted-foreground hover:text-destructive" 
                          onClick={() => {
                            setInvoiceFileId(null);
                            setInvoiceFileName(null);
                          }}
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            </CardContent>
            
            <div className="px-6 py-4 bg-[#fcfaf7] border-t flex justify-end">
               <Button type="submit" size="lg" disabled={createInvoice.isPending || updateInvoice.isPending} className="gap-2 bg-primary hover:bg-primary/95 text-white">
                 <Save className="w-5 h-5" /> {isEditMode ? "Save Changes" : "Save Invoice"}
               </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
