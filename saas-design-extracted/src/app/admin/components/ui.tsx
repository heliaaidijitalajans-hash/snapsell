import { motion } from "framer-motion";
import type { ReactNode } from "react";

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

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-white/50 max-w-2xl">{subtitle}</p> : null}
    </div>
  );
}
