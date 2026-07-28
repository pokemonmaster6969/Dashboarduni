import { useState } from "react";
import { useListTerritories, useCreateTerritory, useUpdateTerritory, useDeleteTerritory, getListTerritoriesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const territorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type TerritoryFormValues = z.infer<typeof territorySchema>;

export default function Territories() {
  const { data: territories = [], isLoading } = useListTerritories();
  const createTerritory = useCreateTerritory();
  const updateTerritory = useUpdateTerritory();
  const deleteTerritory = useDeleteTerritory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<TerritoryFormValues>({
    resolver: zodResolver(territorySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (data: TerritoryFormValues) => {
    if (editingId) {
      updateTerritory.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTerritoriesQueryKey() });
          setIsOpen(false);
          toast({ title: "Territory updated successfully" });
        }
      });
    } else {
      createTerritory.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTerritoriesQueryKey() });
          setIsOpen(false);
          toast({ title: "Territory created successfully" });
        }
      });
    }
  };

  const handleEdit = (territory: any) => {
    setEditingId(territory.id);
    form.reset({ name: territory.name });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this territory?")) {
      deleteTerritory.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTerritoriesQueryKey() });
          toast({ title: "Territory deleted successfully" });
        }
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset({ name: "" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Territories</h1>
          <p className="text-muted-foreground mt-1">Manage sales and operational regions.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Territory</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Territory</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createTerritory.isPending || updateTerritory.isPending}>
                    {editingId ? "Save Changes" : "Create Territory"}
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
                <TableHead>Territory Name</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : territories.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No territories found.</TableCell></TableRow>
              ) : (
                territories.map((territory) => (
                  <TableRow key={territory.id}>
                    <TableCell className="font-medium">{territory.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(territory)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(territory.id)}>
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
