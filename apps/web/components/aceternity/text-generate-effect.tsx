"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Registry component adapted for reliability: each word animates on mount with
 * its own transition instead of relying on a ref-dependent imperative effect.
 * Reduced-motion users get the full sentence immediately via globals.css.
 */
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const wordsArray = words.split(" ");
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn("font-medium", className)}>
      <div className="leading-snug" style={{ fontSize: "inherit", lineHeight: 1.18, letterSpacing: "-0.02em" }}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            initial={reduceMotion ? false : { opacity: 0, filter: filter ? "blur(10px)" : "none" }}
            animate={{ opacity: 1, filter: filter ? "blur(0px)" : "none" }}
            transition={{ duration, delay: idx * 0.11, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </div>
    </div>
  );
};
