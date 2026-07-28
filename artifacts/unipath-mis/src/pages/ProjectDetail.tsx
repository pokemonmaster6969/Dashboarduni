import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetProject, 
  useUpdateProject, 
  useUpsertQcRecord, 
  useUpsertDataDelivery,
  useCreateInvoice,
  useCreatePayment,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CheckCircle2, XCircle, FileText, Check, AlertCircle, Edit2, Plus } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from "@/lib/utils";

export default function ProjectDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(id || "0", 10);
  
  const { data: project, isLoading, error } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });
  
  const updateProject = useUpdateProject();
  const upsertQc = useUpsertQcRecord();
  const upsertDelivery = useUpsertDataDelivery();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [qcForm, setQcForm] = useState({ qcPass: "", qcFail: "", runNo: "", qcTatStatus: "Normal" });
  const [deliveryForm, setDeliveryForm] = useState({ rawDataSentDate: "", finalDataDate: "" });
  const [projectStatus, setProjectStatus] = useState("");

  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (project && !initializedRef.current) {
      setQcForm({
        qcPass: project.qcRecord?.qcPass?.toString() || "",
        qcFail: project.qcRecord?.qcFail?.toString() || "",
        runNo: project.qcRecord?.runNo || "",
        qcTatStatus: project.qcRecord?.qcTatStatus || "Normal"
      });
      setDeliveryForm({
        rawDataSentDate: project.dataDelivery?.rawDataSentDate?.split('T')[0] || "",
        finalDataDate: project.dataDelivery?.finalDataDate?.split('T')[0] || ""
      });
      setProjectStatus(project.status);
      initializedRef.current = true;
    }
  }, [project]);

  if (isLoading) return <div className="flex h-64 items-center justify-center animate-pulse"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  if (error || !project) return <div className="text-destructive p-8 text-center bg-destructive/10 rounded-lg">Error loading project or project not found.</div>;

  const handleStatusChange = (newStatus: string) => {
    setProjectStatus(newStatus);
    updateProject.mutate(
      { id: projectId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetProjectQueryKey(projectId), (old: any) => old ? { ...old, status: newStatus } : old);
          toast({ title: `Project status updated to ${newStatus}` });
        }
      }
    );
  };

  const handleSaveQc = () => {
    upsertQc.mutate(
      { projectId, data: { 
        qcPass: qcForm.qcPass ? parseInt(qcForm.qcPass, 10) : undefined,
        qcFail: qcForm.qcFail ? parseInt(qcForm.qcFail, 10) : undefined,
        runNo: qcForm.runNo,
        qcTatStatus: qcForm.qcTatStatus
      }},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "QC Record saved" });
        }
      }
    );
  };

  const handleSaveDelivery = () => {
    upsertDelivery.mutate(
      { projectId, data: { 
        rawDataSentDate: deliveryForm.rawDataSentDate || undefined,
        finalDataDate: deliveryForm.finalDataDate || undefined
      }},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Data Delivery saved" });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")} className="h-8 w-8 rounded-full border bg-background shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">{project.projectCode}</h1>
            <Badge className={getStatusColor(projectStatus)} variant="outline">{projectStatus}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{project.clientName} • {project.serviceName}</p>
        </div>
        
        <Select value={projectStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="QC Fail">QC Fail</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={() => setLocation(`/projects/${projectId}/edit`)} variant="outline" className="gap-2">
          <Edit2 className="w-4 h-4" /> Edit Project
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 space-x-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Overview</TabsTrigger>
          <TabsTrigger value="qc" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">QC Record</TabsTrigger>
          <TabsTrigger value="delivery" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Data Delivery</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Invoices & Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Lab Submission</div>
                  <div className="col-span-2 font-medium">{formatDate(project.labSubmissionDate)}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Client</div>
                  <div className="col-span-2 font-medium">{project.clientName}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Scientist</div>
                  <div className="col-span-2 font-medium">{project.scientistName}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Service</div>
                  <div className="col-span-2 font-medium">{project.serviceName}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Sample Type</div>
                  <div className="col-span-2 font-medium">{project.sampleType}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 pb-1">
                  <div className="text-muted-foreground">Analysis</div>
                  <div className="col-span-2 font-medium">{project.withAnalysis}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Commercials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">No. of Samples</div>
                  <div className="col-span-2 font-medium">{project.noOfSamples}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Data Req.</div>
                  <div className="col-span-2 font-medium">{project.dataRequirement}</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Total GB</div>
                  <div className="col-span-2 font-medium">{project.totalGb} GB</div>
                </div>
                <div className="grid grid-cols-3 gap-1 border-b pb-3">
                  <div className="text-muted-foreground">Rate/Sample</div>
                  <div className="col-span-2 font-medium">{formatCurrency(project.ratePerSample)}</div>
                </div>
                {project.quotationNo && (
                  <div className="grid grid-cols-3 gap-1 border-b pb-3">
                    <div className="text-muted-foreground">Quotation No</div>
                    <div className="col-span-2 font-medium">{project.quotationNo}</div>
                  </div>
                )}
                {project.quotationFileId && (
                  <div className="grid grid-cols-3 gap-1 border-b pb-3">
                    <div className="text-muted-foreground">Quotation File</div>
                    <div className="col-span-2">
                      <a 
                        href={`/api/attachments/${project.quotationFileId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Quotation
                      </a>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1 bg-muted/50 p-3 rounded-md">
                  <div className="text-muted-foreground font-semibold">Total Cost</div>
                  <div className="col-span-2 font-bold font-mono text-primary">{formatCurrency(project.totalProjectCost)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qc" className="mt-6 max-w-2xl">
          <Card className="shadow-sm border-t-4 border-t-orange-500">
            <CardHeader>
              <CardTitle>QC Record</CardTitle>
              <CardDescription>Track quality control metrics for the sequencing run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Samples Passed QC</Label>
                  <Input 
                    type="number" 
                    value={qcForm.qcPass} 
                    onChange={e => setQcForm({...qcForm, qcPass: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Samples Failed QC</Label>
                  <Input 
                    type="number" 
                    value={qcForm.qcFail} 
                    onChange={e => setQcForm({...qcForm, qcFail: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Run Number</Label>
                  <Input 
                    value={qcForm.runNo} 
                    onChange={e => setQcForm({...qcForm, runNo: e.target.value})} 
                    placeholder="e.g. RUN-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>QC TAT Status</Label>
                  <Select value={qcForm.qcTatStatus} onValueChange={v => setQcForm({...qcForm, qcTatStatus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="Fast-tracked">Fast-tracked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveQc} disabled={upsertQc.isPending} className="gap-2">
                  <Save className="w-4 h-4" /> Save QC Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6 max-w-2xl">
          <Card className="shadow-terra border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Data Delivery</CardTitle>
              <CardDescription>Log data delivery milestones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Raw Data Sent Date</Label>
                  <Input 
                    type="date" 
                    value={deliveryForm.rawDataSentDate} 
                    onChange={e => setDeliveryForm({...deliveryForm, rawDataSentDate: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Final Data/Report Date</Label>
                  <Input 
                    type="date" 
                    value={deliveryForm.finalDataDate} 
                    onChange={e => setDeliveryForm({...deliveryForm, finalDataDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveDelivery} disabled={upsertDelivery.isPending} className="gap-2">
                  <Save className="w-4 h-4" /> Save Delivery Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <div className="space-y-8">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Billing history for this project.</CardDescription>
                </div>
                <Button 
                  onClick={() => setLocation(`/invoices/new?projectId=${projectId}&backToProject=${projectId}`)} 
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!project.invoices || project.invoices.length === 0) ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices generated yet.</TableCell></TableRow>
                    ) : (
                      project.invoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.totalAmount)}</TableCell>
                          <TableCell><Badge className={getPaymentStatusColor(inv.paymentStatus)} variant="outline">{inv.paymentStatus}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {inv.invoiceFileId && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" asChild>
                                  <a href={`/api/attachments/${inv.invoiceFileId}`} target="_blank" rel="noreferrer" title="View invoice file">
                                    <FileText className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                                onClick={() => setLocation(`/invoices/${inv.id}/edit?backToProject=${projectId}`)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Payments Received</CardTitle>
                  <CardDescription>Payment history for this project.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice Ref</TableHead>
                      <TableHead className="text-right">Amount Received</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!project.payments || project.payments.length === 0) ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments received yet.</TableCell></TableRow>
                    ) : (
                      project.payments.map(pay => (
                        <TableRow key={pay.id}>
                          <TableCell>{formatDate(pay.paymentReceivedDate)}</TableCell>
                          <TableCell className="font-mono text-xs">{pay.invoiceNo || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-600">+{formatCurrency(pay.receivedAmount)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{pay.notes || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
