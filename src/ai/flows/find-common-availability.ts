'use server';

/**
 * @fileOverview An AI agent to find common availability among meeting attendees.
 *
 * - findCommonAvailability - A function that finds the common availability for a meeting.
 * - FindCommonAvailabilityInput - The input type for the findCommonAvailability function.
 * - FindCommonAvailabilityOutput - The return type for the findCommonAvailability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindCommonAvailabilityInputSchema = z.object({
  attendees: z
    .array(z.string())
    .describe('A list of email addresses of the meeting attendees.'),
  eventTitle: z.string().describe('The title of the event or meeting.'),
  eventDescription: z.string().describe('The description of the event or meeting.'),
});
export type FindCommonAvailabilityInput = z.infer<
  typeof FindCommonAvailabilityInputSchema
>;

const FindCommonAvailabilityOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe(
      'A list of suggested time slots, taking into account the availability of all attendees.'
    ),
  summary: z
    .string()
    .describe(
      'A summary of the process of identifying the common availability, including any challenges or limitations.'
    ),
});
export type FindCommonAvailabilityOutput = z.infer<
  typeof FindCommonAvailabilityOutputSchema
>;

export async function findCommonAvailability(
  input: FindCommonAvailabilityInput
): Promise<FindCommonAvailabilityOutput> {
  return findCommonAvailabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findCommonAvailabilityPrompt',
  input: {schema: FindCommonAvailabilityInputSchema},
  output: {schema: FindCommonAvailabilityOutputSchema},
  prompt: `You are an AI assistant tasked with finding common availability for a meeting among a group of attendees.

  Given the following information, suggest a few possible time slots that would work for everyone. Consider that you have access to public or previously known user-defined free slots.

  Event Title: {{{eventTitle}}}
  Event Description: {{{eventDescription}}}
  Attendees: {{#each attendees}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Return the suggested time slots and a brief summary of your reasoning.
  `,
});

const findCommonAvailabilityFlow = ai.defineFlow(
  {
    name: 'findCommonAvailabilityFlow',
    inputSchema: FindCommonAvailabilityInputSchema,
    outputSchema: FindCommonAvailabilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
