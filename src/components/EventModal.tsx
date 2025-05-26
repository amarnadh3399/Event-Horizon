// src/components/EventModal.tsx
"use client";

import React from 'react';
import type { Event } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EventForm from './EventForm';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event; // For editing
  selectedDate?: Date | null; // For pre-filling date for new event
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, event, selectedDate }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update the details of your event.' : 'Fill in the details for your new event.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <EventForm event={event} selectedDate={selectedDate} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
