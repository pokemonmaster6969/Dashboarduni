import { useState } from "react";
import { useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  serviceHead: z.string().optional(),
  category: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function Services() {
  const [search, setSearch] = useState("");
  const { data: services = [], isLoading } = useListServices({ search: search || undefined });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", serviceHead: "", category: "" },
  });

  const onSubmit = (data: ServiceFormValues) => {
    if (editingId) {
      updateService.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsOpen(false);
          toast({ title: "Service updated successfully" });
        }
      });
    } else {
      createService.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsOpen(false);
          toast({ title: "Service created successfully" });
        }
      });
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    form.reset({ 
      name: service.name, 
      serviceHead: service.serviceHead || "", 
      category: service.category || "" 
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteService.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          toast({ title: "Service deleted successfully" });
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({ name: "", serviceHead: "", category: "" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">Manage sequencing and bioinformatics services.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Service</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="serviceHead" render={({ field }) => (
                  <FormItem><FormLabel>Service Head (Scientist)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NGS">NGS</SelectItem>
                        <SelectItem value="Bioinformatics">Bioinformatics</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                    {editingId ? "Save Changes" : "Create Service"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search services..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Service Head</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : services.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No services found.</TableCell></TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell><span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">{service.category || "Uncategorized"}</span></TableCell>
                    <TableCell className="text-muted-foreground">{service.serviceHead || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(service)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
