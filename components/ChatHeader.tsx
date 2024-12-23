import { motion } from "framer-motion"
import { Stethoscope } from 'lucide-react'

export function ChatHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary text-primary-foreground p-4 rounded-t-lg flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        <Stethoscope className="w-8 h-8" />
        <h1 className="text-2xl font-bold">MediChat AI</h1>
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center"
      >
        <div className="w-6 h-6 rounded-full bg-primary" />
      </motion.div>
    </motion.div>
  )
}

