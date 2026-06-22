import { motion } from 'motion/react'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'

export function GraphPage() {
  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-140px)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32,0.72,0,1] }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-4xl font-bold">Knowledge Graph</h1>
        <p className="text-textSecondary">Spatial representation of asset relationships and knowledge debt density.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, delay: 0.2, ease: [0.32,0.72,0,1] }}
        className="flex-1 w-full relative"
      >
        <KnowledgeGraph />
      </motion.div>
    </div>
  )
}
