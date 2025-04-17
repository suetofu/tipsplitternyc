/**
 * Calculate hours worked between clock-in and clock-out times,
 * with support for shifts spanning past midnight
 */
export function calculateHoursWorked(clockIn: string, clockOut: string, roundingMinutes: number = 15): number {
  if (!clockIn || !clockOut) return 0;
  
  // Parse times using dummy date for easier calculation
  const baseDate = '2000-01-01T';
  const inTime = new Date(`${baseDate}${clockIn}`);
  let outTime = new Date(`${baseDate}${clockOut}`);
  
  // Handle shifts that go past midnight
  if (outTime < inTime) {
    outTime = new Date(outTime.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Calculate difference in hours
  let hoursWorked = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
  
  // Apply rounding
  if (roundingMinutes > 0) {
    const fractionalHours = hoursWorked % 1;
    const fractionalMinutes = fractionalHours * 60;
    const roundedMinutes = Math.round(fractionalMinutes / roundingMinutes) * roundingMinutes;
    hoursWorked = Math.floor(hoursWorked) + (roundedMinutes / 60);
  }
  
  return hoursWorked;
}

/**
 * Format a time value for display
 */
export function formatTime(time: string): string {
  if (!time) return '';
  
  try {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (error) {
    return time;
  }
}
