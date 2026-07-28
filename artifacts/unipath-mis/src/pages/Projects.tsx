import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Search, Plus, Filter } from "lucide-react";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  
  const { data: projectsData, isLoading } = useListProjects({ 
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: 15
  });

  const projects = projectsData?.data || [];
  const totalPages = Math.ceil((projectsData?.total || 0) / (projectsData?.pageSize || 15));

  const hasActiveFilters = Boolean(search || statusFilter !== "ALL" || dateFrom || dateTo);

  const handleReset = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage laboratory sequencing projects.</p>
        </div>
        <Button onClick={() => setLocation("/projects/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by code, client, or service..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-background h-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="bg-background h-9">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2.5 h-9 w-full sm:w-auto">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="text-xs bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-foreground w-full sm:w-28"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2.5 h-9 w-full sm:w-auto">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="text-xs bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-foreground w-full sm:w-28"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground">
                Reset
              </Button>
            )}
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Sub. Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-24" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-8" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse rounded w-20" /></TableCell>
                    <TableCell><div className="h-6 bg-muted animate-pulse rounded-full w-20" /></TableCell>
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No projects found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="cursor-pointer group"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary">{project.projectCode}</TableCell>
                    <TableCell className="font-medium">{project.clientName}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{project.serviceName}</TableCell>
                    <TableCell>{project.noOfSamples}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(project.totalProjectCost || 0)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(project.labSubmissionDate || project.date)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)} variant="outline">{project.status}</Badge>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
