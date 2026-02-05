"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface FlareConfig {
  id: string;
  width: string;
  height: string;
  top?: string;
  left?: string;
  right?: string;
  color: string;
  opacity: number;
  blur: "blur-xl" | "blur-2xl" | "blur-3xl";
  animation: string;
  animationDelay: string;
  centered?: boolean;
}

const flareConfigs: FlareConfig[] = [
  {
    id: "main",
    width: "800px",
    height: "600px",
    top: "-10%",
    color: "#ff4d00",
    opacity: 0.06,
    blur: "blur-3xl",
    animation: "animate-flare-pulse",
    animationDelay: "0s",
    centered: true,
  },
  {
    id: "secondary",
    width: "300px",
    height: "300px",
    top: "-5%",
    left: "15%",
    color: "#ff6b35",
    opacity: 0.07,
    blur: "blur-3xl",
    animation: "animate-flare-float-y",
    animationDelay: "1s",
  },
  {
    id: "tertiary",
    width: "400px",
    height: "350px",
    top: "50%",
    color: "#ff4d00",
    opacity: 0.04,
    blur: "blur-3xl",
    animation: "animate-flare-pulse",
    animationDelay: "2s",
    centered: true,
  },
  {
    id: "accent",
    width: "200px",
    height: "200px",
    top: "20%",
    right: "10%",
    color: "#ff8c00",
    opacity: 0.05,
    blur: "blur-2xl",
    animation: "animate-flare-float-diagonal",
    animationDelay: "0.5s",
  },
  {
    id: "ambient",
    width: "250px",
    height: "250px",
    top: "40%",
    left: "5%",
    color: "#ff4d00",
    opacity: 0.05,
    blur: "blur-3xl",
    animation: "animate-flare-scale-pulse",
    animationDelay: "1.5s",
  },
  {
    id: "highlight",
    width: "180px",
    height: "180px",
    top: "60%",
    right: "20%",
    color: "#ffb366",
    opacity: 0.06,
    blur: "blur-2xl",
    animation: "animate-flare-float-x",
    animationDelay: "0.8s",
  },
];

interface FlareBackgroundProps {
  className?: string;
}

export function FlareBackground({ className }: FlareBackgroundProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {/* Static gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff4d00]/[0.03] via-transparent to-transparent" />

      {/* Animated flares */}
      {flareConfigs.map((flare, index) => (
        <motion.div
          key={flare.id}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: flare.opacity, scale: 1 }}
          transition={{
            delay: 0.2 + index * 0.15,
            duration: 1,
            ease: "easeOut",
          }}
          viewport={{ once: true }}
          className={cn(
            "absolute rounded-full will-change-transform",
            flare.blur,
            flare.animation
          )}
          style={{
            width: flare.width,
            height: flare.height,
            backgroundColor: flare.color,
            top: flare.top,
            left: flare.centered ? "50%" : flare.left,
            right: flare.right,
            transform: flare.centered ? "translateX(-50%)" : undefined,
            animationDelay: flare.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
