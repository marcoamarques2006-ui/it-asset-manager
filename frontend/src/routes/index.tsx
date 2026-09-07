import { createFileRoute } from "@tanstack/react-router";
import {
  Network,
  Grid3x3,
  Bug,
  RefreshCcwDot,
  Settings,
  LifeBuoy,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ItsmLayout, Panel } from "@/components/itsm/layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel ITSM — Servia" },
      {
        name: "description",
        content:
          "Painel ITSM com chamados, SLA, vulnerabilidades, ativos e atualizações pendentes em uma visão única.",
      },
      { property: "og:title", content: "Painel ITSM — Servia" },
      {
        property: "og:description",
        content: "Chamados, SLA, vulnerabilidades e ativos em uma visão única.",
      },
    ],
  }),
  component: Dashboard,
});

const overview = [
  { icon: Network, value: "134 298", label: "Ativos" },
  { icon: Grid3x3, value: "97", label: "Softwares instalados" },
  { icon: Bug, value: "277", label: "Vulnerabilidades" },
  { icon: RefreshCcwDot, value: "28", label: "Atualizações pendentes" },
];

const endpoints = [
  { value: "7 940", label: "Vistos há 31+ dias", tone: "critical" },
  { value: "114 153", label: "Vistos nos últimos 7 dias", tone: "success" },
  { value: "12 205", label: "Vistos há 8-30 dias", tone: "warning" },
  { value: "30 888", label: "Reinício necessário", tone: "warning" },
];

const toneBar: Record<string, string> = {
  critical: "bg-critical",
  success: "bg-success",
  warning: "bg-warning",
};

const remediate = [
  { label: "Crítico", cells: [0, 19, 1, 40] },
  { label: "Importante", cells: [0, 0, 20, 5] },
  { label: "Moderado", cells: [0, 25, 69, 6] },
  { label: "Outros", cells: [0, 35, 0, 0] },
];

const install = [
  { label: "Crítico", cells: [2, 20, 0, 22] },
  { label: "Importante", cells: [5, 1, 1, 11] },
  { label: "Moderado", cells: [6, 5, 32, 52] },
  { label: "Outros", cells: [0, 21, 65, 6] },
];

const tickets = [
  { id: "INC-4821", title: "VPN instável na filial Recife", pri: "Crítico", sla: "1h 12m" },
  { id: "REQ-1180", title: "Provisionar notebook — novo colaborador", pri: "Moderado", sla: "1d 4h" },
  { id: "INC-4817", title: "Impressora do 3º andar offline", pri: "Importante", sla: "6h 30m" },
  { id: "REQ-1175", title: "Acesso ao ERP — perfil financeiro", pri: "Moderado", sla: "2d" },
  { id: "INC-4805", title: "Lentidão no e-mail corporativo", pri: "Importante", sla: "3h 05m" },
];

const priTone: Record<string, string> = {
  Crítico: "bg-critical-soft text-critical",
  Importante: "bg-warning-soft text-foreground",
  Moderado: "bg-accent text-accent-foreground",
};

function Gauge({
  value,
  caption,
  overdue,
  soon,
}: {
  value: number;
  caption: string;
  overdue: number;
  soon: number;
}) {
  const total = overdue + soon;
  const r = 56;
  const c = Math.PI * r;
  const overdueLen = (overdue / total) * c;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 80" className="w-44">
        <path
          d="M 14 74 A 56 56 0 0 1 126 74"
          fill="none"
          stroke="var(--warning)"
          strokeWidth="16"
        />
        <path
          d="M 14 74 A 56 56 0 0 1 126 74"
          fill="none"
          stroke="var(--critical)"
          strokeWidth="16"
          strokeDasharray={`${overdueLen} ${c}`}
        />
        <text
          x="70"
          y="64"
          textAnchor="middle"
          className="fill-foreground text-[22px] font-semibold"
        >
          {value}
        </text>
      </svg>
      <p className="-mt-1 text-xs text-muted-foreground">{caption}</p>
      <div className="mt-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-critical" /> Em atraso: {overdue}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-warning" /> Vencendo: {soon}
        </span>
      </div>
    </div>
  );
}

