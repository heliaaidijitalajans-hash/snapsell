import { useParams } from "react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye, TrendingUp, UserPlus, Users } from "lucide-react";
import { GlassCard, PageHeader, StatCard } from "../components/ui";
import { useAdmin } from "../AdminContext";

export function AdminAnalyticsPage() {
  const { section } = useParams();
  const { dailyStats, users, planPrices, subscribersMonthly, subscribersYearly } = useAdmin();

  const days = dailyStats?.last7Days || [];
  const chartData = days.map((d) => ({
    date: d.date.slice(5),
    visitors: d.visitors ?? 0,
    conversions: d.conversions ?? 0,
    signups: d.signups ?? 0,
  }));

  const monthlyRevenue = subscribersMonthly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);
  const annualRevenue = subscribersYearly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);

  const titleMap: Record<string, string> = {
    users: "User Analytics",
    conversions: "Conversion Analytics",
    revenue: "Revenue",
    traffic: "Traffic",
  };
  const title = section && titleMap[section] ? titleMap[section] : "Analytics Overview";

  return (
    <div>
      <PageHeader title={title} subtitle="Growth, traffic, conversions and revenue from live stats." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today visitors" value={dailyStats?.today?.visitors ?? 0} icon={Eye} />
        <StatCard label="Today conversions" value={dailyStats?.today?.conversions ?? 0} icon={TrendingUp} delay={0.05} />
        <StatCard label="Today signups" value={dailyStats?.today?.signups ?? 0} icon={UserPlus} delay={0.1} />
        <StatCard label="Total visitors" value={dailyStats?.totalVisitors ?? 0} icon={Users} delay={0.15} accent />
      </div>

      {(section === undefined || section === "traffic" || section === "users") && (
        <GlassCard className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            {section === "users" ? "Signups (7 days)" : "Traffic (7 days)"}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A5F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF5A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }} />
                <Area
                  type="monotone"
                  dataKey={section === "users" ? "signups" : "visitors"}
                  stroke="#FF5A5F"
                  fill="url(#visGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {(section === undefined || section === "conversions") && (
        <GlassCard className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-white mb-4">Conversions (7 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }} />
                <Bar dataKey="conversions" fill="#FF5A5F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {(section === undefined || section === "revenue") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Estimated revenue</h3>
            <p className="text-3xl font-bold text-[#FF5A5F] tabular-nums">${monthlyRevenue + annualRevenue}</p>
            <p className="text-sm text-white/40 mt-2">
              Monthly ${monthlyRevenue} · Annual ${annualRevenue}
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4">User base</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{ n: "Users", v: users.length }, { n: "Monthly", v: subscribersMonthly.length }, { n: "Yearly", v: subscribersYearly.length }]}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="n" stroke="#666" fontSize={12} tickLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="v" stroke="#FF5A5F" strokeWidth={2} dot={{ fill: "#FF5A5F" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {days.length > 0 && (
        <GlassCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Last 7 days detail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Visitors</th>
                  <th className="px-4 py-2 font-medium">Conversions</th>
                  <th className="px-4 py-2 font-medium">Signups</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className="border-t border-white/[0.04]">
                    <td className="px-4 py-2 text-white/80">{d.date}</td>
                    <td className="px-4 py-2 text-white/60">{d.visitors ?? 0}</td>
                    <td className="px-4 py-2 text-white/60">{d.conversions ?? 0}</td>
                    <td className="px-4 py-2 text-white/60">{d.signups ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
