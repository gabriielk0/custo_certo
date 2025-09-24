'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import type { Prato, Receita, Ingrediente } from '@/lib/types';

/* Schemas (sem alterações) */
const dishItemSchema = z.object({
  item_id: z.coerce.number().min(1, 'Selecione um item'),
  tipo_item: z.enum(['ingredient', 'recipe']),
  quantidade: z.coerce.number().min(0.01),
});

const dishSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco_venda: z.coerce.number().min(0, 'Preço deve ser positivo'),
  itens: z.array(dishItemSchema).min(1, 'Adicione pelo menos um item'),
});

/* Client-side fetch helpers (substituem import de funções server) */
async function fetchDishes(): Promise<Prato[]> {
  const res = await fetch('/api/dishes');
  if (!res.ok) throw new Error('Falha ao buscar pratos');
  return res.json();
}

async function fetchIngredientsAndRecipes(): Promise<{
  ingredients: Ingrediente[];
  recipes: Receita[];
}> {
  // busca separada para ser mais compatível com APIs comuns
  const [rIng, rRec] = await Promise.all([
    fetch('/api/ingredients'),
    fetch('/api/recipes'),
  ]);
  if (!rIng.ok || !rRec.ok)
    throw new Error('Falha ao buscar ingredientes ou receitas');
  const ingredients = await rIng.json();
  const recipes = await rRec.json();
  return { ingredients, recipes };
}

async function createDishApi(dish: Omit<Prato, 'id'>) {
  const res = await fetch('/api/dishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dish),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // tenta extrair mensagem de erro retornada pela API
    const msg =
      (body &&
        (body.message || (body.errors ? JSON.stringify(body.errors) : null))) ||
      `Erro ao criar prato (status ${res.status})`;
    throw new Error(msg);
  }

  return body;
}

