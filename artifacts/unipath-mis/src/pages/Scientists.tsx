import { useState } from "react";
import { useListScientists, useCreateScientist, useUpdateScientist, useDeleteScientist, getListScientistsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const scientistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designation: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type ScientistFormValues = z.infer<typeof scientistSchema>;

export default function Scientists() {
  const { data: scientists = [], isLoading } = useListScientists();
  const createScientist = useCreateScientist();
  const updateScientist = useUpdateScientist();
  const deleteScientist = useDeleteScientist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<ScientistFormValues>({
    resolver: zodResolver(scientistSchema),
    defaultValues: { name: "", designation: "", email: "" },
  });

  const onSubmit = (data: ScientistFormValues) => {
    if (editingId) {
      updateScientist.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScientistsQueryKey() });
          setIsOpen(false);
          toast({ title: "Scientist updated successfully" });
        }
      });
    } else {
      createScientist.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScientistsQueryKey() });
          setIsOpen(false);
          toast({ title: "Scientist created successfully" });
        }
      });
    }
  };

  const handleEdit = (scientist: any) => {
    setEditingId(scientist.id);
    form.reset({ 
      name: scientist.name, 
      designation: scientist.designation || "", 
      email: scientist.email || "" 
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this scientist?")) {
      deleteScientist.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScientistsQueryKey() });
          toast({ title: "Scientist deleted successfully" });
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({ name: "", designation: "", email: "" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scientists</h1>
          <p className="text-muted-foreground mt-1">Manage laboratory personnel.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Scientist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Scientist</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createScientist.isPending || updateScientist.isPending}>
                    {editingId ? "Save Changes" : "Create Scientist"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : scientists.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No scientists found.</TableCell></TableRow>
              ) : (
                scientists.map((scientist) => (
                  <TableRow key={scientist.id}>
                    <TableCell className="font-medium">{scientist.name}</TableCell>
                    <TableCell className="text-muted-foreground">{scientist.designation || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{scientist.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(scientist)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(scientist.id)}>
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
