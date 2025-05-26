// src/contexts/EventsContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  parseISO, 
  startOfDay, 
  endOfDay, 
  format as formatDateFn,
  getHours, 
  getMinutes, 
  getSeconds, 
  getMilliseconds, 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds,
  addYears, // Added for conflict checking window
  min as minDate // Added for conflict checking window
} from 'date-fns';
import type { Event, EventFormData } from '@/lib/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { extractEventDetails } from '@/ai/flows/extract-event-details';
import { suggestMeetingAgenda } from '@/ai/flows/suggest-meeting-agenda';
import { findCommonAvailability } from '@/ai/flows/find-common-availability';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext'; // Import useAuth
import { doEventsOverlap, getOccurrences } from '@/lib/utils';

interface EventsContextType {
  events: Event[]; 
  allEventsCount: number; 
  currentDate: Date;
  selectedDate: Date | null;
  addEvent: (eventData: Omit<EventFormData, 'userId'>) => Promise<void>; 
  updateEvent: (eventId: string, eventData: Partial<Omit<EventFormData, 'userId'>>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  moveEvent: (eventId: string, newDay: Date) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  getEventsForDate: (date: Date) => Event[]; 
  
  isExtractingDetails: boolean;
  extractDetailsForDescription: (description: string) => Promise<{ locations: string[], attendees: string[] } | null>;
  isSuggestingAgenda: boolean;
  suggestAgendaForTitle: (title: string) => Promise<string | null>;
  isFindingAvailability: boolean;
  findCommonTimeSlots: (attendees: string[], title: string, description: string) => Promise<string[] | null>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'eventHorizonEvents';


// Internal helper for conflict checking
const checkForRecurringConflicts = (
  potentialEventDetails: Omit<Event, 'id' | 'userId'> & { id?: string }, // Can be new or for update
  existingUserEvents: Event[],
  currentUserId: string,
  eventIdToExclude?: string // The ID of the event being updated, if any
): { hasConflict: boolean; message?: string } => {

  const fullPotentialEvent: Event = {
    id: potentialEventDetails.id || `temp-check-${Date.now()}`, // Use given ID or temp for getOccurrences
    userId: currentUserId,
    title: potentialEventDetails.title,
    start: potentialEventDetails.start,
    end: potentialEventDetails.end,
    description: potentialEventDetails.description || '',
    color: potentialEventDetails.color || '',
    recurrenceRule: potentialEventDetails.recurrenceRule || { freq: 'NONE' },
    aiSuggestedAgenda: potentialEventDetails.aiSuggestedAgenda || '',
    aiExtractedLocations: potentialEventDetails.aiExtractedLocations || [],
    aiExtractedAttendees: potentialEventDetails.aiExtractedAttendees || [],
    aiSuggestedTimeslots: potentialEventDetails.aiSuggestedTimeslots || [],
  };

  const eventsToCompareAgainst = existingUserEvents.filter(event => event.id !== eventIdToExclude);

  // Case 1: The potential event is a single, non-recurring event
  if (!fullPotentialEvent.recurrenceRule || fullPotentialEvent.recurrenceRule.freq === 'NONE') {
    const potStart = parseISO(fullPotentialEvent.start);
    const potEnd = parseISO(fullPotentialEvent.end);

    for (const existingEvent of eventsToCompareAgainst) {
      // Check occurrences of existingEvent on the day of the potential single event
      const existingOccurrencesOnDay = getOccurrences(existingEvent, startOfDay(potStart), endOfDay(potStart));
      for (const exOcc of existingOccurrencesOnDay) {
        if (doEventsOverlap(potStart, potEnd, parseISO(exOcc.start), parseISO(exOcc.end))) {
          return {
            hasConflict: true,
            message: `"${fullPotentialEvent.title}" on ${formatDateFn(potStart, 'PPP p')} conflicts with "${existingEvent.title}" (instance on ${formatDateFn(parseISO(exOcc.start), 'PPP p')}).`
          };
        }
      }
    }
    return { hasConflict: false };
  }

  // Case 2: The potential event is recurring
  const checkStartDate = parseISO(fullPotentialEvent.start);
  let checkEndDate = addYears(checkStartDate, 1); // Default to 1 year for conflict checking
  if (fullPotentialEvent.recurrenceRule?.until) {
    const untilD = parseISO(fullPotentialEvent.recurrenceRule.until);
    checkEndDate = minDate(checkEndDate, endOfDay(untilD)); // Use end of 'until' day
  }
   // Ensure checkEndDate is not before checkStartDate
  if (checkEndDate < checkStartDate) checkEndDate = endOfDay(checkStartDate);


  const potentialOccurrences = getOccurrences(fullPotentialEvent, checkStartDate, checkEndDate);

  for (const potOcc of potentialOccurrences) {
    const potOccStart = parseISO(potOcc.start);
    const potOccEnd = parseISO(potOcc.end);
    for (const existingEvent of eventsToCompareAgainst) {
      // Check occurrences of existingEvent on the day of the potential occurrence
      const existingOccurrencesOnDay = getOccurrences(existingEvent, startOfDay(potOccStart), endOfDay(potOccStart));
      for (const exOcc of existingOccurrencesOnDay) {
        if (doEventsOverlap(potOccStart, potOccEnd, parseISO(exOcc.start), parseISO(exOcc.end))) {
          return {
            hasConflict: true,
            message: `Recurring event "${fullPotentialEvent.title}" (occurrence around ${formatDateFn(potOccStart, 'PPP p')}) conflicts with "${exOcc.title}" (instance on ${formatDateFn(parseISO(exOcc.start), 'PPP p')}).`
          };
        }
      }
    }
  }

  return { hasConflict: false };
};


export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [allStoredEvents, setAllStoredEvents] = useLocalStorage<Event[]>(LOCAL_STORAGE_KEY, []);
  const [currentDate, setCurrentDateState] = useState<Date>(startOfDay(new Date()));
  const [selectedDate, setSelectedDateState] = useState<Date | null>(null);
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading } = useAuth(); 

