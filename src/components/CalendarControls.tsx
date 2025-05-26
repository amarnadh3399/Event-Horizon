// src/components/CalendarControls.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useEvents } from '@/contexts/EventsContext';
import { formatMonthYear, getNextMonth, getPreviousMonth } from '@/lib/utils';

interface CalendarControlsProps {
  onTodayClick?: () => void; // Prop to handle custom "Today" button click
}

const CalendarControls: React.FC<CalendarControlsProps> = ({ onTodayClick }) => {
  const { currentDate, setCurrentDate } = useEvents();

  const handlePreviousMonth = () => {
    setCurrentDate(getPreviousMonth(currentDate));
  };

  const handleNextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };

  const handleToday = () => {
    if (onTodayClick) {
      onTodayClick();
    } else {
      // Default behavior if no custom handler is provided (though HomePage will provide one)
      setCurrentDate(new Date());
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-t-lg shadow">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-card-foreground min-w-[180px] text-center">
          {formatMonthYear(currentDate)}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <Button variant="outline" onClick={handleToday} className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Today
      </Button>
    </div>
  );
};

export default CalendarControls;
