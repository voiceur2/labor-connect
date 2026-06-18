import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Hammer, MessageSquare, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary" data-testid="link-home">
            <Hammer className="w-6 h-6" />
            <span>Labor Connect</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/messages" data-testid="link-messages">
              <Button variant={location === "/messages" ? "secondary" : "ghost"} size="sm" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </Button>
            </Link>
            <Link href="/register" data-testid="link-register">
              <Button variant="default" size="sm" className="gap-2 font-semibold">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Register Laborer</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border py-8 mt-auto text-center text-muted-foreground">
        <p className="text-sm">© {new Date().getFullYear()} Labor Connect. Grounded and solid.</p>
      </footer>
    </div>
  );
}