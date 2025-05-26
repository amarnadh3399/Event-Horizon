// src/app/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import CalendarControls from '@/components/CalendarControls';
import CalendarGrid from '@/components/CalendarGrid';
import EventModal from '@/components/EventModal';
import type { Event } from '@/lib/types';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const { selectedDate, setSelectedDate, events: userEvents, currentDate, setCurrentDate, getEventsForDate } = useEvents(); 
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      // router.push('/login'); // Optionally auto-redirect
    }
  }, [currentUser, isAuthLoading, router]);

  const handleAddEventClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setEditingEvent(undefined);
    setSelectedDate(new Date()); // Default to today for new events
    setIsEventModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setEditingEvent(undefined);
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setSelectedDate(parseISO(event.start));
    setIsEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(undefined);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };
  
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today); // Update calendar grid view to current month
    setSelectedDate(today); // Set selectedDate, which might highlight the day or be used by other components

    if (!currentUser) {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    // If authenticated, check for today's events and show appropriate toast
    const todaysEvents = getEventsForDate(today);
    if (todaysEvents.length === 0) {
      toast({
        title: "Today's Schedule",
        description: "No events scheduled for today.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Today's Schedule",
        description: `You have ${todaysEvents.length} event${todaysEvents.length > 1 ? 's' : ''} today. They are visible in the calendar.`,
        duration: 4000,
      });
    }
    // We do NOT open the EventModal automatically.
    // The user can click on the day or an event if they wish to interact further.
  };

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return userEvents;
    return userEvents.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      (event.description && event.description.toLowerCase().includes(searchTerm))
    );
  }, [userEvents, searchTerm]);


  if (isAuthLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader 
        onAddEventClick={handleAddEventClick} 
        onSearchChange={handleSearchChange}
      />
      <main className="flex-grow container mx-auto p-4">
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Event Horizon!</h2>
            <p className="text-muted-foreground mb-6">Please log in to manage your calendar.</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <CalendarControls onTodayClick={handleGoToToday} />
            <CalendarGrid 
              eventsToDisplay={filteredEvents}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          </div>
        )}
      </main>
      {currentUser && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={handleCloseEventModal}
          event={editingEvent}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
