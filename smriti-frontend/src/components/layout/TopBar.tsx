import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, AudioWaveform } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export function TopBar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Assets', path: '/assets' },
    { name: 'Knowledge Graph', path: '/graph' },
    { name: 'Guru Mode', path: '/guru' },
  ]

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
          className="pointer-events-auto bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full px-4 py-2 flex items-center justify-between gap-8 shadow-lg w-full max-w-4xl"
        >
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <AudioWaveform size={18} />
            </div>
            <span className="font-bold text-lg tracking-wide">SMRITI</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className="text-sm font-medium text-textSecondary hover:text-white transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="md:hidden !px-3" onClick={toggleMenu}>
              <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </Button>
            <Button variant="primary" className="hidden md:flex !py-2 !px-4 !text-xs">
              Upload Document
            </Button>
          </div>
        </motion.nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center"
          >
            <motion.div 
              className="flex flex-col items-center gap-8"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
            >
              {navLinks.map((link) => (
                <motion.div 
                  key={link.name}
                  variants={{
                    hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
                    visible: { y: 0, opacity: 1, filter: 'blur(0px)' }
                  }}
                  transition={{ ease: [0.32,0.72,0,1], duration: 0.6 }}
                >
                  <Link 
                    to={link.path}
                    className="text-3xl md:text-5xl font-bold tracking-tight text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
