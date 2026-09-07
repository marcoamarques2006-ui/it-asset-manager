import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!session && pathname !== "/login") {
      navigate({ to: "/login" });
    } else if (session && pathname === "/login") {
      navigate({ to: "/" });
    }
  }, [session, isLoading, pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!session && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
