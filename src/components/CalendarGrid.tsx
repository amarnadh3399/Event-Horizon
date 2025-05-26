// src/components/CalendarGrid.tsx
"use client";

import React, { useMemo } from 'react';
import { useEvents } from '@/contexts/EventsContext';
import { getCalendarMonthWeeks, isCurrentMonth as checkIsCurrentMonth, getOccurrences } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/types';
import CalendarDay from './CalendarDay';
import type { Event } from '@/lib/types';
import { startOfMonth, endOfMonth, parseISO, format as formatDateString } from 'date-fns';

interface CalendarGridProps {
  eventsToDisplay: Event[]; // Renamed to clarify these are pre-filtered by search
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ eventsToDisplay, onDayClick, onEventClick }) => {
  const { currentDate } = useEvents(); // Only need currentDate from context here
  const weeks = useMemo(() => getCalendarMonthWeeks(currentDate, 0), [currentDate]); // 0 for Sunday start

  const viewStartDate = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const viewEndDate = useMemo(() => endOfMonth(currentDate), [currentDate]);

  const visibleEvents = useMemo(() => {
    const eventMap = new Map<string, Event[]>(); // Key: yyyy-MM-dd (local)
    eventsToDisplay.forEach(event => { // Use prop 'eventsToDisplay' instead of context's allEvents
      const occurrences = getOccurrences(event, viewStartDate, viewEndDate);
      occurrences.forEach(occ => {
        const localStartDate = parseISO(occ.start); // Convert event's UTC start to local Date
        const dateKey = formatDateString(localStartDate, 'yyyy-MM-dd'); // Format local Date to yyyy-MM-dd
        if (!eventMap.has(dateKey)) {
          eventMap.set(dateKey, []);
        }
        eventMap.get(dateKey)!.push(occ);
      });
    });
    return eventMap;
  }, [eventsToDisplay, viewStartDate, viewEndDate]);


  return (
    <div className="bg-card shadow rounded-b-lg">
      <div className="grid grid-cols-7 border-l border-t">
        {WEEKDAYS.map(day => (
          <div key={day} className="p-2 text-center font-medium text-muted-foreground text-sm border-b border-r bg-muted/50">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l">
        {weeks.map((week, i) =>
          week.map((day, j) => {
            const dayKey = formatDateString(day, 'yyyy-MM-dd'); // Format local calendar day to yyyy-MM-dd
            const dayEvents = visibleEvents.get(dayKey) || [];
            return (
              <CalendarDay
                key={`${i}-${j}`}
                date={day}
                isCurrentMonth={checkIsCurrentMonth(day, currentDate)}
                events={dayEvents}
                onDayClick={onDayClick}
                onEventClick={onEventClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;
