export function calculateLevel(xp) {
  if (!Number.isFinite(xp) || xp < 0) return 1;
  return Math.floor(xp / 100) + 1;
}

export function calculateStreak(lastTaskDate, now = new Date(), currentStreak = 0) {
  if (!lastTaskDate) return 1;
  const lastDate = new Date(lastTaskDate);
  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((currentDate - lastDate) / 86_400_000);
  if (diffDays === 1) return currentStreak > 0 ? currentStreak + 1 : 2;
  if (diffDays === 0) return Math.max(1, currentStreak);
  return 1;
}

export function calculateXpGain(difficulty) {
  if (difficulty === "Boss") return 50;
  if (difficulty === "Medium") return 20;
  return 10;
}

export function getRank(users, currentUser) {
  const sorted = [...users].sort((left, right) => right.xp - left.xp);

  if (currentUser?.user_id != null) {
    const index = sorted.findIndex((user) => user.user_id === currentUser.user_id);
    return index === -1 ? sorted.length + 1 : index + 1;
  }

  const xpMatch = currentUser?.xp != null ? sorted.findIndex((user) => user.xp === currentUser.xp) : -1;
  return xpMatch === -1 ? sorted.length + 1 : xpMatch + 1;
}

export function getRankDetails(xp, level = 1) {
  if (level >= 25) {
    return {
      title: "Prestige Overlord",
      tier: "Prestige",
      emoji: "👑",
      badgeColor: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-yellow-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]",
    };
  }
  if (level >= 20) {
    return {
      title: "Grandmaster Titan",
      tier: "Diamond",
      emoji: "💎",
      badgeColor: "bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    };
  }
  if (level >= 15) {
    return {
      title: "Apex Scholar",
      tier: "Gold",
      emoji: "🥇",
      badgeColor: "bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 border-yellow-200",
    };
  }
  if (level >= 11) {
    return {
      title: "Master Tactician",
      tier: "Gold",
      emoji: "🥇",
      badgeColor: "bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 border-yellow-200",
    };
  }
  if (level >= 8) {
    return {
      title: "Legendary Scholar",
      tier: "Silver",
      emoji: "🥈",
      badgeColor: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 border-slate-200",
    };
  }
  if (level >= 6) {
    return {
      title: "Elite Grinder",
      tier: "Silver",
      emoji: "🥈",
      badgeColor: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 border-slate-200",
    };
  }
  if (level >= 4) {
    return {
      title: "Quest Hunter",
      tier: "Bronze",
      emoji: "🥉",
      badgeColor: "bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 border-amber-600",
    };
  }
  if (level >= 2) {
    return {
      title: "Study Slayer",
      tier: "Bronze",
      emoji: "🥉",
      badgeColor: "bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 border-amber-600",
    };
  }
  return {
    title: "Fresh Recruit",
    tier: "Rookie",
    emoji: "🌱",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
  };
}
