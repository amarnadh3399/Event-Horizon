import { config } from 'dotenv';
config();

import '@/ai/flows/extract-event-details.ts';
import '@/ai/flows/suggest-meeting-agenda.ts';
import '@/ai/flows/find-common-availability.ts';