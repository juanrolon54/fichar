/**
 * New schedule format: Array of [start_minutes, duration_minutes] tuples
 * Where start_minutes is minutes from beginning of week (Sunday 00:00 UTC = 0)
 * And duration_minutes is the length of the class in minutes
 */

export type ScheduleTuple = [number, number] // [start_minutes_from_week_start, duration_minutes]
export type Schedule = ScheduleTuple[]

export function convertTimeToUTCWithMinutes(timeString: string, offsetMinutes: number, originalDay: string) {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
    // Subtract timezone offset to get UTC
    date.setMinutes(date.getMinutes() + offsetMinutes)
    
    // Calculate total minutes shift due to timezone conversion
    const totalMinutesShift = offsetMinutes
    const originalDayNum = parseInt(originalDay)
    
    // Get original minutes from week start
    const originalMinutesFromWeekStart = (originalDayNum * 24 * 60) + (hours * 60) + minutes
    
    // Apply timezone shift
    let utcMinutesFromWeekStart = originalMinutesFromWeekStart + totalMinutesShift
    
    // Handle week wrapping
    if (utcMinutesFromWeekStart < 0) {
        utcMinutesFromWeekStart += 7 * 24 * 60 // Add a full week
    } else if (utcMinutesFromWeekStart >= 7 * 24 * 60) {
        utcMinutesFromWeekStart -= 7 * 24 * 60 // Subtract a full week
    }
    
    return utcMinutesFromWeekStart
}


/**
 * Updated schedule checking function
 */
export function withinSchedule(
    schedule: Schedule, 
    startDate: Date | number, 
    endDate: Date | number,
    currentTime?: Date
):ScheduleTuple | null {
    const now = currentTime || new Date()
    
    // Convert dates to Date objects if they're timestamps
    const courseStart = startDate instanceof Date ? startDate : new Date(startDate)
    const courseEnd = endDate instanceof Date ? endDate : new Date(endDate)
    
    // Check if current date is within the course date range
    if (now < courseStart || now >= courseEnd) {
        return null
    }
    
    // Get current minutes from week start (UTC)
    const currentDayOfWeek = now.getUTCDay()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    const currentMinutesFromWeekStart = (currentDayOfWeek * 24 * 60) + (currentHour * 60) + currentMinute
    // Check if current time falls within any scheduled period
    return schedule.find(([startMinutes, duration]) => {
        const endMinutes = startMinutes + duration
        
        // Handle case where schedule might wrap around the week
        if (endMinutes > 7 * 24 * 60) {
            // Schedule wraps to next week
            const wrapAroundEnd = endMinutes - 7 * 24 * 60
            return (currentMinutesFromWeekStart >= startMinutes) || 
                   (currentMinutesFromWeekStart <= wrapAroundEnd)
        } else {
            // Normal case - no week wrapping
            return currentMinutesFromWeekStart >= startMinutes && 
                   currentMinutesFromWeekStart <= endMinutes
        }
    }) ?? null
}

/**
 * Get the timestamp for the beginning of a schedule tuple in the current week
 */
export function getScheduleTupleStartTimestamp(tuple: ScheduleTuple, currentTime?: Date): Date {
    const now = currentTime || new Date()
    
    // Get start of current week (Sunday 00:00 UTC)
    const startOfWeek = new Date(now)
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay())
    startOfWeek.setUTCHours(0, 0, 0, 0)
    
    // Add the tuple's start minutes
    const [startMinutes] = tuple
    const tupleStart = new Date(startOfWeek.getTime() + (startMinutes * 60 * 1000))
    
    return tupleStart
}

export function isCourseCookieValid(cookie: string, courseCode: string, scheduleTuple: ScheduleTuple) {
    const [cookieCourseCode, timestampStr] = cookie.split('|')
    if (cookieCourseCode !== courseCode || !timestampStr) return false
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay())
    startOfWeek.setUTCHours(0, 0, 0, 0)
    const currentSlotStart = new Date(startOfWeek.getTime() + (scheduleTuple[0] * 60 * 1000))
    
    return timestampStr !== currentSlotStart.toISOString()
}