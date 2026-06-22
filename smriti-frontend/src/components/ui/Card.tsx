import React, { ReactNode } from 'react'
import { motion } from 'motion/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps extends React.ComponentProps<typeof motion.div> {
  children: ReactNode
  variant?: 'default' | 'critical' | 'warning' | 'ok'
  className?: string
  innerClassName?: string
}

export function Card({ children, variant = 'default', className, innerClassName, ...props }: CardProps) {
  const outerVariants = {
    default: "border-white/10 shadow-lg",
    critical: "border-critical/30 shadow-[0_0_20px_rgba(247,79,79,0.3)]",
    warning: "border-warning/30 shadow-[0_0_20px_rgba(247,168,79,0.2)]",
    ok: "border-ok/30 shadow-[0_0_20px_rgba(79,247,160,0.2)]",
  }

  const innerVariants = {
    default: "bg-black/40",
    critical: "bg-critical/5",
    warning: "bg-warning/5",
    ok: "bg-ok/5",
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
      className={cn(
        "bg-white/5 border rounded-[2rem] p-1.5 transition-colors duration-500 will-change-transform cursor-pointer group",
        outerVariants[variant],
        className
      )}
      {...props}
    >
      <div className={cn(
        "rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden backdrop-blur-[24px] h-full",
        innerVariants[variant],
        innerClassName
      )}>
        {children}
      </div>
    </motion.div>
  )
}
