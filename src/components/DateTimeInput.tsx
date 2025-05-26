// src/components/DateTimeInput.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn, combineDateAndTime, extractTimeFromDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimeInputProps {
  id: string;
  label: string;
  value: string; // ISO string
  onChange: (isoString: string) => void;
  disabled?: boolean;
}

const DateTimeInput: React.FC<DateTimeInputProps> = ({ id, label, value, onChange, disabled }) => {
  const initialDate = value ? parseISO(value) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState<string>(extractTimeFromDate(initialDate));
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const newDate = parseISO(value);
      setSelectedDate(newDate);
      setTime(extractTimeFromDate(newDate));
    }
  }, [value]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const combined = combineDateAndTime(date, time);
      onChange(combined.toISOString());
      setPopoverOpen(false); // Close popover after selecting a date
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (selectedDate) {
      const combined = combineDateAndTime(selectedDate, newTime);
      onChange(combined.toISOString());
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-date`}>{label}</Label>
      <div className="flex gap-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              id={`${id}-date`}
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
        <Input
          id={`${id}-time`}
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-[120px]"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default DateTimeInput;
