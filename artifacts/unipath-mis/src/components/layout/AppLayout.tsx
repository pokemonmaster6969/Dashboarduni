import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings2, 
  Dna, 
  Map, 
  Receipt, 
  CreditCard, 
  BarChart3,
  LogOut,
  UserCircle,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const management = [
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Services", href: "/services", icon: Settings2 },
  { name: "Scientists", href: "/scientists", icon: Dna },
  { name: "Territories", href: "/territories", icon: Map },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top Horizontal Navbar */}
      <header className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-md text-foreground border-b border-border/50 shadow-terra">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="bg-primary/10 text-primary p-2 rounded-xl shadow-terra group-hover:scale-105 transition-transform border border-primary/20">
              <Dna className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-background/85 px-3 py-1.5 rounded-lg shadow-terra border border-border/30 flex items-center justify-center">
              <img src="/logo.png" alt="UNIGENOME MIS Platform" className="h-9 w-auto object-contain" />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1">
            {/* Core Operations */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/40 shadow-terra">
              {navigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-terra font-semibold" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="h-5 w-[1px] bg-border/60 mx-1.5"></div>

            {/* Management */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/40 shadow-terra">
              {management.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-terra font-semibold" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 rounded-xl border border-border/40 bg-background shadow-terra"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/40 shadow-terra">
              <UserCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">System Admin</span>
            </div>

            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border/40 hover:border-transparent transition-all duration-150 shadow-terra"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Wide Fullscreen Main Content */}
      <main className="flex-1 w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 bg-background">
        {children}
      </main>
    </div>
  );
}
