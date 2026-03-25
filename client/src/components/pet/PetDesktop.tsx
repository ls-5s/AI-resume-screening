import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { SpeechBubble } from "./SpeechBubble";

// 使用 public/pet/omma-kitten.png（与参考图一致的 3D 治愈系小猫）
const PET_IMAGE_SRC = "/pet/omma-kitten.png";

// 展示尺寸（站立全身，宽 < 高）
const PET_WIDTH = 132;
const PET_HEIGHT = 168;

const SPRING_CONFIG = { damping: 30, stiffness: 150, mass: 0.9 };
const SPEECH_DURATION = 2500;

const SPEECH_LINES = [
  "喵喵，你好呀！",
  "今天也要加油！",
  "别偷懒啦~",
  "我在盯着你",
  "要不要休息一下？",
  "好无聊哦...",
  "摸摸我嘛~",
  "抱抱！",
  "肚子饿了",
  "今天天气真好",
  "好困啊...",
  "陪我玩嘛！",
  "嘿嘿~",
  "好开心呀！",
  "等等我！",
];

type Mood = "happy" | "normal" | "bored";

interface MoodConfig {
  scale: number;
  rotation: number;
}

const MOOD_CONFIG: Record<Mood, MoodConfig> = {
  happy:  { scale: 1.12, rotation: 0 },
  normal: { scale: 1, rotation: 0 },
  bored:  { scale: 0.92, rotation: -4 },
};