function Matrix({
  rows,
}: {
  rows: { label: string; cells: number[] }[];
}) {
  const heads = ["Em atraso", "1-7 dias", "8-30 dias", "31+ dias"];
  const tones = ["bg-success-soft", "bg-warning-soft", "bg-surface", "bg-surface"];
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="w-24" />
          {heads.map((h) => (
            <th key={h} className="pb-2 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="pr-3 text-right text-sm text-foreground">{row.label}</td>
            {row.cells.map((cell, i) => (
              <td
                key={i}
                className={`border border-border py-2 text-center font-medium ${tones[i]}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Dashboard() {
  return (
    <ItsmLayout title="Painel" breadcrumb="Painéis">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Visão geral">
          <div className="grid grid-cols-2 gap-6">
            {overview.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="size-8 text-brand" strokeWidth={1.6} />
                <div>
                  <p className="text-xl font-semibold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Resumo dos ativos">
          <div className="grid grid-cols-2 gap-5">
            {endpoints.map((e) => (
              <div key={e.label} className="flex items-stretch gap-3">
                <span className={`w-1.5 shrink-0 rounded-full ${toneBar[e.tone]}`} />
                <div>
                  <p className="text-xl font-semibold text-foreground">{e.value}</p>
                  <p className="text-xs text-muted-foreground">{e.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="SLA de vulnerabilidades"
          action={<Settings className="size-4 text-brand" />}
        >
          <div className="flex flex-wrap items-center gap-6">
            <Gauge value={175} caption="a remediar" overdue={135} soon={40} />
            <ul className="min-w-48 flex-1 space-y-2 border-l border-border pl-5 text-sm text-foreground">
              <li className="text-xs font-medium text-muted-foreground">SLA definido:</li>
              <li>Crítico em 7 dias</li>
              <li>Alto em 15 dias</li>
              <li>Moderado em 30 dias</li>
              <li>Outros em 60 dias</li>
            </ul>
          </div>
        </Panel>

        <Panel title="Prazo de remediação">
          <Matrix rows={remediate} />
        </Panel>

        <Panel title="SLA de atualizações" action={<Settings className="size-4 text-brand" />}>
          <div className="flex flex-wrap items-center gap-6">
            <Gauge value={60} caption="a instalar" overdue={22} soon={38} />
            <ul className="min-w-48 flex-1 space-y-2 border-l border-border pl-5 text-sm text-foreground">
              <li className="text-xs font-medium text-muted-foreground">SLA definido:</li>
              <li>Crítico em 7 dias</li>
              <li>Alto em 15 dias</li>
              <li>Moderado em 30 dias</li>
              <li>Outros em 60 dias</li>
            </ul>
          </div>
        </Panel>

        <Panel title="Prazo de instalação">
          <Matrix rows={install} />
        </Panel>

        <Panel title="Chamados recentes">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Chamado</th>
                <th className="pb-2 text-left font-medium">Assunto</th>
                <th className="pb-2 text-left font-medium">Prioridade</th>
                <th className="pb-2 text-right font-medium">SLA restante</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border/70 last:border-0">
                  <td className="py-2.5 font-medium text-brand">{t.id}</td>
                  <td className="py-2.5 text-foreground">{t.title}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priTone[t.pri]}`}
                    >
                      {t.pri}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{t.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Desempenho da central">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: LifeBuoy, v: "312", l: "Chamados abertos" },
              { icon: Clock, v: "2h 41m", l: "Tempo médio 1ª resposta" },
              { icon: CheckCircle2, v: "94%", l: "SLA cumprido no mês" },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-border p-3">
                <k.icon className="mb-2 size-5 text-brand" strokeWidth={1.6} />
                <p className="text-lg font-semibold text-foreground">{k.v}</p>
                <p className="text-xs text-muted-foreground">{k.l}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </ItsmLayout>
  );
}
