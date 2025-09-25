'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  sugerirPrecosReceita,
  type EntradaSugerirPrecosReceita,
  type SaidaSugerirPrecosReceita,
} from '@/ai/flows/suggest-recipe-prices';

const pricingSchema = z.object({
  ingredientCosts: z.coerce.number().min(0, 'Custo deve ser positivo'),
  fixedExpensesLast3Months: z.coerce
    .number()
    .min(0, 'Despesa deve ser positiva'),
  variableExpensesLast3Months: z.coerce
    .number()
    .min(0, 'Despesa deve ser positiva'),
  unitsSoldLast3Months: z.coerce
    .number()
    .int()
    .min(0, 'Unidades deve ser um número inteiro positivo'),
  desiredProfitMargin: z.number().min(0).max(1),
});

export function FormularioPrecos() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SaidaSugerirPrecosReceita | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      ingredientCosts: 10,
      fixedExpensesLast3Months: 9000,
      variableExpensesLast3Months: 2400,
      unitsSoldLast3Months: 500,
      desiredProfitMargin: 0.2,
    },
  });

  const profitMargin = form.watch('desiredProfitMargin');

  const onSubmit = async (data: EntradaSugerirPrecosReceita) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await sugerirPrecosReceita(data);
      setResult(response);
    } catch (e) {
      setError('Ocorreu um erro ao consultar a IA. Tente novamente.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Analisar Preço de Receita</CardTitle>
          <CardDescription>
            Preencha os dados para receber uma sugestão de preço com base em IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="ingredientCosts">
                Custo de Ingredientes por Unidade (R$)
              </Label>
              <Input
                id="ingredientCosts"
                type="number"
                step="0.01"
                {...form.register('ingredientCosts')}
              />
              {form.formState.errors.ingredientCosts && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.ingredientCosts.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="fixedExpensesLast3Months">
                Despesas Fixas Totais (Últimos 3 meses)
              </Label>
              <Input
                id="fixedExpensesLast3Months"
                type="number"
                {...form.register('fixedExpensesLast3Months')}
              />
              {form.formState.errors.fixedExpensesLast3Months && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.fixedExpensesLast3Months.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="variableExpensesLast3Months">
                Despesas Variáveis Totais (Últimos 3 meses)
              </Label>
              <Input
                id="variableExpensesLast3Months"
                type="number"
                {...form.register('variableExpensesLast3Months')}
              />
              {form.formState.errors.variableExpensesLast3Months && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.variableExpensesLast3Months.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="unitsSoldLast3Months">
                Unidades Vendidas (Últimos 3 meses)
              </Label>
              <Input
                id="unitsSoldLast3Months"
                type="number"
                {...form.register('unitsSoldLast3Months')}
              />
              {form.formState.errors.unitsSoldLast3Months && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.unitsSoldLast3Months.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="desiredProfitMargin">
                Margem de Lucro Desejada: {(profitMargin * 100).toFixed(0)}%
              </Label>
              <Controller
                name="desiredProfitMargin"
                control={form.control}
                render={({ field }) => (
                  <Slider
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    max={1}
                    step={0.01}
                    className="my-4"
                  />
                )}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Analisar Preço
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Sugestão da IA</CardTitle>
          <CardDescription>
            Aqui está a sugestão de preço e a análise.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analisando dados...</p>
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {result ? (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="font-semibold text-lg">
                  Faixa de Preço Sugerida
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {result.suggestedPriceRange}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Análise</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {result.reasoning}
                </p>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4" />
                <p>A sugestão da IA aparecerá aqui.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
