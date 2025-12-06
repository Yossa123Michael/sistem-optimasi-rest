import { Button } from '@/components/ui/button'
import { Package } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface SplashScreenProps {
  onStart: () => void
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <Package size={80} weight="duotone" className="text-primary" />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-semibold text-white mb-3 tracking-tight"
        >
          RouteOptima
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-white/90 mb-12"
        >
          Optimize Deliveries, Maximize Efficiency
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onStart}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 px-12 py-6 text-lg font-medium shadow-xl"
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
