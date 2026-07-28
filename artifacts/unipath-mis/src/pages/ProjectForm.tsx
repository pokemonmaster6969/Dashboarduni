import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useCreateProject, 
  useGetProject,
  useUpdateProject,
  getGetProjectQueryKey,
  useListClients, 
  useListServices, 
  useListScientists, 
  useListTerritories, 
  useListSalesPersons,
  useCreateClient,
  useCreateService,
  useCreateScientist,
  useCreateTerritory
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { ArrowLeft, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  projectCode: z.string().min(1, "Project Code is required"),
  date: z.string().min(1, "Date is required"),
  labSubmissionDate: z.string().optional(),
  
  clientId: z.string().min(1, "Client is required"),
  billingClientId: z.string().optional().or(z.literal("")),
  
  serviceId: z.string().min(1, "Service is required"),
  
  scientistId: z.string().optional().or(z.literal("")),
  
  territoryId: z.string().optional().or(z.literal("")),
  salesPersonId: z.string().optional().or(z.literal("")),
  sampleType: z.string().optional(),
  withAnalysis: z.string().optional(),
  noOfSamples: z.coerce.number().min(1, "Must have at least 1 sample"),
  dataRequirement: z.string().optional(),
  gbPerSample: z.coerce.number().optional(),
  ratePerSample: z.coerce.number().min(0),
  gst: z.coerce.number().optional(),
  quotationNo: z.string().optional(),
  city: z.string().optional(),
  status: z.string().default("Active"),
  remark: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectForm() {
  const { id } = useParams();
  const projectId = id ? parseInt(id, 10) : null;
  const isEditMode = projectId !== null && !isNaN(projectId);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const createClient = useCreateClient();
  const createService = useCreateService();
  const createScientist = useCreateScientist();

  const { data: project } = useGetProject(projectId || 0, {
    query: { enabled: isEditMode, queryKey: getGetProjectQueryKey(projectId || 0) }
  });

  const { data: clients = [] } = useListClients();
  const { data: services = [] } = useListServices();
  const { data: scientists = [] } = useListScientists();
  const { data: territories = [] } = useListTerritories();
  const { data: salesPersons = [] } = useListSalesPersons();

  const [uploadingQuotation, setUploadingQuotation] = useState(false);
  const [quotationFileId, setQuotationFileId] = useState<number | null>(null);
  const [quotationFileName, setQuotationFileName] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectCode: "",
      date: new Date().toISOString().split('T')[0],
      clientId: "",
      serviceId: "",
      scientistId: "",
      billingClientId: "",
      territoryId: "",
      salesPersonId: "",
      noOfSamples: 1,
      ratePerSample: 0,
      gst: 18,
      status: "Active",
      withAnalysis: "No"
    },
  });

  // Pre-fill form values in Edit Mode
  useEffect(() => {
    if (isEditMode && project) {
      form.reset({
        projectCode: project.projectCode || "",
        date: project.date || "",
        labSubmissionDate: project.labSubmissionDate || "",
        clientId: project.clientId ? String(project.clientId) : "",
        billingClientId: project.billingClientId ? String(project.billingClientId) : "",
        serviceId: project.serviceId ? String(project.serviceId) : "",
        scientistId: project.scientistId ? String(project.scientistId) : "",
        territoryId: project.territoryId ? String(project.territoryId) : "",
        salesPersonId: project.salesPersonId ? String(project.salesPersonId) : "",
        sampleType: project.sampleType || "",
        withAnalysis: project.withAnalysis || "No",
        noOfSamples: project.noOfSamples || 1,
        dataRequirement: project.dataRequirement || "",
        gbPerSample: project.gbPerSample || undefined,
        ratePerSample: project.ratePerSample || 0,
        gst: project.gst || 18,
        quotationNo: project.quotationNo || "",
        city: project.city || "",
        status: project.status || "Active",
        remark: project.remark || "",
      });
      setQuotationFileId(project.quotationFileId || null);
      setQuotationFileName(project.quotationFileId ? `Attached File (ID: ${project.quotationFileId})` : null);
    }
  }, [isEditMode, project, form]);

  const handleQuotationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQuotation(true);
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
        setQuotationFileId(attachment.id);
        setQuotationFileName(file.name);
        toast({ title: "Quotation uploaded successfully" });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Quotation upload failed", description: err.message });
    } finally {
      setUploadingQuotation(false);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      let clientId: number | undefined = undefined;
      let serviceId: number | undefined = undefined;
      let scientistId: number | undefined = undefined;
      let territoryId: number | undefined = undefined;
      let salesPersonId: number | undefined = undefined;
      let billingClientId: number | undefined = undefined;

      // 1. Create Client if custom name is written
      if (data.clientId) {
        if (data.clientId.startsWith("__custom__:")) {
          const customName = data.clientId.replace("__custom__:", "");
          const newClient = await createClient.mutateAsync({ data: { name: customName } });
          clientId = newClient.id;
        } else {
          clientId = Number(data.clientId);
        }
      }

      // 2. Create Service if custom name is written
      if (data.serviceId) {
        if (data.serviceId.startsWith("__custom__:")) {
          const customName = data.serviceId.replace("__custom__:", "");
          const newService = await createService.mutateAsync({ data: { name: customName } });
          serviceId = newService.id;
        } else {
          serviceId = Number(data.serviceId);
        }
      }

      // 3. Create Scientist if custom name is written
      if (data.scientistId) {
        if (data.scientistId.startsWith("__custom__:")) {
          const customName = data.scientistId.replace("__custom__:", "");
          const newScientist = await createScientist.mutateAsync({ data: { name: customName } });
          scientistId = newScientist.id;
        } else {
          scientistId = Number(data.scientistId);
        }
      }

      // Resolve optional billingClient
      if (data.billingClientId) {
        if (data.billingClientId.startsWith("__custom__:")) {
          const customName = data.billingClientId.replace("__custom__:", "");
          const newClient = await createClient.mutateAsync({ data: { name: customName } });
          billingClientId = newClient.id;
        } else {
          billingClientId = Number(data.billingClientId);
        }
      }

      // Resolve optional territory
      if (data.territoryId) {
        territoryId = Number(data.territoryId);
      }

      // Resolve optional salesPerson
      if (data.salesPersonId) {
        salesPersonId = Number(data.salesPersonId);
      }

      // Calculate total amount
      const totalAmount = data.noOfSamples * data.ratePerSample;
      const gstAmount = totalAmount * ((data.gst || 0) / 100);
      const totalProjectCost = totalAmount + gstAmount;
      
      const payload = {
        projectCode: data.projectCode,
        date: data.date,
        labSubmissionDate: data.labSubmissionDate || undefined,
        clientId,
        billingClientId,
        serviceId,
        scientistId,
        territoryId,
        salesPersonId,
        sampleType: data.sampleType || undefined,
        withAnalysis: data.withAnalysis || undefined,
        noOfSamples: data.noOfSamples,
        dataRequirement: data.dataRequirement || undefined,
        gbPerSample: data.gbPerSample || undefined,
        ratePerSample: data.ratePerSample,
        gst: data.gst || undefined,
        totalAmount,
        totalProjectCost,
        quotationNo: data.quotationNo || undefined,
        quotationFileId: quotationFileId || undefined,
        city: data.city || undefined,
        status: data.status,
        remark: data.remark || undefined,
      };

      if (isEditMode) {
        await updateProject.mutateAsync({ id: projectId!, data: payload }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId!) });
            toast({ title: "Project updated successfully" });
            setLocation(`/projects/${projectId}`);
          }
        });
      } else {
        await createProject.mutateAsync({ data: payload }, {
          onSuccess: (res) => {
            toast({ title: "Project created successfully" });
            setLocation(`/projects/${res.id}`);
          }
        });
      }
    } catch (err: any) {
      toast({ 
        title: isEditMode ? "Error updating project" : "Error creating project", 
        description: err.message || "Could not save custom records"
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")} className="h-8 w-8 rounded-full border bg-background shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edit Project" : "New Project"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Modify details of the sequencing project." : "Register a new sequencing project."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm border-none">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="projectCode" render={({ field }) => (
                <FormItem><FormLabel>Project Code *</FormLabel><FormControl><Input placeholder="e.g. NGS 26001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Registration Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              {/* Client Auto-complete Combobox */}
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search or select client..."
                      emptyText="No clients found."
                      allowCustom
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Service Auto-complete Combobox */}
              <FormField control={form.control} name="serviceId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={services.map(s => ({ value: String(s.id), label: s.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search or select service..."
                      emptyText="No services found."
                      allowCustom
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Scientist Auto-complete Combobox */}
              <FormField control={form.control} name="scientistId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Scientist</FormLabel>
                  <FormControl>
                    <Combobox
                      options={scientists.map(s => ({ value: String(s.id), label: s.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search or select scientist..."
                      emptyText="No scientists found."
                      allowCustom
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="labSubmissionDate" render={({ field }) => (
                <FormItem><FormLabel>Lab Submission Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader><CardTitle>Technical Specs</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="sampleType" render={({ field }) => (
                <FormItem><FormLabel>Sample Type</FormLabel><FormControl><Input placeholder="e.g. DNA, RNA, Tissue" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="withAnalysis" render={({ field }) => (
                <FormItem><FormLabel>With Analysis?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="dataRequirement" render={({ field }) => (
                <FormItem><FormLabel>Data Requirement</FormLabel><FormControl><Input placeholder="e.g. FASTQ, BAM" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="gbPerSample" render={({ field }) => (
                <FormItem><FormLabel>GB Per Sample</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none border-t-4 border-t-primary">
            <CardHeader><CardTitle>Commercials</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="noOfSamples" render={({ field }) => (
                <FormItem><FormLabel>No. of Samples *</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="ratePerSample" render={({ field }) => (
                <FormItem><FormLabel>Rate Per Sample (₹) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="gst" render={({ field }) => (
                <FormItem><FormLabel>GST (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                <FormField control={form.control} name="quotationNo" render={({ field }) => (
                  <FormItem><FormLabel>Quotation No</FormLabel><FormControl><Input placeholder="e.g. UG/NGS/TP/26001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <FormItem>
                  <FormLabel>Quotation File (PDF or Image)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <Input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        onChange={handleQuotationFileChange} 
                        disabled={uploadingQuotation}
                        className="cursor-pointer bg-background"
                      />
                      {uploadingQuotation && <p className="text-xs text-muted-foreground animate-pulse">Uploading file...</p>}
                      {!uploadingQuotation && quotationFileName && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 font-medium">✓ Uploaded: {quotationFileName}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-muted-foreground hover:text-destructive" 
                            onClick={() => {
                              setQuotationFileId(null);
                              setQuotationFileName(null);
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
              </div>
            </CardContent>
            
            <div className="px-6 py-4 bg-[#fcfaf7] border-t flex justify-end">
               <Button type="submit" size="lg" disabled={createProject.isPending} className="gap-2 bg-primary hover:bg-primary/95 text-white">
                 <Save className="w-5 h-5" /> Save Project
               </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
