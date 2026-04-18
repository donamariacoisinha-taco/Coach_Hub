
export const calculateStreak = (historyDates: string[]): number => {
  if (historyDates.length === 0) return 0;

  const sortedDates = [...new Set(historyDates.map(d => new Date(d).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!sortedDates || sortedDates.length === 0) return 0;
  const lastWorkoutDate = new Date(sortedDates[0]);
  lastWorkoutDate.setHours(0, 0, 0, 0);

  // If last workout was not today or yesterday, streak is broken
  if (lastWorkoutDate.getTime() < yesterday.getTime()) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    current.setHours(0, 0, 0, 0);
    
    const previous = new Date(sortedDates[i + 1]);
    previous.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(current.getTime() - previous.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
