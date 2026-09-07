import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShieldAlert,
  Server,
  PackageSearch,
  CheckSquare,
  Workflow,
  History,
  FileBarChart,
  BellRing,
  Boxes,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: React.ElementType };

const groups: { label?: string; items: Item[] }[] = [
  {
    items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Chamados", url: "/chamados", icon: LifeBuoy },
      { title: "Vulnerabilidades", url: "/vulnerabilidades", icon: ShieldAlert },
      { title: "Ativos", url: "/ativos", icon: Server },
      { title: "Softwares", url: "/softwares", icon: PackageSearch },
      { title: "Aprovações", url: "/aprovacoes", icon: CheckSquare },
    ],
  },
  {
    label: "Automação",
    items: [
      { title: "Automações", url: "/automacoes", icon: Workflow },
      { title: "Histórico", url: "/historico", icon: History },
    ],
  },
  {
    label: "Relatórios e alertas",
    items: [
      { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
      { title: "Alertas", url: "/alertas", icon: BellRing },
    ],
  },
  {
    label: "Configuração",
    items: [{ title: "Catálogo", url: "/catalogo", icon: Boxes }],
  },
];

export function ItsmSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        {!collapsed && (
          <span className="text-lg font-extrabold italic tracking-tight text-brand">
            Servia
          </span>
        )}
        <button
          type="button"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto pb-6">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-1 px-2">
            {group.label && !collapsed && (
              <p className="px-2 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.url;
                return (
                  <li key={item.url}>
                    <Link
                      to={item.url}
                      title={item.title}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
