
// src/components/EventCard.tsx
"use client";

import React from 'react';
import type { Event } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Clock } from 'lucide-react'; // Removed Edit2, Trash2 as they are commented out
import { useEvents } from '@/contexts/EventsContext'; 

interface EventCardProps {
  event: Event; // This 'event' can be a base event or an occurrence
  onEdit: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const { deleteEvent } = useEvents(); 
  const startTime = format(parseISO(event.start), 'p'); 

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event); // Pass the full event object (which includes originalId if it's an occurrence)
  }

  const handleDragStart = (e: React.DragEvent) => {
    // When dragging, we want to operate on the base event if it's part of a series.
    // If it's a single event, event.originalId will be undefined, so event.id (baseId) is used.
    // If it's an occurrence, event.originalId (baseId) is used.
    const idToDrag = event.originalId || event.id; 
    e.dataTransfer.setData('text/plain', idToDrag);
    e.dataTransfer.effectAllowed = "move";
  };


  return (
    <div
      className="mb-1 p-1.5 rounded-md text-xs cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: event.color || 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
      onClick={handleEdit}
      draggable={true} 
      onDragStart={handleDragStart}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="flex items-center opacity-80">
        <Clock size={12} className="mr-1" />
        {startTime}
      </div>
      {/* 
      <div className="mt-1 flex gap-1 justify-end">
        <Button size="icon" variant="ghost" className="h-5 w-5 text-primary-foreground hover:bg-primary/80" onClick={handleEdit}>
          <Edit2 size={12} />
        </Button>
        <Button size="icon" variant="ghost" className="h-5 w-5 text-primary-foreground hover:bg-primary/80" onClick={handleDelete}>
          <Trash2 size={12} />
        </Button>
      </div>
      */}
    </div>
  );
};

export default EventCard;