async function updateDishApi(id: number, dish: Omit<Prato, 'id'>) {
  const res = await fetch(`/api/dishes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dish),
  });
  if (!res.ok) throw new Error('Falha ao atualizar prato');
  return res.json();
}

async function deleteDishApi(id: number) {
  const res = await fetch(`/api/dishes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao deletar prato');
  return true;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Prato[]>([]);
  const [allItems, setAllItems] = useState<(Ingrediente | Receita)[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingrediente[]>([]);
  const [allRecipes, setAllRecipes] = useState<Receita[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Prato | null>(null);
  const [selectedDish, setSelectedDish] = useState<Prato | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dishesData, itemsData] = await Promise.all([
          fetchDishes(),
          fetchIngredientsAndRecipes(),
        ]);
        setDishes(dishesData);
        setAllIngredients(itemsData.ingredients);
        setAllRecipes(itemsData.recipes);
        setAllItems([...itemsData.ingredients, ...itemsData.recipes]);
      } catch (err) {
        console.warn('Erro ao carregar dados de pratos:', err);
        setDishes([]);
        setAllIngredients([]);
        setAllRecipes([]);
        setAllItems([]);
      }
    }
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof dishSchema>>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      itens: [{ item_id: 0, tipo_item: 'recipe', quantidade: 0 }],
      preco_venda: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const watchedItems = form.watch('itens');
  const watchedSellingPrice = form.watch('preco_venda');

  const custo_total = watchedItems.reduce((acc, item) => {
    if (!item.item_id || !item.quantidade) return acc;
    const selectedItem = allItems.find(
      (i) =>
        (i as any).id === item.item_id &&
        ('valorunit' in i ? 'ingredient' : 'recipe') === item.tipo_item,
    );
    if (!selectedItem) return acc;

    let itemCostPerUnit = 0;
    if ('valorunit' in selectedItem) {
      // It's an Ingredient
      itemCostPerUnit = (selectedItem as Ingrediente).valorunit ?? 0;
    } else {
      // It's a Recipe
      const rec = selectedItem as Receita;
      itemCostPerUnit =
        rec.rendimento > 0 ? (rec.custo_total ?? 0) / rec.rendimento : 0;
    }

    return acc + itemCostPerUnit * (item.quantidade ?? 0);
  }, 0);

  const profitMargin =
    watchedSellingPrice > 0
      ? (watchedSellingPrice - custo_total) / watchedSellingPrice
      : 0;

  const handleMarginChange = (margin: number) => {
    if (custo_total > 0) {
      const newPrice = custo_total / (1 - margin);
      form.setValue('preco_venda', parseFloat(newPrice.toFixed(2)));
    }
  };

  const onSubmit = async (data: z.infer<typeof dishSchema>) => {
    const dishData = { ...data, custo_total };

    try {
      if (editingDish && editingDish.id) {
        await updateDishApi(editingDish.id, dishData as Omit<Prato, 'id'>);
      } else {
        await createDishApi(dishData as Omit<Prato, 'id'>);
      }
      const updatedDishes = await fetchDishes();
      setDishes(updatedDishes);
      setEditingDish(null);
      form.reset({
        nome: '',
        preco_venda: 0,
        itens: [{ item_id: 0, tipo_item: 'recipe', quantidade: 0 }],
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Erro ao salvar prato:', err);
      // aqui você pode mostrar toast / mensagem de erro
    }
  };

  const handleEdit = (dish: Prato) => {
    setEditingDish(dish);
    // form.reset espera valores no mesmo shape do schema; garante que itens sejam strings
    form.reset({
      id: dish.id,
      nome: dish.nome,
      preco_venda: dish.preco_venda,
      itens: (dish.itens || []).map((it) => ({ ...it, item_id: it.item_id })),
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDishApi(id);
      const updatedDishes = await fetchDishes();
      setDishes(updatedDishes);
    } catch (err) {
      console.error('Erro ao deletar prato:', err);
    }
  };

  const handleOpenForm = (open: boolean) => {
    if (!open) {
      form.reset({
        nome: '',
        preco_venda: 0,
        itens: [{ item_id: 0, tipo_item: 'recipe', quantidade: 0 }],
      });
      setEditingDish(null);
    }
    setIsFormOpen(open);
  };

  const handleSelectDish = (dish: Prato) => {
    setSelectedDish(dish);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatPercent = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
    });
  };

  const AnalysisPanel = ({ dish }: { dish: Prato }) => {
    if (!dish) return null;
    const initialMargin =
      dish.preco_venda > 0
        ? (dish.preco_venda - dish.custo_total) / dish.preco_venda
        : 0.3;
    const [desiredMargin, setDesiredMargin] = useState(
      initialMargin > 0 ? initialMargin : 0.3,
    );

    const actualProfit = dish.preco_venda - dish.custo_total;
    const actualProfitMargin =
      dish.preco_venda > 0 ? actualProfit / dish.preco_venda : 0;

    const suggestedPrice = dish.custo_total / (1 - desiredMargin);
    const suggestedProfit = suggestedPrice - dish.custo_total;

    return (
      <div className="flex flex-col h-full">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Análise do Prato: {dish.nome}</SheetTitle>
          <SheetDescription>
            Análise de custos, lucros e sugestão de preço.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Análise de Preço Praticado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Preço de Venda (Praticado)
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(dish.preco_venda)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Custo Total dos Insumos
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(dish.custo_total)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Lucro Bruto (Praticado)
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      actualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(actualProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Margem de Lucro (Praticada)
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      actualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(actualProfitMargin)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Simulador de Preço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Margem de Lucro Bruta Desejada</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={(desiredMargin * 100).toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setDesiredMargin(value / 100);
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value)) {
                          setDesiredMargin(0);
                        } else {
                          setDesiredMargin(
                            Math.max(0, Math.min(100, value)) / 100,
                          );
                        }
                      }}
                      className="w-24"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <Slider
                    value={[desiredMargin]}
                    onValueChange={(values) => setDesiredMargin(values[0])}
                    max={1}
                    step={0.01}
                    className="my-4"
                  />
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Preço de Venda Sugerido
                  </span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(suggestedPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Lucro Bruto Previsto
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      suggestedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(suggestedProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => setSelectedDish(null)}>
            Fechar
          </Button>
        </SheetFooter>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pratos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie os pratos para venda.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleOpenForm}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Novo Prato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingDish ? 'Editar' : 'Criar'} Prato
                </DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do prato. O custo será calculado
                  automaticamente.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <Label htmlFor="nome">Nome do Prato</Label>
                    <Input id="nome" {...form.register('nome')} />
                    {form.formState.errors.nome && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.formState.errors.nome.message}
                      </p>
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
                    <Input
                      id="preco_venda"
                      type="number"
                      step="0.01"
                      {...form.register('preco_venda')}
                    />
                    {form.formState.errors.preco_venda && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.formState.errors.preco_venda.message}
                      </p>
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <Label>Margem de Lucro Bruta (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(profitMargin * 100).toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          handleMarginChange(value / 100);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Itens do Prato</h3>
                    <div className="text-sm">
                      Custo Total:{' '}
                      <span className="font-bold">
                        {formatCurrency(custo_total)}
                      </span>
                    </div>
                  </div>
                  {fields.map((item, index) => {
                    const selectedItem = allItems.find(
                      (i) =>
                        (i as any).id == watchedItems[index]?.item_id &&
                        ('valorunit' in i ? 'ingredient' : 'recipe') ===
                          watchedItems[index]?.tipo_item,
                    );
                    let itemCostPerUnit = 0;
                    if (selectedItem) {
                      if ('valorunit' in selectedItem) {
                        // Ingredient
                        itemCostPerUnit =
                          (selectedItem as Ingrediente).valorunit ?? 0;
                      } else {
                        // Recipe
                        const rec = selectedItem as Receita;
                        itemCostPerUnit =
                          rec.rendimento > 0
                            ? (rec.custo_total ?? 0) / rec.rendimento
                            : 0;
                      }
                    }
                    const itemTotalCost =
                      itemCostPerUnit * (watchedItems[index]?.quantidade || 0);

                    return (
                      <div key={item.id} className="flex gap-2 items-end mb-2">
                        <div className="flex-1">
                          <Label>Item (Ingrediente ou Receita)</Label>
                          <Controller
                            // Usamos um nome de campo "virtual" para o Controller
                            name={`itens.${index}.composite_id` as any}
                            control={form.control}
                            render={({ field }) => {
                              // Recria o valor composto a partir dos valores reais do formulário para exibição
                              const itemId = form.watch(
                                `itens.${index}.item_id`,
                              );
                              const itemType = form.watch(
                                `itens.${index}.tipo_item`,
                              );
                              const currentValue =
                                itemId && itemType
                                  ? `${itemId}|${itemType}`
                                  : '';

                              return (
                                <Select
                                  value={currentValue}
                                  onValueChange={(value) => {
                                    const [id, type] = value.split('|');
                                    const numericId = Number(id);
                                    form.setValue(
                                      `itens.${index}.item_id`,
                                      numericId,
                                    );
                                    form.setValue(
                                      `itens.${index}.tipo_item`,
                                      type as 'ingredient' | 'recipe',
                                    );
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allIngredients.map((ing) => (
                                      <SelectItem
                                        key={`ing-${ing.id}`}
                                        value={`${ing.id}|ingredient`}
                                      >
                                        {ing.nome} (Ingrediente Cru)
                                      </SelectItem>
                                    ))}
                                    {allRecipes.map((rec) => (
                                      <SelectItem
                                        key={`rec-${rec.id}`}
                                        value={`${rec.id}|recipe`}
                                      >
                                        {rec.nome} (Receita)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            }}
                          />
                        </div>
                        <div className="w-24">
                          <Label>Qtd (g/ml)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            {...form.register(
                              `itens.${index}.quantidade` as const,
                            )}
                          />
                        </div>
                        <div className="w-28">
                          <Label>Custo do Item</Label>
                          <Input
                            type="text"
                            readOnly
                            disabled
                            value={formatCurrency(itemTotalCost)}
                            className="bg-muted"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ item_id: 0, tipo_item: 'recipe', quantidade: 0 })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                  </Button>
                  {form.formState.errors.itens && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.itens.message ||
                        (form.formState.errors.itens as any)?.root?.message}
                    </p>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <Button type="submit">Salvar Prato</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pratos para Venda</CardTitle>
          <CardDescription>
            Seus pratos prontos para venda. Clique no ícone de olho para ver a
            análise de preço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Prato</TableHead>
                <TableHead>Custo Total</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Lucro Bruto</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => {
                const profit = dish.preco_venda - dish.custo_total;
                return (
                  <TableRow key={dish.id}>
                    <TableCell className="font-mono text-xs">
                      {dish.id}
                    </TableCell>
                    <TableCell className="font-medium">{dish.nome}</TableCell>
                    <TableCell>{formatCurrency(dish.custo_total)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(dish.preco_venda)}
                    </TableCell>
                    <TableCell
                      className={
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSelectDish(dish)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Analisar prato</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleEdit(dish);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleDelete(dish.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedDish}
        onOpenChange={(open) => {
          if (!open) setSelectedDish(null);
        }}
      >
        <SheetContent className="sm:max-w-lg p-0">
          {selectedDish && <AnalysisPanel dish={selectedDish} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
