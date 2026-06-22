import { motion } from 'motion/react'
import { ArrowRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAssets } from '@/hooks/useAssets'
import type { AssetSummary } from '@/api/types'

function AssetStatusBadge({ severity }: { severity: AssetSummary['severity'] }) {
  if (severity === 'CRITICAL') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-critical/10 border border-critical/30 text-critical text-xs font-bold tracking-wider">
        <AlertTriangle size={14} className="animate-pulse" /> CRITICAL
      </div>
    )
  }
  if (severity === 'WARNING') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-bold tracking-wider">
        <Activity size={14} /> WARNING
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ok/10 border border-ok/30 text-ok text-xs font-bold tracking-wider">
      <CheckCircle2 size={14} /> HEALTHY
    </div>
  )
}

export function Dashboard() {
  const { data: assets, isLoading } = useAssets()

  const criticalAssets = assets?.filter((a: AssetSummary) => a.severity === 'CRITICAL') || []
  const warningAssets = assets?.filter((a: AssetSummary) => a.severity === 'WARNING') || []
  const okAssets = assets?.filter((a: AssetSummary) => a.severity === 'OK') || []

  return (
    <div className="flex flex-col gap-12 md:gap-24">
      {/* Editorial Split Header */}
      <motion.section 
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.32,0.72,0,1] }}
        className="flex flex-col md:flex-row gap-12 items-start"
      >
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="inline-flex items-center justify-center w-max px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-textSecondary">
            Plant Overview
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Knowledge <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/50">
              Intelligence.
            </span>
          </h1>
          <p className="text-lg text-textSecondary max-w-md leading-relaxed">
            Monitor knowledge debt across critical infrastructure. Capture tacit expertise before it leaves the building.
          </p>
          <div className="pt-4">
            <Button trailingIcon={<ArrowRight size={16} />}>
              Start Guru Session
            </Button>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {/* Quick Stats Pills */}
          {[
            { label: 'Critical Assets', value: criticalAssets.length, color: 'text-critical' },
            { label: 'At Risk', value: warningAssets.length, color: 'text-warning' },
            { label: 'Healthy', value: okAssets.length, color: 'text-ok' }
          ].map((stat, i) => (
            <Card key={i} className="min-w-[160px] snap-center shrink-0">
              <div className="p-6 flex flex-col gap-2">
                <span className="text-sm text-textSecondary font-medium">{stat.label}</span>
                <span className={`text-4xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Asymmetrical Bento Grid */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Priority Assets</h2>
          <Button variant="ghost" className="!px-0 text-accent" trailingIcon={<ArrowRight size={16} />}>
            View All
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[270px]">
             <Card className="md:col-span-8 md:row-span-2"><div className="w-full h-full animate-pulse bg-white/5" /></Card>
             <Card className="md:col-span-4"><div className="w-full h-full animate-pulse bg-white/5" /></Card>
             <Card className="md:col-span-4"><div className="w-full h-full animate-pulse bg-white/5" /></Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[270px]">
            {assets?.slice(0, 3).map((asset: AssetSummary, i: number) => {
              // Asymmetrical layout logic: first item takes massive space, others stack
              const spanClasses = i === 0 ? "md:col-span-8 md:row-span-2" : "md:col-span-4"
              const variant = asset.severity.toLowerCase() as 'critical' | 'warning' | 'ok' | 'default'
              
              return (
                <motion.div
                  key={asset.asset_id}
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.32,0.72,0,1] }}
                  className={spanClasses}
                >
                  <Card variant={variant} className="h-full">
                    <div className="p-6 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <AssetStatusBadge severity={asset.severity} />
                          <h3 className="text-2xl font-bold mt-3">{asset.display_name}</h3>
                          <span className="text-sm text-textSecondary font-mono">{asset.asset_type}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-5xl font-bold tracking-tighter opacity-80">{asset.debt_score}</span>
                          <span className="text-xs text-textMuted uppercase tracking-widest font-bold">Debt Score</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex flex-col">
                          <span className="text-textSecondary text-sm">Knowledge Items</span>
                          <span className="font-mono text-xl">{asset.item_count}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-textSecondary text-sm">Experts</span>
                          <span className="font-mono text-xl">{asset.expert_count}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
