// src/components/RecurrenceEditor.tsx
"use client";

import React from 'react';
import type { RecurrenceRule, RecurrenceFreq } from '@/lib/types';
import { WEEKDAYS } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from './ui/button';

interface RecurrenceEditorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({ value, onChange }) => {
  const handleFreqChange = (freq: RecurrenceFreq) => {
    const newRule: RecurrenceRule = { freq };
    if (freq === 'WEEKLY') newRule.byweekday = value.byweekday || [new Date().getDay()]; // Default to current day of week
    if (freq === 'MONTHLY') newRule.bymonthday = value.bymonthday || new Date().getDate(); // Default to current day of month
    if (freq !== 'NONE') newRule.interval = value.interval || 1;
    onChange(newRule);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value, 10);
    if (!isNaN(interval) && interval > 0) {
      onChange({ ...value, interval });
    } else if (e.target.value === '') {
       onChange({ ...value, interval: undefined });
    }
  };

  const handleWeekdayToggle = (dayIndex: number) => {
    const byweekday = value.byweekday ? [...value.byweekday] : [];
    const index = byweekday.indexOf(dayIndex);
    if (index > -1) {
      byweekday.splice(index, 1);
    } else {
      byweekday.push(dayIndex);
    }
    onChange({ ...value, byweekday });
  };

  const handleMonthDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(e.target.value, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      onChange({ ...value, bymonthday: day });
    } else if (e.target.value === '') {
      onChange({ ...value, bymonthday: undefined });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/20">
      <h4 className="font-medium">Recurrence</h4>
      <div>
        <Label htmlFor="recurrence-freq">Frequency</Label>
        <Select value={value.freq} onValueChange={(val) => handleFreqChange(val as RecurrenceFreq)}>
          <SelectTrigger id="recurrence-freq">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None (Single Event)</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.freq !== 'NONE' && (
        <div>
          <Label htmlFor="recurrence-interval">Repeat every</Label>
          <div className="flex items-center gap-2">
            <Input
              id="recurrence-interval"
              type="number"
              min="1"
              value={value.interval || ''}
              onChange={handleIntervalChange}
              className="w-20"
            />
            <span>{value.freq === 'DAILY' ? 'day(s)' : value.freq === 'WEEKLY' ? 'week(s)' : 'month(s)'}</span>
          </div>
        </div>
      )}

      {value.freq === 'WEEKLY' && (
        <div>
          <Label>Repeat on</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {WEEKDAYS.map((day, index) => (
              <Button
                key={day}
                type="button"
                variant={value.byweekday?.includes(index) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleWeekdayToggle(index)}
                className="min-w-[40px]"
              >
                {day.substring(0,1)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {value.freq === 'MONTHLY' && (
        <div>
          <Label htmlFor="recurrence-monthday">Day of month</Label>
          <Input
            id="recurrence-monthday"
            type="number"
            min="1"
            max="31"
            value={value.bymonthday || ''}
            onChange={handleMonthDayChange}
            className="w-20"
          />
        </div>
      )}
      {/* TODO: Add 'Ends on' (until date) functionality */}
    </div>
  );
};

export default RecurrenceEditor;
