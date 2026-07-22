import React, { forwardRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  trailingIcon?: ReactNode
  loading?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, trailingIcon, loading, disabled, children, ...props }, ref) => {
    
    const baseClasses = "group relative inline-flex items-center justify-center gap-3 rounded-full font-sans font-semibold transition-colors duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed"
    
    const sizes = {
      sm: "px-4 py-2 text-xs min-h-[36px]",
      md: "px-6 py-3 text-sm min-h-[44px]",
      lg: "px-8 py-4 text-base min-h-[52px]",
    }

    const variants = {
      primary: "bg-accent text-white hover:bg-[#3a7de8] shadow-[0_0_15px_rgba(79,142,247,0.15)]",
      secondary: "bg-surface2 text-textPrimary border border-border hover:border-borderHover",
      danger: "bg-critical/10 text-critical border border-critical/30 hover:bg-critical/20",
      ghost: "text-textSecondary hover:text-textPrimary hover:bg-white/5",
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <motion.div 
            className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin absolute"
          />
        )}
        <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </span>
        
        {trailingIcon && (
          <motion.div 
            className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center -mr-2"
            variants={{
              hover: { x: 4, y: -1, scale: 1.05 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {trailingIcon}
          </motion.div>
        )}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'
