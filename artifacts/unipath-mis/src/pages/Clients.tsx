import { useState } from "react";
import { useListClients, useCreateClient, useUpdateClient, useDeleteClient, getListClientsQueryKey, useListTerritories } from "@workspace/api-client-react";
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

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  billingName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  contactNo: z.string().optional(),
  city: z.string().optional(),
  territoryId: z.coerce.number().optional().or(z.literal(0)),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients = [], isLoading } = useListClients({ search: search || undefined });
  const { data: territories = [] } = useListTerritories();
  
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", billingName: "", email: "", contactNo: "", city: "", territoryId: 0 },
  });

  const onSubmit = (data: ClientFormValues) => {
    const payload = {
      ...data,
      territoryId: data.territoryId || undefined,
    };
    
    if (editingId) {
      updateClient.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setIsOpen(false);
          toast({ title: "Client updated successfully" });
        }
      });
    } else {
      createClient.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setIsOpen(false);
          toast({ title: "Client created successfully" });
        }
      });
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    form.reset({ 
      name: client.name, 
      billingName: client.billingName || "", 
      email: client.email || "",
      contactNo: client.contactNo || "",
      city: client.city || "",
      territoryId: client.territoryId || 0
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Client deleted successfully" });
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({ name: "", billingName: "", email: "", contactNo: "", city: "", territoryId: 0 });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage institutions, universities, and corporate clients.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Client</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="billingName" render={({ field }) => (
                    <FormItem><FormLabel>Billing Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactNo" render={({ field }) => (
                    <FormItem><FormLabel>Contact No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="territoryId" render={({ field }) => (
                    <FormItem><FormLabel>Territory</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : undefined}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select territory" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {territories.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createClient.isPending || updateClient.isPending}>
                    {editingId ? "Save Changes" : "Create Client"}
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
              placeholder="Search clients..." 
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
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : clients.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No clients found.</TableCell></TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium text-primary">{client.name}</div>
                      {client.billingName && client.billingName !== client.name && (
                        <div className="text-xs text-muted-foreground mt-0.5">Billing: {client.billingName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{client.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">{client.contactNo || ""}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.city || "-"}</TableCell>
                    <TableCell>
                      {client.territoryName ? (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{client.territoryName}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(client)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(client.id)}>
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
