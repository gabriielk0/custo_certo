import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ia = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