  const [isExtractingDetails, setIsExtractingDetails] = useState(false);
  const [isSuggestingAgenda, setIsSuggestingAgenda] = useState(false);
  const [isFindingAvailability, setIsFindingAvailability] = useState(false);

  const userEvents = useMemo(() => {
    if (isAuthLoading || !currentUser) return [];
    return allStoredEvents.filter(event => event.userId === currentUser.id);
  }, [allStoredEvents, currentUser, isAuthLoading]);

  const addEvent = useCallback(async (eventData: Omit<EventFormData, 'userId'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add events.", variant: "destructive" });
      return;
    }

    // Conflict check before adding
    const conflictCheckResult = checkForRecurringConflicts(
      eventData, // This is Omit<EventFormData, 'userId'> which matches the expected type
      userEvents,
      currentUser.id
    );

    if (conflictCheckResult.hasConflict) {
      toast({ title: "Scheduling Conflict", description: conflictCheckResult.message, variant: "destructive", duration: 7000 });
      return;
    }

    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      userId: currentUser.id, 
      start: eventData.start,
      end: eventData.end,
      recurrenceRule: eventData.recurrenceRule || { freq: 'NONE' },
    };
    setAllStoredEvents([...allStoredEvents, newEvent]);
    toast({ title: "Event Created", description: `"${newEvent.title}" has been added.` });
  }, [allStoredEvents, setAllStoredEvents, toast, currentUser, userEvents]);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Omit<EventFormData, 'userId'>>) => {
    if (!currentUser) return; 
    
    const originalEvent = allStoredEvents.find(event => event.id === eventId && event.userId === currentUser.id);
    if (!originalEvent) {
        toast({ title: "Error", description: "Event not found for update.", variant: "destructive" });
        return;
    }

    // Construct the full potential state of the event after update for conflict checking
    const updatedEventDetailsForCheck: Omit<Event, 'id' | 'userId'> & { id?: string } = {
        id: eventId, // Important to pass the ID for exclusion in checker
        title: eventData.title !== undefined ? eventData.title : originalEvent.title,
        start: eventData.start !== undefined ? eventData.start : originalEvent.start,
        end: eventData.end !== undefined ? eventData.end : originalEvent.end,
        description: eventData.description !== undefined ? eventData.description : originalEvent.description,
        color: eventData.color !== undefined ? eventData.color : originalEvent.color,
        recurrenceRule: eventData.recurrenceRule !== undefined ? eventData.recurrenceRule : originalEvent.recurrenceRule,
        aiSuggestedAgenda: eventData.aiSuggestedAgenda !== undefined ? eventData.aiSuggestedAgenda : originalEvent.aiSuggestedAgenda,
        aiExtractedLocations: eventData.aiExtractedLocations !== undefined ? eventData.aiExtractedLocations : originalEvent.aiExtractedLocations,
        aiExtractedAttendees: eventData.aiExtractedAttendees !== undefined ? eventData.aiExtractedAttendees : originalEvent.aiExtractedAttendees,
        aiSuggestedTimeslots: eventData.aiSuggestedTimeslots !== undefined ? eventData.aiSuggestedTimeslots : originalEvent.aiSuggestedTimeslots,
    };
    
    const conflictCheckResult = checkForRecurringConflicts(
        updatedEventDetailsForCheck,
        userEvents,
        currentUser.id,
        eventId // Exclude the event itself from conflict checking with its old self
    );

    if (conflictCheckResult.hasConflict) {
        toast({ title: "Scheduling Conflict", description: conflictCheckResult.message, variant: "destructive", duration: 7000 });
        return;
    }

    setAllStoredEvents(
      allStoredEvents.map((event) =>
        event.id === eventId && event.userId === currentUser.id 
        ? { ...event, ...eventData } 
        : event
      )
    );
    toast({ title: "Event Updated", description: `Event details have been saved.` });
  }, [allStoredEvents, setAllStoredEvents, toast, currentUser, userEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!currentUser) return;
    const eventToDelete = allStoredEvents.find(e => e.id === eventId && e.userId === currentUser.id);
    if (eventToDelete) {
      setAllStoredEvents(allStoredEvents.filter((event) => event.id !== eventId));
      toast({ title: "Event Deleted", description: `"${eventToDelete.title}" has been removed.`, variant: "destructive" });
    }
  }, [allStoredEvents, setAllStoredEvents, toast, currentUser]);

  const moveEvent = useCallback(async (eventId: string, newTargetDay: Date) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to move events.", variant: "destructive" });
      return;
    }
  
    const eventToMove = allStoredEvents.find(e => e.id === eventId && e.userId === currentUser.id);
    if (!eventToMove) {
      toast({ title: "Error", description: "Event not found.", variant: "destructive" });
      return;
    }
  
    const originalStartDateObj = parseISO(eventToMove.start);
    const originalEndDateObj = parseISO(eventToMove.end);
    const durationMs = originalEndDateObj.getTime() - originalStartDateObj.getTime();
  
    let newStartDateTime = startOfDay(newTargetDay);
    newStartDateTime = setHours(newStartDateTime, getHours(originalStartDateObj));
    newStartDateTime = setMinutes(newStartDateTime, getMinutes(originalStartDateObj));
    newStartDateTime = setSeconds(newStartDateTime, getSeconds(originalStartDateObj));
    newStartDateTime = setMilliseconds(newStartDateTime, getMilliseconds(originalStartDateObj));
    
    const newEndDateTime = new Date(newStartDateTime.getTime() + durationMs);
  
    const dayToCheckStart = startOfDay(newTargetDay);
    const dayToCheckEnd = endOfDay(newTargetDay);

    const potentialConflicts = userEvents.filter(e => {
      if (e.id === eventId) return false; 
  
      const occurrences = getOccurrences(e, dayToCheckStart, dayToCheckEnd);
      for (const occ of occurrences) {
        const occStart = parseISO(occ.start);
        const occEnd = parseISO(occ.end);
        if (doEventsOverlap(newStartDateTime, newEndDateTime, occStart, occEnd)) {
          return true; 
        }
      }
      return false;
    });
  
    if (potentialConflicts.length > 0) {
      const conflictingEventTitles = potentialConflicts.map(e => e.title).join(', ');
      toast({
        title: "Move Conflict",
        description: `"${eventToMove.title}" conflicts with: ${conflictingEventTitles}. Event not moved.`,
        variant: "destructive",
      });
      return;
    }
  
    setAllStoredEvents(
      allStoredEvents.map(e =>
        e.id === eventId
          ? { 
              ...e, 
              start: newStartDateTime.toISOString(), 
              end: newEndDateTime.toISOString(), 
              recurrenceRule: e.recurrenceRule?.freq !== 'NONE' ? {freq: 'NONE'} : {freq: 'NONE'} 
            }
          : e
      )
    );
    toast({ title: "Event Moved", description: `"${eventToMove.title}" has been moved. Recurrence was removed.` });
  
  }, [allStoredEvents, setAllStoredEvents, currentUser, userEvents, toast]);


  const getEventsForDate = useCallback((date: Date): Event[] => {
    // This function is less relevant now CalendarGrid directly uses filtered events
    // but kept for potential other uses or direct day queries.
    // It should also respect recurrence for the given single date.
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    return userEvents.reduce((acc, event) => {
      const occurrencesOnDate = getOccurrences(event, dayStart, dayEnd);
      return acc.concat(occurrencesOnDate);
    }, [] as Event[]);
  }, [userEvents]);

  const setCurrentDate = (date: Date) => setCurrentDateState(startOfDay(date));
  const setSelectedDate = (date: Date | null) => setSelectedDateState(date ? startOfDay(date) : null);

  const extractDetailsForDescription = async (description: string) => {
    setIsExtractingDetails(true);
    try {
      const result = await extractEventDetails({ description });
      toast({ title: "Details Extracted", description: "Locations and attendees identified." });
      return { locations: result.locations, attendees: result.attendees };
    } catch (error) {
      console.error("Error extracting event details:", error);
      toast({ title: "AI Error", description: "Could not extract details.", variant: "destructive" });
      return null;
    } finally {
      setIsExtractingDetails(false);
    }
  };

  const suggestAgendaForTitle = async (eventTitle: string) => {
    setIsSuggestingAgenda(true);
    try {
      const result = await suggestMeetingAgenda({ eventTitle });
      toast({ title: "Agenda Suggested", description: "An agenda has been generated." });
      return result.suggestedAgenda;
    } catch (error) {
      console.error("Error suggesting agenda:", error);
      toast({ title: "AI Error", description: "Could not suggest agenda.", variant: "destructive" });
      return null;
    } finally {
      setIsSuggestingAgenda(false);
    }
  };
  
  const findCommonTimeSlots = async (attendees: string[], eventTitle: string, eventDescription: string) => {
    setIsFindingAvailability(true);
    try {
      const result = await findCommonAvailability({ attendees, eventTitle, eventDescription });
      toast({ title: "Availability Checked", description: "Suggested time slots found." });
      return result.suggestedTimeSlots;
    } catch (error) {
      console.error("Error finding common availability:", error);
      toast({ title: "AI Error", description: "Could not find common availability.", variant: "destructive" });
      return null;
    } finally {
      setIsFindingAvailability(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events: userEvents, 
        allEventsCount: allStoredEvents.length,
        currentDate,
        selectedDate,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        setCurrentDate,
        setSelectedDate,
        getEventsForDate,
        isExtractingDetails,
        extractDetailsForDescription,
        isSuggestingAgenda,
        suggestAgendaForTitle,
        isFindingAvailability,
        findCommonTimeSlots,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
