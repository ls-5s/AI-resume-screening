import { motion, AnimatePresence } from "framer-motion";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
}

// 气泡朝向小尾巴的三角位置
const bubbleVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: -6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export function SpeechBubble({ text, visible }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 pointer-events-none select-none z-50"
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* 气泡主体 */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg border border-pink-100 max-w-[180px] text-center">
            <p className="text-[13px] font-medium text-pink-600 leading-snug whitespace-nowrap">
              {text}
            </p>
            {/* 尾巴三角 */}
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 shadow-sm border-r border-b border-pink-100" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
