import { Zap, Flame } from "lucide-react";
import "./XpStreakBadge.css";

// Gamification is seasoning, not the meal (PRODUCT.md) -- small, calm, never competing visually
// with the lesson content itself.
export function XpStreakBadge({ xp, streak }) {
  const hasXp = typeof xp === "number";
  const hasStreak = typeof streak === "number" && streak > 0;

  if (!hasXp && !hasStreak) return null;

  return (
    <div className="xp-streak-badge">
      {hasXp ? (
        <span className="xp-streak-badge__item xp-streak-badge__item--xp">
          <Zap size={14} aria-hidden="true" />
          {xp} XP
        </span>
      ) : null}
      {hasStreak ? (
        <span className="xp-streak-badge__item xp-streak-badge__item--streak">
          <Flame size={14} aria-hidden="true" />
          {streak}-day streak
        </span>
      ) : null}
    </div>
  );
}
