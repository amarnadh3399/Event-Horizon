
// src/components/EventForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Event, EventFormData, RecurrenceRule } from '@/lib/types';
import { EVENT_COLORS } from '@/lib/types';
import { useEvents } from '@/contexts/EventsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DateTimeInput from './DateTimeInput';
import RecurrenceEditor from './RecurrenceEditor';
import { Wand2, Lightbulb, Users, MapPin, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// EventFormData schema doesn't include userId as it's handled by the context
// originalId is implicitly part of EventFormData via Omit<Event, ...> but not directly validated here.
const eventFormSchema = z.object({
  id: z.string().optional(), // This will be the occurrence ID if editing an occurrence
  title: z.string().min(1, "Title is required"),
  start: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid start date/time"),
  end: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid end date/time"),
  description: z.string().optional(),
  color: z.string().optional(),
  recurrenceRule: z.custom<RecurrenceRule>().optional(),
  // AI related fields (display only, not part of main form submission directly)
  aiSuggestedAgenda: z.string().optional(),
  aiExtractedLocations: z.array(z.string()).optional(),
  aiExtractedAttendees: z.array(z.string()).optional(),
  aiSuggestedTimeslots: z.array(z.string()).optional(),
}).refine(data => parseISO(data.start) < parseISO(data.end), {
  message: "End date/time must be after start date/time",
  path: ["end"],
});


interface EventFormProps {
  event?: Event; // For editing. If it's an occurrence, it will have an 'originalId'.
  selectedDate?: Date | null; // For pre-filling date on new event
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, selectedDate, onClose }) => {
  const { 
    addEvent, 
    updateEvent, 
    deleteEvent,
    isExtractingDetails,
    extractDetailsForDescription,
    isSuggestingAgenda,
    suggestAgendaForTitle,
    isFindingAvailability,
    findCommonTimeSlots,
  } = useEvents();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const defaultStartTime = useMemo(() => {
    const date = selectedDate || (event ? parseISO(event.start) : new Date());
    date.setHours(9,0,0,0);
    return date.toISOString();
  }, [selectedDate, event]);

  const defaultEndTime = useMemo(() => {
     const date = selectedDate || (event ? parseISO(event.end) : new Date());
     date.setHours(10,0,0,0);
     return date.toISOString();
  }, [selectedDate, event]);

  const { control, handleSubmit, register, watch, setValue, formState: { errors, isSubmitting } } = useForm<Omit<EventFormData, 'userId'>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      id: event?.id,
      title: event?.title || 'Sample Event Title',
      start: event?.start || defaultStartTime,
      end: event?.end || defaultEndTime,
      description: event?.description || 'This is a sample description for the event. You can edit it.',
      color: event?.color || EVENT_COLORS[0].value,
      recurrenceRule: event?.recurrenceRule || { freq: 'NONE' },
      aiSuggestedAgenda: event?.aiSuggestedAgenda || '',
      aiExtractedLocations: event?.aiExtractedLocations || [],
      aiExtractedAttendees: event?.aiExtractedAttendees || [],
      aiSuggestedTimeslots: event?.aiSuggestedTimeslots || [],
    },
  });

  const watchedDescription = watch('description');
  const watchedTitle = watch('title');
  const watchedAttendees = watch('aiExtractedAttendees');

  const onSubmit = async (data: Omit<EventFormData, 'userId'>) => {
    if (event) { // If 'event' exists, we are editing
      const baseEventIdToUpdate = event.originalId || event.id; 
      if (!baseEventIdToUpdate) {
        console.error("Cannot update event without a valid ID.");
        onClose();
        return;
      }
      await updateEvent(baseEventIdToUpdate, data);
    } else {
      await addEvent(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (event) {
      const idToDelete = event.originalId || event.id; 
       if (!idToDelete) {
        console.error("Cannot delete event without a valid ID.");
        onClose();
        setShowDeleteConfirm(false);
        return;
      }
      await deleteEvent(idToDelete);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const handleExtractDetails = async () => {
    if (!watchedDescription) return;
    const result = await extractDetailsForDescription(watchedDescription);
    if (result) {
      setValue('aiExtractedLocations', result.locations);
      setValue('aiExtractedAttendees', result.attendees);
    }
  };

  const handleSuggestAgenda = async () => {
    if (!watchedTitle) return;
    const result = await suggestAgendaForTitle(watchedTitle);
    if (result) {
      setValue('aiSuggestedAgenda', result);
    }
  };

  const handleFindAvailability = async () => {
    if (!watchedAttendees || watchedAttendees.length === 0 || !watchedTitle) return;
    const result = await findCommonTimeSlots(watchedAttendees, watchedTitle, watchedDescription || '');
    if (result) {
      setValue('aiSuggestedTimeslots', result);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ScrollArea className="h-[calc(80vh-180px)] pr-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" {...register('title')} aria-invalid={errors.title ? "true" : "false"} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="start"
              control={control}
              render={({ field }) => (
                <DateTimeInput id="start" label="Start Date & Time" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name="end"
              control={control}
              render={({ field }) => (
                <DateTimeInput id="end" label="End Date & Time" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          {errors.end && <p className="text-sm text-destructive -mt-3">{errors.end.message}</p>}
          {errors.start && <p className="text-sm text-destructive -mt-3">{errors.start.message}</p>}


          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <div>
            <Label htmlFor="color">Event Color</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_COLORS.map(ec => (
                      <SelectItem key={ec.value} value={ec.value}>
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: ec.value }} />
                          {ec.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <Controller
            name="recurrenceRule"
            control={control}
            render={({ field }) => (
              <RecurrenceEditor value={field.value || { freq: 'NONE' }} onChange={field.onChange} />
            )}
          />
          
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium flex items-center gap-2"><Wand2 size={18} /> AI Event Assist</h4>
            
            <Button type="button" variant="outline" size="sm" onClick={handleExtractDetails} disabled={isExtractingDetails || !watchedDescription}>
              {isExtractingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Extract Attendees/Locations
            </Button>
            {watch('aiExtractedAttendees')?.length > 0 && (
              <div className="text-sm space-y-1">
                <p><strong>Attendees:</strong> {watch('aiExtractedAttendees')?.join(', ')}</p>
                <p><strong>Locations:</strong> {watch('aiExtractedLocations')?.join(', ')}</p>
              </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={handleSuggestAgenda} disabled={isSuggestingAgenda || !watchedTitle}>
              {isSuggestingAgenda ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Suggest Meeting Agenda
            </Button>
            {watch('aiSuggestedAgenda') && (
              <div className="text-sm p-2 border rounded bg-background whitespace-pre-wrap">
                <strong>Suggested Agenda:</strong><br />
                {watch('aiSuggestedAgenda')}
              </div>
            )}
            
            <Button type="button" variant="outline" size="sm" onClick={handleFindAvailability} disabled={isFindingAvailability || !watchedAttendees || watchedAttendees.length === 0}>
              {isFindingAvailability ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Find Common Availability
            </Button>
            {watch('aiSuggestedTimeslots')?.length > 0 && (
              <div className="text-sm space-y-1">
                <p><strong>Suggested Times:</strong> {watch('aiSuggestedTimeslots')?.join('; ')}</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {event && (
            <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Delete Event
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isExtractingDetails || isSuggestingAgenda || isFindingAvailability}>
            {(isSubmitting || isExtractingDetails || isSuggestingAgenda || isFindingAvailability) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {event ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event titled "{event?.title}".
              If this is a recurring event, all occurrences will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default EventForm;

