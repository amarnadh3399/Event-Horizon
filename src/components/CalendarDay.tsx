// src/components/CalendarDay.tsx
"use client";

import React from 'react';
import type { Event } from '@/lib/types';
import { cn, formatDayNumber, isToday as checkIsToday } from '@/lib/utils';
import EventCard from './EventCard';
import { useEvents } from '@/contexts/EventsContext'; // Import useEvents

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, isCurrentMonth, events, onDayClick, onEventClick }) => {
  const isToday = checkIsToday(date);
  const { moveEvent } = useEvents(); // Get moveEvent from context

  const dayNumberClasses = cn(
    "flex items-center justify-center h-8 w-8 rounded-full text-sm transition-colors",
    isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-50",
    isToday && "bg-accent text-accent-foreground font-bold",
    !isToday && isCurrentMonth && "hover:bg-primary/10",
  );
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId) {
      await moveEvent(eventId, date); // Pass the date of this CalendarDay cell
    }
  };


  return (
    <div
      className={cn(
        "h-32 border-t border-r p-1 flex flex-col overflow-hidden relative",
        "bg-card",
        !isCurrentMonth && "bg-muted/30",
        isCurrentMonth && "hover:shadow-inner"
      )}
      onClick={() => onDayClick(date)}
      onDragOver={handleDragOver} 
      onDrop={handleDrop} 
    >
      <div className="flex justify-end mb-1">
        <span className={dayNumberClasses}>
          {formatDayNumber(date)}
        </span>
      </div>
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
        {events.map(event => (
          <EventCard key={event.id} event={event} onEdit={onEventClick} />
        ))}
      </div>
    </div>
  );
};

export default CalendarDay;
