export const checkRateLimit = (key) => {
  if (typeof window === "undefined") return { allowed: true };

  const now = Date.now();
  const limit = 15;
  const windowMs = 60 * 1000; // 60 seconds

  try {
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    
    // Filter out timestamps older than the sliding window (60 seconds)
    const validTimestamps = history.filter((timestamp) => now - timestamp < windowMs);

    if (validTimestamps.length >= limit) {
      const oldestTimestamp = validTimestamps[0];
      const waitTimeSec = Math.ceil((windowMs - (now - oldestTimestamp)) / 1000);
      return { allowed: false, waitTime: waitTimeSec };
    }

    // Push current timestamp and save
    validTimestamps.push(now);
    localStorage.setItem(key, JSON.stringify(validTimestamps));
    return { allowed: true };
  } catch (e) {
    console.error("Rate limit check failed:", e);
    return { allowed: true }; // Fail open so users aren't locked out due to storage issues
  }
};
