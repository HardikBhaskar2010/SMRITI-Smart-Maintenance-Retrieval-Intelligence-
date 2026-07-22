import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, AlertTriangle, Shield, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import api from '@/api/client';

// ── API fetchers ──────────────────────────────────────────────────────
const fetchPortfolio = () => api.get('/analytics/portfolio').then((r) => r.data);
const fetchAllTrends = () => api.get('/analytics/trends').then((r) => r.data);
const fetchFlightRisk = () => api.get('/analytics/flight-risk').then((r) => r.data);

// ── Reusable metric card ──────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, sub, color = 'var(--accent-teal)',
}: {
  icon: any; label: string; value: number; sub?: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-stroke)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      </div>
      <div>
        <AnimatedCounter
          value={value}
          decimals={value % 1 !== 0 ? 1 : 0}
          style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
        />
        {sub && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--bg-stroke)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '12px',
    }}>
      <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: 0, color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 30_000,
  });
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['all-trends'],
    queryFn: fetchAllTrends,
  });
  const { data: flightData, isLoading: flightLoading } = useQuery({
    queryKey: ['flight-risk'],
    queryFn: fetchFlightRisk,
    refetchInterval: 60_000,
  });

  const trends: any[] = trendsData?.trends ?? [];
  const flightRisks: any[] = flightData?.at_risk_experts ?? [];

  // Prepare ranking chart data
  const rankingData = [...trends]
    .sort((a, b) => b.current_score - a.current_score)
    .map((t) => ({
      name: t.asset_id,
      score: t.current_score,
      projected: t.projected_score_30d,
      fill: t.current_score >= 70 ? 'var(--debt-crit)' : t.current_score >= 40 ? 'var(--debt-warn)' : 'var(--debt-ok)',
    }));

  // Pick the top-risk asset for the trend line chart
  const topRiskTrend = trends[0];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BarChart2 size={20} color="var(--accent-teal)" />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Predictive Analytics
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Portfolio health, 30-day debt forecasting & expert flight risk
        </p>
      </div>

      {/* Portfolio metrics row */}
      {portfolioLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '16px', marginBottom: '28px' }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '16px', marginBottom: '28px' }}>
          <MetricCard icon={Shield}   label="Portfolio Health"   value={portfolio?.portfolio_health ?? 0}    sub="0 = full debt risk" color="var(--accent-teal)" />
          <MetricCard icon={Activity} label="Avg Debt Score"     value={portfolio?.average_debt_score ?? 0} sub="across all assets"   color="var(--accent-purple)" />
          <MetricCard icon={BarChart2} label="Total Assets"       value={portfolio?.asset_count ?? 0}        sub="monitored assets"   color="var(--accent-teal)" />
          <MetricCard icon={TrendingUp} label="CRITICAL Assets"  value={portfolio?.severities?.CRITICAL ?? 0} sub="need urgent action" color="var(--debt-crit)" />
          <MetricCard icon={Users}    label="At-Risk Experts"    value={flightData?.critical_count ?? 0}     sub="90+ days inactive"  color="var(--debt-warn)" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>
        {/* Asset ranking chart */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-stroke)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Asset Debt Score Ranking
          </h3>
          {trendsLoading ? (
            <div style={{ height: '280px', background: 'var(--bg-elevated)', borderRadius: '8px' }} />
          ) : rankingData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data yet" description="Run the backend with demo data to see rankings." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rankingData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-stroke)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'JetBrains Mono' }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine x={70} stroke="var(--debt-crit)" strokeDasharray="4 2" label={{ value: 'CRITICAL', fill: 'var(--debt-crit)', fontSize: 10, position: 'insideTopLeft' }} />
                <Bar dataKey="score" name="Current Score" radius={[0,4,4,0]} fill="var(--accent-teal)" />
                <Bar dataKey="projected" name="Projected 30d" radius={[0,4,4,0]} fill="var(--accent-purple)" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top-risk asset trend line */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-stroke)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Highest-Risk Trend
          </h3>
          {topRiskTrend && (
            <p style={{ margin: '0 0 16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {topRiskTrend.asset_id} — {topRiskTrend.trend_direction}
              {topRiskTrend.days_until_critical && ` · ~${topRiskTrend.days_until_critical}d to CRITICAL`}
            </p>
          )}
          {trendsLoading ? (
            <div style={{ height: '240px', background: 'var(--bg-elevated)', borderRadius: '8px' }} />
          ) : !topRiskTrend ? (
            <EmptyState icon={TrendingUp} title="No trend data" description="Start the backend to begin recording." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={topRiskTrend.data_points.slice(-30)} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-stroke)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={70} stroke="var(--debt-crit)" strokeDasharray="4 2" />
                <ReferenceLine y={40} stroke="var(--debt-warn)" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="score" name="Debt Score" stroke="var(--accent-teal)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expert Flight Risk */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-stroke)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Users size={16} color="var(--debt-warn)" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Expert Flight Risk
          </h3>
          <span style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px', padding: '2px 8px', fontSize: '11px', color: 'var(--debt-warn)',
          }}>
            {flightRisks.length} at risk
          </span>
        </div>

        {flightLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '12px' }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : flightRisks.length === 0 ? (
          <EmptyState icon={Users} title="No flight risks detected" description="All experts have been recently active." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '12px' }}>
            {flightRisks.map((risk: any) => (
              <div
                key={risk.expert_name}
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${risk.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: '12px', padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{risk.expert_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {risk.total_contributions} contributions · {risk.asset_count} asset{risk.asset_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span style={{
                    background: risk.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                    color: risk.risk_level === 'CRITICAL' ? 'var(--debt-crit)' : 'var(--debt-warn)',
                    border: `1px solid ${risk.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700,
                  }}>
                    {risk.risk_level}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--debt-warn)' }}>
                  ⚠ {risk.days_inactive} days inactive
                </div>
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {risk.assets.map((a: string) => (
                    <span key={a} style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--bg-stroke)',
                      borderRadius: '4px', padding: '1px 6px', fontSize: '10px',
                      fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)',
                    }}>{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
