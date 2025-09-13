"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
  className?: string;
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
}

export function AuroraText({
  className,
  children,
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1,
}: AuroraTextProps) {
  return (
    <span
      className={cn(
        "inline-block font-semibold",
        className
      )}
      style={{
        background: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "400% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        animation: `aurora ${4 / speed}s ease-in-out infinite`,
      }}
    >
      {children}
      <style jsx global>{`
        @keyframes aurora {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  );
}