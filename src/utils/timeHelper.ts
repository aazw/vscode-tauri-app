export const getRelativeTime = (dateString: string): string => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute(s) ago`;
  } else if (diffInMinutes < 1440) { // 24 hours = 1440 minutes
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour(s) ago`;
  } else {
    const diffInDays = Math.floor(diffInMinutes / 1440);
    return `${diffInDays} day(s) ago`;
  }
};