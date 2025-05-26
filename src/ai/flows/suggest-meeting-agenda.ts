// src/ai/flows/suggest-meeting-agenda.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow that suggests a meeting agenda based on the event title.
 *
 * - suggestMeetingAgenda - A function that uses AI to suggest a meeting agenda based on the event title.
 * - SuggestMeetingAgendaInput - The input type for the suggestMeetingAgenda function.
 * - SuggestMeetingAgendaOutput - The return type for the suggestMeetingAgenda function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMeetingAgendaInputSchema = z.object({
  eventTitle: z.string().describe('The title of the event, used to infer the meeting topic.'),
});
export type SuggestMeetingAgendaInput = z.infer<typeof SuggestMeetingAgendaInputSchema>;

const SuggestMeetingAgendaOutputSchema = z.object({
  suggestedAgenda: z.string().describe('A suggested agenda for the meeting.'),
});
export type SuggestMeetingAgendaOutput = z.infer<typeof SuggestMeetingAgendaOutputSchema>;

export async function suggestMeetingAgenda(input: SuggestMeetingAgendaInput): Promise<SuggestMeetingAgendaOutput> {
  return suggestMeetingAgendaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMeetingAgendaPrompt',
  input: {schema: SuggestMeetingAgendaInputSchema},
  output: {schema: SuggestMeetingAgendaOutputSchema},
  prompt: `You are an AI assistant designed to suggest meeting agendas based on the meeting title.

  Given the meeting title: {{{eventTitle}}},
  please suggest a detailed meeting agenda.
  The suggested agenda should be formatted as a list with a few bullet points.`,
});

const suggestMeetingAgendaFlow = ai.defineFlow(
  {
    name: 'suggestMeetingAgendaFlow',
    inputSchema: SuggestMeetingAgendaInputSchema,
    outputSchema: SuggestMeetingAgendaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