export default function PetDesktop() {
  const [xPercent, setXPercent] = useState(() => Math.random() * 70 + 10);
  const [yPercent, setYPercent] = useState(() => Math.random() * 70 + 10);

  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, SPRING_CONFIG);
  const y = useSpring(yRaw, SPRING_CONFIG);

  const [speechText, setSpeechText] = useState("");
  const [speechVisible, setSpeechVisible] = useState(false);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mood, setMood] = useState<Mood>("normal");
  const lastInteractionRef = useRef<number | null>(null);

  const dodgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boredomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveLockRef = useRef(false);

  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const recordInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (moodResetRef.current) clearTimeout(moodResetRef.current);
    setMood("happy");
    moodResetRef.current = setTimeout(() => setMood("normal"), 3000);
  }, []);

  const showSpeech = useCallback((text?: string) => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    const line = text ?? SPEECH_LINES[Math.floor(Math.random() * SPEECH_LINES.length)];
    setSpeechText(line);
    setSpeechVisible(true);
    speechTimerRef.current = setTimeout(() => setSpeechVisible(false), SPEECH_DURATION);
  }, []);

  const syncPixelPosition = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    xRaw.set((xPercent / 100) * (vw - PET_WIDTH));
    yRaw.set((yPercent / 100) * (vh - PET_HEIGHT));
  }, [xPercent, yPercent, xRaw, yRaw]);

  const moveToRandomPosition = useCallback(() => {
    if (moveLockRef.current) return;
    setXPercent(Math.random() * 72 + 8);
    setYPercent(Math.random() * 72 + 8);
    showSpeech();
  }, [showSpeech]);

  const dodgeMouse = useCallback(
    (clientX: number, clientY: number) => {
      if (moveLockRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const catX = (xPercent / 100) * (vw - PET_WIDTH) + PET_WIDTH / 2;
      const catY = (yPercent / 100) * (vh - PET_HEIGHT) + PET_HEIGHT / 2;
      const dist = Math.hypot(clientX - catX, clientY - catY);
      if (dist < 160) {
        if (dodgeTimeoutRef.current) clearTimeout(dodgeTimeoutRef.current);
        moveLockRef.current = true;
        dodgeTimeoutRef.current = setTimeout(() => {
          moveLockRef.current = false;
        }, 700);

        const angle = Math.atan2(catY - clientY, catX - clientX);
        const nx = Math.max(3, Math.min(90, xPercent + Math.cos(angle) * (16 / (vw / 100))));
        const ny = Math.max(3, Math.min(90, yPercent + Math.sin(angle) * (16 / (vh / 100))));
        setXPercent(nx);
        setYPercent(ny);
        showSpeech("咦！");
      }
    },
    [xPercent, yPercent, showSpeech],
  );

  const handleClick = useCallback(() => {
    recordInteraction();
    showSpeech();
  }, [recordInteraction, showSpeech]);

  const approachMouse = useCallback(() => {
    if (moveLockRef.current) return;
    setXPercent(Math.max(5, Math.min(85, xPercent + (Math.random() - 0.5) * 8)));
    setYPercent(Math.max(5, Math.min(85, yPercent + (Math.random() - 0.5) * 8)));
    showSpeech("陪我玩嘛！");
  }, [xPercent, yPercent, showSpeech]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => dodgeMouse(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [dodgeMouse]);

  useEffect(() => {
    syncPixelPosition();
    const onResize = () => syncPixelPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncPixelPosition]);

  useEffect(() => {
    syncPixelPosition();
  }, [xPercent, yPercent, syncPixelPosition]);

  useEffect(() => {
    const scheduleNext = () => {
      moveTimerRef.current = setTimeout(() => {
        moveToRandomPosition();
        scheduleNext();
      }, 2000 + Math.random() * 3000);
    };
    scheduleNext();
    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [moveToRandomPosition]);

  useEffect(() => {
    const check = () => {
      const last = lastInteractionRef.current;
      if (last == null) return;
      if (Date.now() - last > 15000 && mood !== "bored") {
        setMood("bored");
        approachMouse();
      }
    };
    boredomTimerRef.current = setInterval(check, 5000);
    return () => {
      if (boredomTimerRef.current) clearInterval(boredomTimerRef.current);
    };
  }, [mood, approachMouse]);

  useEffect(() => {
    return () => {
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      if (dodgeTimeoutRef.current) clearTimeout(dodgeTimeoutRef.current);
      if (moodResetRef.current) clearTimeout(moodResetRef.current);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      if (boredomTimerRef.current) clearInterval(boredomTimerRef.current);
    };
  }, []);

  const moodCfg = MOOD_CONFIG[mood];

  return (
    <motion.div
      style={{ x, y, left: 0, top: 0, position: "fixed", zIndex: 9999 }}
      className="cursor-pointer select-none"
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      animate={
        mood === "happy"
          ? {
              scale: [1, 1.18, 0.92, 1.1, 1],
              rotate: [0, -6, 6, -4, 0],
              transition: { duration: 0.65, ease: "easeInOut" },
            }
          : mood === "bored"
            ? {
                scale: [1, 0.9, 1.04],
                rotate: [0, -3, 3, 0],
                transition: { duration: 1.3, ease: "easeInOut", repeat: Infinity },
              }
            : {
                scale: moodCfg.scale,
                rotate: moodCfg.rotation,
                transition: { type: "spring" as const, ...SPRING_CONFIG },
              }
      }
    >
      <div className="relative flex flex-col items-center">
        <SpeechBubble text={speechText} visible={speechVisible} />

        <motion.div
          className="relative flex flex-col items-center justify-end"
          style={{ width: PET_WIDTH, height: PET_HEIGHT }}
          animate={
            mood === "bored"
              ? { y: [0, -5, 0], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
              : {
                  y: [0, -4, 0],
                  transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                }
          }
        >
          {/* 投影层：独立于 image，放在底层做 3D 悬浮感 */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: PET_WIDTH,
              height: PET_HEIGHT,
              background: `radial-gradient(ellipse 70% 40% at 50% 55%, rgba(200, 90, 130, 0.28) 0%, transparent 100%)`,
              filter: "blur(14px)",
              transform: "scale(0.88)",
              bottom: 0,
              left: 0,
            }}
          />

          {/* 小猫精灵：白色背景抠掉，保留 drop-shadow 制造立体感 */}
          <motion.img
            src={PET_IMAGE_SRC}
            alt="Omma 桌面宠物"
            draggable={false}
            className="pointer-events-none object-contain object-bottom"
            style={{
              width: PET_WIDTH,
              height: PET_HEIGHT,
              maskImage: "url(/pet/omma-kitten.png)",
              WebkitMaskImage: "url(/pet/omma-kitten.png)",
              filter: `
                drop-shadow(0 8px 18px rgba(200, 70, 110, 0.32))
                drop-shadow(0 2px 6px rgba(255, 170, 190, 0.45))
              `,
            }}
            animate={
              mood === "happy"
                ? { rotate: [0, -3, 3, 0], transition: { duration: 0.5, ease: "easeOut" } }
                : mood === "bored"
                  ? { rotate: [-2, 2, -2], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }
                  : {
                      rotate: [0, 1.5, -1.5, 0],
                      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }
            }
          />

          <motion.div
            className="absolute -right-1 top-0 select-none pointer-events-none text-lg"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.45 }}
            key={mood}
          >
            {mood === "happy" && "💗"}
            {mood === "normal" && "🩷"}
            {mood === "bored" && "💤"}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
