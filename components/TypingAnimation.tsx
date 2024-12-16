import { motion } from "framer-motion"

export function TypingAnimation() {
  return (
    <div className="flex items-center space-x-2 bg-secondary rounded-full px-4 py-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 rounded-full bg-primary"
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "loop",
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}

