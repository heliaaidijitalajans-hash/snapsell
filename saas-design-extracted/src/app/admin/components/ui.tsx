import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delay = 0,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
  accent?: boolean;
}) {
  return (
    <GlassCard delay={delay} className="p-5 hover:border-[#FF5A5F]/30 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/50">{label}</p>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${accent ? "text-[#FF5A5F]" : "text-white"}`}>
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#FF5A5F]/15 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#FF5A5F]" />
        </div>
      </div>
    </GlassCard>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-white/50 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-white/30" />
      </div>
      <p className="text-white font-medium">{title}</p>
      {description ? <p className="mt-2 text-sm text-white/40 max-w-md">{description}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const tones = {
    neutral: "bg-white/10 text-white/70",
    success: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
    danger: "bg-red-500/15 text-red-400",
    accent: "bg-[#FF5A5F]/15 text-[#FF5A5F]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function WorkspaceNote({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200/90">
      {children ||
        "Local admin workspace — drafts are saved in this browser. Full website/app sync requires future API endpoints (not modified per project constraints)."}
    </div>
  );
}

export function inputClass() {
  return "w-full rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF5A5F]/40";
}

export function btnPrimary() {
  return "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50 transition";
}

export function btnGhost() {
  return "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/[0.12] text-white/70 hover:bg-white/[0.05] disabled:opacity-50 transition";
}
