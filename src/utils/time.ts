/**
 * Simple UTC schedule check for Cloudflare Workers
 * Since everything is stored as UTC, we just check current UTC time against UTC schedule
 */
function isWithinSchedule(schedule: { [key: string]: [string, string] }, startDate: Date | number, endDate: Date | number, currentTime?: Date) {
    const now = currentTime || new Date()

    // Convert dates to Date objects if they're timestamps
    const courseStart = startDate instanceof Date ? startDate : new Date(startDate)
    const courseEnd = endDate instanceof Date ? endDate : new Date(endDate)

    // Check if current date is within the course date range
    if (now < courseStart || now > courseEnd) {
        return false
    }

    // Get current UTC day (0=Sunday, 1=Monday, etc.)
    const currentDayOfWeek = now.getUTCDay().toString()

    // Check if today is a scheduled day
    if (!schedule[currentDayOfWeek]) {
        return false
    }

    // Get current UTC time in HH:MM format
    const currentTimeString = now.toISOString().slice(11, 16) // "HH:MM"

    // Get the scheduled hours for today
    const [startTime, endTime] = schedule[currentDayOfWeek]

    // Simple string comparison works for HH:MM format
}
