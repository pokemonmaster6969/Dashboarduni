import { useState } from "react";
import { 
  useGetRevenueAnalytics, 
  useGetProjectAnalytics,
  useGetServiceAnalytics,
  useGetClientAnalytics,
  useGetTatAnalytics
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const { data: revData, isLoading: revLoading } = useGetRevenueAnalytics();
  const { data: projData, isLoading: projLoading } = useGetProjectAnalytics();
  const { data: svcData, isLoading: svcLoading } = useGetServiceAnalytics();
  const { data: clientData, isLoading: clientLoading } = useGetClientAnalytics({ limit: 10 });
  const { data: tatData, isLoading: tatLoading } = useGetTatAnalytics();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Hub</h1>
        <p className="text-muted-foreground mt-1">Deep dive into revenue, performance, and operational metrics.</p>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 space-x-6">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Revenue</TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Projects</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Services</TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Clients</TabsTrigger>
          <TabsTrigger value="tat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-medium">Turnaround Time</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Invoiced</div>
                <div className="text-3xl font-bold">{formatCurrency(revData?.totalRevenue || 0)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Received</div>
                <div className="text-3xl font-bold text-emerald-600">{formatCurrency(revData?.totalReceived || 0)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Pending</div>
                <div className="text-3xl font-bold text-orange-600">{formatCurrency(revData?.totalPending || 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {revLoading ? (
                <div className="w-full h-full bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revData?.data || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                    <YAxis tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Invoiced" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="received" name="Received" stroke="hsl(var(--chart-2))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2 shadow-sm border-border/50">
              <CardHeader><CardTitle>Project Volume</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {projLoading ? (
                   <div className="w-full h-full bg-muted/20 animate-pulse rounded"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projData?.data || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" name="Completed" fill="hsl(var(--chart-2))" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="active" stackId="a" name="Active" fill="hsl(var(--primary))" />
                      <Bar dataKey="cancelled" stackId="a" name="Cancelled" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {projLoading ? (
                   <div className="w-48 h-48 rounded-full bg-muted/20 animate-pulse"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projData?.statusBreakdown || []}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={5} dataKey="count" nameKey="status"
                      >
                        {(projData?.statusBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Revenue and volume by service offering.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Samples</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg TAT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {svcLoading ? (
                     <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : !svcData || svcData.length === 0 ? (
                     <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No data available.</TableCell></TableRow>
                  ) : (
                    svcData.map(svc => (
                      <TableRow key={svc.serviceId}>
                        <TableCell className="font-medium">{svc.serviceName}</TableCell>
                        <TableCell className="text-right">{svc.projectCount}</TableCell>
                        <TableCell className="text-right">{svc.totalSamples}</TableCell>
                        <TableCell className="text-right font-mono font-medium text-primary">{formatCurrency(svc.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{svc.avgTatDays?.toFixed(1) || "-"} d</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>Highest revenue generating clients.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Total Invoiced</TableHead>
                    <TableHead className="text-right">Pending Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientLoading ? (
                     <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : !clientData || clientData.length === 0 ? (
                     <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No data available.</TableCell></TableRow>
                  ) : (
                    clientData.map(client => (
                      <TableRow key={client.clientId}>
                        <TableCell className="font-medium">{client.clientName}</TableCell>
                        <TableCell className="text-right">{client.projectCount}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(client.totalRevenue)}</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">{formatCurrency(client.pendingAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tat" className="mt-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Overall Avg QC TAT</div>
                <div className="text-3xl font-bold">{tatData?.overall?.avgQcTat?.toFixed(1) || 0} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Overall Avg Delivery TAT</div>
                <div className="text-3xl font-bold">{tatData?.overall?.avgDeliveryTat?.toFixed(1) || 0} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>TAT by Service</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              {tatLoading ? (
                 <div className="w-full h-full bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tatData?.byService || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis dataKey="service" type="category" tickLine={false} axisLine={false} width={150} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Legend />
                    <Bar dataKey="avgQcTat" name="Avg QC TAT (Days)" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="avgDeliveryTat" name="Avg Delivery TAT (Days)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
