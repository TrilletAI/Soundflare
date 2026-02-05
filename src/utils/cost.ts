export function telecomCost(
    durationSeconds: number,
    ratePaisePerMin: number = 0.7 * 100 // 0.7 cents = $0.007; default per user request
  ): number {
    const minutes = Math.ceil(durationSeconds / 60) || 1;
    return (ratePaisePerMin / 100) * minutes;
  }