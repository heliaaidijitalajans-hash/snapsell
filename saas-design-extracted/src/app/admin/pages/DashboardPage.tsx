import {
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  DollarSign,
  ImageIcon,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard, StatCard, PageHeader } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { formatDate, isPremiumPlan } from "../types";

const PIE_COLORS = ["#FF5A5F", "#FF8A8E", "#A0A0A0", "#4ADE80", "#60A5FA", "#FBBF24"];

export function AdminDashboardPage() {
  const { users, dailyStats, imageEdits, loginLogs, planPrices, subscribersMonthly, subscribersYearly } =
    useAdmin();

  const totalConversions = users.reduce((s, u) => s + (u.totalConversions ?? 0), 0);
  const premiumUsers = users.filter((u) => isPremiumPlan(u.plan)).length;
  const activeUsers = users.filter((u) => (u.totalConversions ?? 0) > 0 || isPremiumPlan(u.plan)).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const imagesToday = imageEdits.filter((e) => e.createdAt >= todayStart.getTime()).length;

  const monthlyRevenue = subscribersMonthly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);
  const yearlyRevenue = subscribersYearly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);
  const revenueEstimate = monthlyRevenue + yearlyRevenue;

  const growthData = (dailyStats?.last7Days || []).map((d) => ({
    date: d.date.slice(5),
    signups: d.signups ?? 0,
    visitors: d.visitors ?? 0,
  }));

  const conversionData = (dailyStats?.last7Days || []).map((d) => ({
    date: d.date.slice(5),
    conversions: d.conversions ?? 0,
  }));

  const planCounts: Record<string, number> = {};
  users.forEach((u) => {
    const p = u.plan || "free";
    planCounts[p] = (planCounts[p] || 0) + 1;
  });
  const pieData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

  const activities: { text: string; time: string; tone: string }[] = [];
  const sortedUsers = [...users].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 3);
  sortedUsers.forEach((u) => {
    activities.push({
      text: `New user registered — ${u.email || u.displayName || u.id.slice(0, 8)}`,
      time: formatDate(u.createdAt),
      tone: "signup",
    });
  });
  [...subscribersMonthly, ...subscribersYearly].slice(0, 2).forEach((u) => {
    activities.push({
      text: `Subscription active — ${u.email || u.id.slice(0, 8)} (${u.plan})`,
      time: "—",
      tone: "sub",
    });
  });
  imageEdits.slice(0, 3).forEach((e) => {
    activities.push({
      text: `Image generated — ${e.email || e.displayName || e.userId.slice(0, 8)}`,
      time: formatDate(e.createdAt),
      tone: "image",
    });
  });
  loginLogs.slice(0, 2).forEach((l) => {
    activities.push({
      text: `User signed in — ${l.email || l.user_id.slice(0, 8)}`,
      time: l.logged_at ? formatDate(new Date(l.logged_at).getTime()) : "—",
      tone: "login",
    });
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back. Here's today's summary." />

      <GlassCard className="p-6 sm:p-8 mb-8 relative overflow-hidden" delay={0}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FF5A5F]/10 blur-3xl pointer-events-none" />
        <p className="text-sm font-medium text-[#FF5A5F] uppercase tracking-wider">Welcome back</p>
        <h2 className="mt-2 text-3xl font-bold text-white">SnapSell Admin</h2>
        <p className="mt-3 text-white/50 max-w-xl">
          Today: {dailyStats?.today?.visitors ?? 0} visitors · {dailyStats?.today?.conversions ?? 0} conversions ·{" "}
          {dailyStats?.today?.signups ?? 0} signups
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={users.length} icon={Users} delay={0.05} />
        <StatCard label="Active Users" value={activeUsers} icon={UserCheck} delay={0.08} />
        <StatCard label="Total Conversions" value={totalConversions} icon={TrendingUp} delay={0.11} />
        <StatCard label="Premium Users" value={premiumUsers} icon={CreditCard} delay={0.14} accent />
        <StatCard label="Revenue (est.)" value={`$${revenueEstimate}`} icon={DollarSign} delay={0.17} />
        <StatCard label="Images Generated Today" value={imagesToday} icon={ImageIcon} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-5 xl:col-span-2" delay={0.22}>
          <h3 className="text-sm font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A5F" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FF5A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Area type="monotone" dataKey="signups" stroke="#FF5A5F" fill="url(#signupGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" delay={0.25}>
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Distribution</h3>
          <div className="h-64">
            {pieData.length === 0 ? (
              <p className="text-sm text-white/40 text-center pt-20">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5" delay={0.28}>
          <h3 className="text-sm font-semibold text-white mb-4">Daily Conversions</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }}
                />
                <Bar dataKey="conversions" fill="#FF5A5F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" delay={0.3}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#FF5A5F]" />
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          </div>
          <ul className="space-y-3 max-h-56 overflow-y-auto">
            {activities.length === 0 ? (
              <li className="text-sm text-white/40">No recent activity</li>
            ) : (
              activities.slice(0, 10).map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF5A5F] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 truncate">{a.text}</p>
                    <p className="text-xs text-white/35 mt-0.5">{a.time}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
