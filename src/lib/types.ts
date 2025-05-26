
export type RecurrenceFreq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval?: number; // e.g., every X days/weeks/months
  byweekday?: number[]; // 0 (Sun) to 6 (Sat) for WEEKLY
  bymonthday?: number; // 1-31 for MONTHLY (day of the month)
  until?: string; // ISO date string
}

export interface User {
  id: string; // Typically username, will be stored as lowercase
  name: string; // Display name
  password?: string; // Password for the user - !! In a real app, this should be securely hashed !!
}

export interface Event {
  id: string; // For single events or base recurring events. For occurrences, this is the unique occurrence ID.
  originalId?: string; // For occurrences, this is the ID of the base recurring event.
  userId: string; // ID of the user who owns the event
  title: string;
  start: string; // ISO string for start datetime
  end: string;   // ISO string for end datetime
  description?: string;
  color?: string; // e.g., hex code like '#4285F4'
  recurrenceRule?: RecurrenceRule;
  
  // Fields for AI suggestions - might be transient or stored if user accepts them
  aiSuggestedAgenda?: string;
  aiExtractedLocations?: string[];
  aiExtractedAttendees?: string[];
  aiSuggestedTimeslots?: string[]; // For common availability
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

// For form handling, id and userId are optional/managed elsewhere
// Omit<Event, 'id' | 'userId'> will include originalId, which is intended.
export type EventFormData = Omit<Event, 'id' | 'userId'> & { id?: string; userId?: string }; 

export const EVENT_COLORS = [
  { name: 'Blue', value: 'hsl(var(--primary))' },
  { name: 'Purple', value: 'hsl(var(--accent))' },
  { name: 'Green', value: 'hsl(145 63% 49%)' }, // Tailwind Green 500
  { name: 'Yellow', value: 'hsl(48 96% 53%)' }, // Tailwind Yellow 500
  { name: 'Red', value: 'hsl(0 72% 51%)' },    // Tailwind Red 500
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

