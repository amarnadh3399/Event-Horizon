// src/ai/flows/extract-event-details.ts
'use server';

/**
 * @fileOverview Extracts event details (dates, locations, attendees) from an event description using AI.
 *
 * - extractEventDetails - A function that extracts event details from a text description.
 * - ExtractEventDetailsInput - The input type for the extractEventDetails function.
 * - ExtractEventDetailsOutput - The return type for the extractEventDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractEventDetailsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the event from which to extract details.'),
});

export type ExtractEventDetailsInput = z.infer<typeof ExtractEventDetailsInputSchema>;

const ExtractEventDetailsOutputSchema = z.object({
  dates: z.array(z.string()).describe('The dates mentioned in the description.'),
  locations: z.array(z.string()).describe('The locations mentioned in the description.'),
  attendees: z.array(z.string()).describe('The attendees mentioned in the description.'),
  agendaSuggestions: z.array(z.string()).describe('Suggested agenda items based on the event title and description.'),
});

export type ExtractEventDetailsOutput = z.infer<typeof ExtractEventDetailsOutputSchema>;

export async function extractEventDetails(input: ExtractEventDetailsInput): Promise<ExtractEventDetailsOutput> {
  return extractEventDetailsFlow(input);
}

const extractEventDetailsPrompt = ai.definePrompt({
  name: 'extractEventDetailsPrompt',
  input: {schema: ExtractEventDetailsInputSchema},
  output: {schema: ExtractEventDetailsOutputSchema},
  prompt: `You are an AI assistant tasked with extracting key details from event descriptions.

  Given the following event description, please extract:
  - Dates: All dates mentioned in the description.
  - Locations: All locations mentioned in the description.
  - Attendees: All attendees mentioned in the description.
  - Agenda Suggestions: Suggest a few agenda items for the event. Only suggest these agenda items if the event is a meeting or conference.

  Description: {{{description}}}
  \n
  Return the extracted information in JSON format.
  `,
});

const extractEventDetailsFlow = ai.defineFlow(
  {
    name: 'extractEventDetailsFlow',
    inputSchema: ExtractEventDetailsInputSchema,
    outputSchema: ExtractEventDetailsOutputSchema,
  },
  async input => {
    const {output} = await extractEventDetailsPrompt(input);
    return output!;
  }
);
