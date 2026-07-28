import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <AlertCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8">This page could not be found or you don't have access.</p>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
