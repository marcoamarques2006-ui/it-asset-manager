import type { ReactNode } from "react";
import { Search, ChevronDown, Home, LogOut } from "lucide-react";
import { ItsmSidebar } from "./sidebar";
import { supabase } from "@/lib/supabase";

export function ItsmLayout({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <ItsmSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
          <Home className="size-4 text-muted-foreground" />
          <button className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground">
            Minha Organização
            <ChevronDown className="size-3.5" />
          </button>
          <span className="text-sm text-muted-foreground">
            {breadcrumb ?? title}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <span className="grid size-7 place-items-center rounded-md bg-success-soft text-xs font-semibold text-success">
              MM
            </span>
            <button
              type="button"
              title="Sair"
              aria-label="Sair"
              onClick={() => supabase.auth.signOut()}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-5">
          <h1 className="mb-4 text-base font-semibold text-foreground">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
