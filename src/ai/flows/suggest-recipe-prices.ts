'use server';

/**
 * @fileOverview An AI agent that suggests price ranges for recipes based on ingredient costs,
 * fixed expenses, and variable expenses over the last 3 months.
 *
 * - suggestRecipePrices - A function that suggests price ranges for recipes.
 * - SuggestRecipePricesInput - The input type for the suggestRecipePrices function.
 * - SuggestRecipePricesOutput - The return type for the suggestRecipePrices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipePricesInputSchema = z.object({
  ingredientCosts: z
    .number()
    .describe('Total cost of ingredients for the recipe.'),
  fixedExpensesLast3Months: z
    .number()
    .describe('Total fixed expenses (e.g., rent, utilities) over the last 3 months.'),
  variableExpensesLast3Months: z
    .number()
    .describe(
      'Total variable expenses (e.g., marketing, maintenance) over the last 3 months.'
    ),
  unitsSoldLast3Months: z
    .number()
    .describe('Number of units of the recipe sold in the last 3 months.'),
  desiredProfitMargin: z
    .number()
    .describe('The desired profit margin percentage (e.g., 0.2 for 20%).'),
});
export type SuggestRecipePricesInput = z.infer<typeof SuggestRecipePricesInputSchema>;

const SuggestRecipePricesOutputSchema = z.object({
  suggestedPriceRange: z
    .string()
    .describe(
      'A suggested price range for the recipe, considering ingredient costs, fixed and variable expenses, and desired profit margin.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of how the suggested price range was calculated, including the impact of each input factor.'
    ),
});
export type SuggestRecipePricesOutput = z.infer<typeof SuggestRecipePricesOutputSchema>;

export async function suggestRecipePrices(input: SuggestRecipePricesInput): Promise<SuggestRecipePricesOutput> {
  return suggestRecipePricesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipePricesPrompt',
  input: {schema: SuggestRecipePricesInputSchema},
  output: {schema: SuggestRecipePricesOutputSchema},
  prompt: `You are a financial advisor for a restaurant. Based on the costs of ingredients, fixed costs, variable costs, units sold, and desired profit margin, suggest a price range for a recipe.

Ingredient Costs: {{ingredientCosts}}
Fixed Expenses (Last 3 Months): {{fixedExpensesLast3Months}}
Variable Expenses (Last 3 Months): {{variableExpensesLast3Months}}
Units Sold (Last 3 Months): {{unitsSoldLast3Months}}
Desired Profit Margin: {{desiredProfitMargin}}

Consider all these factors carefully and provide a suggested price range and reasoning.`,
});

const suggestRecipePricesFlow = ai.defineFlow(
  {
    name: 'suggestRecipePricesFlow',
    inputSchema: SuggestRecipePricesInputSchema,
    outputSchema: SuggestRecipePricesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
