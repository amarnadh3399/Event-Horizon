
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday as dateFnsIsToday,
  parseISO,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  endOfDay,
  startOfDay,
  getSeconds,
  getMilliseconds,
  setSeconds,
  setMilliseconds,
} from 'date-fns';
import type { Event, RecurrenceRule, RecurrenceFreq } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date Helpers
export const getCalendarMonthWeeks = (month: Date, weekStartsOn: 0 | 1 = 0): Date[][] => {
  const firstDayOfMonth = startOfMonth(month);
  const lastDayOfMonth = endOfMonth(month);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

export const formatMonthYear = (date: Date): string => format(date, 'MMMM yyyy');
export const formatDayNumber = (date: Date): string => format(date, 'd');
export const isCurrentMonth = (date: Date, month: Date): boolean => isSameMonth(date, month);
export const isSelectedDate = (date: Date, selectedDate: Date): boolean => isSameDay(date, selectedDate);
export const isToday = (date: Date): boolean => dateFnsIsToday(date);

export const getNextMonth = (date: Date): Date => addMonths(date, 1);
export const getPreviousMonth = (date: Date): Date => subMonths(date, 1);

export const combineDateAndTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  let newDate = setHours(date, hours);
  newDate = setMinutes(newDate, minutes);
  return newDate;
};

export const extractTimeFromDate = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Helper function to check if two events overlap
export function doEventsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}


// Recurring event logic
export function getOccurrences(event: Event, viewStartDate: Date, viewEndDate: Date): Event[] {
  const occurrences: Event[] = [];

  // Handle single, non-recurring event
  if (!event.recurrenceRule || event.recurrenceRule.freq === 'NONE') {
    const singleEventStart = parseISO(event.start);
    // Check if the single event itself overlaps with the view window
    if (singleEventStart <= viewEndDate && parseISO(event.end) >= viewStartDate) {
      occurrences.push(event); // For single events, id and originalId are the same or originalId is undefined
    }
    return occurrences;
  }

  const originalEventStartDateTime = parseISO(event.start);
  const duration = parseISO(event.end).getTime() - originalEventStartDateTime.getTime();
  const { freq, interval = 1, byweekday, bymonthday, until } = event.recurrenceRule;
  const untilDate = until ? endOfDay(parseISO(until)) : null; // Compare with end of 'until' day

  // currentPeriodStart is the reference date for the start of each recurrence interval period
  let currentPeriodStart = startOfDay(new Date(originalEventStartDateTime));


  for (let count = 0; count < 366; count++) { // Loop for a max of ~1 year of periods
    if (untilDate && currentPeriodStart > untilDate) {
      break;
    }
    // For weekly/monthly, currentPeriodStart might be before view, but days within might be in view.
    // Break if currentPeriodStart is well past viewEndDate.
    if (currentPeriodStart > addMonths(viewEndDate, 2) ) { // Generous buffer
        break;
    }

    let potentialOccurrenceDaysInPeriod: Date[] = [];

    if (freq === 'DAILY') {
      potentialOccurrenceDaysInPeriod.push(new Date(currentPeriodStart));
    } else if (freq === 'WEEKLY') {
      const daysToGenerate = (byweekday && byweekday.length > 0) ? byweekday : [originalEventStartDateTime.getDay()];
      for (const dayIndex of daysToGenerate) {
        // Get the start of the week for currentPeriodStart (e.g., Sunday)
        let dayInWeek = startOfWeek(currentPeriodStart, { weekStartsOn: 0 });
        // Set the date to the target dayIndex within that week
        dayInWeek.setDate(dayInWeek.getDate() + dayIndex);
        potentialOccurrenceDaysInPeriod.push(dayInWeek);
      }
    } else if (freq === 'MONTHLY') {
      const dayOfMonthToGenerate = bymonthday !== undefined ? bymonthday : originalEventStartDateTime.getDate();
      let dayInMonth = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), dayOfMonthToGenerate);
      // Ensure the generated date is still in the same month (e.g., not Feb 30 becoming Mar 2)
      if (dayInMonth.getMonth() === currentPeriodStart.getMonth()) {
        potentialOccurrenceDaysInPeriod.push(dayInMonth);
      }
    }

    for (const day of potentialOccurrenceDaysInPeriod) {
      // Ensure this specific occurrence day is not before the original event start day
      if (day < startOfDay(originalEventStartDateTime)) continue;
      // Ensure this specific occurrence day is not after the 'until' date
      if (untilDate && day > untilDate) continue;

      // Construct the full date-time for the occurrence
      let occurrenceStartDateTime = startOfDay(day); // Start with midnight of the occurrence day
      occurrenceStartDateTime = setHours(occurrenceStartDateTime, getHours(originalEventStartDateTime));
      occurrenceStartDateTime = setMinutes(occurrenceStartDateTime, getMinutes(originalEventStartDateTime));
      occurrenceStartDateTime = setSeconds(occurrenceStartDateTime, getSeconds(originalEventStartDateTime));
      occurrenceStartDateTime = setMilliseconds(occurrenceStartDateTime, getMilliseconds(originalEventStartDateTime));

      const occurrenceEndDateTime = new Date(occurrenceStartDateTime.getTime() + duration);

      // Check if this specific occurrence is within the view window
      if (occurrenceStartDateTime <= viewEndDate && occurrenceEndDateTime >= viewStartDate) {
        occurrences.push({
          ...event, // Spreads the base event
          id: `${event.id}-occurrence-${format(occurrenceStartDateTime, 'yyyyMMddHHmmssSSS')}`, // Unique ID for this instance
          originalId: event.id, // Reference to the base event's ID
          start: occurrenceStartDateTime.toISOString(),
          end: occurrenceEndDateTime.toISOString(),
        });
      }
    }
    
    if (occurrences.length >= 365 * (Array.isArray(byweekday) ? byweekday.length : 1) ) break; // More generous overall safety break

    // Advance currentPeriodStart to the next interval
    if (freq === 'DAILY') {
      currentPeriodStart.setDate(currentPeriodStart.getDate() + interval);
    } else if (freq === 'WEEKLY') {
      currentPeriodStart.setDate(currentPeriodStart.getDate() + 7 * interval);
    } else if (freq === 'MONTHLY') {
      currentPeriodStart = addMonths(currentPeriodStart, interval);
    } else {
      break; // Should not happen for valid freq
    }
  }

  // Sort and deduplicate occurrences, just in case
  occurrences.sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
  const uniqueOccurrences: Event[] = [];
  const seenStartTimes = new Set<string>();
  for (const occ of occurrences) {
    if (!seenStartTimes.has(occ.start)) {
      uniqueOccurrences.push(occ);
      seenStartTimes.add(occ.start);
    }
  }
  return uniqueOccurrences;
}

