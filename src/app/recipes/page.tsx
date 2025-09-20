"use client";

import { useState } from "react";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recipes as initialRecipes, ingredients as allIngredients } from "@/lib/data";
import type { Recipe } from "@/lib/types";

const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
});

const recipeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  yield: z.coerce.number().min(0, "Rendimento deve ser positivo"),
  grossWeight: z.coerce.number().min(0, "Peso bruto deve ser positivo"),
  unit: z.enum(["kg", "l", "un"]),
  ingredients: z.array(recipeIngredientSchema).min(1, "Adicione pelo menos um ingrediente"),
});

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const form = useForm<z.infer<typeof recipeSchema>>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      ingredients: [{ ingredientId: "", quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const onSubmit = (data: z.infer<typeof recipeSchema>) => {
    const totalCost = data.ingredients.reduce((acc, item) => {
      const ingredient = allIngredients.find(i => i.id === item.ingredientId);
      return acc + (ingredient ? ingredient.costPerUnit * item.quantity : 0);
    }, 0);

    if (editingRecipe) {
      setRecipes(
        recipes.map((r) =>
          r.id === editingRecipe.id ? { ...r, ...data, totalCost } : r
        )
      );
    } else {
      setRecipes([
        ...recipes,
        { ...data, id: `R${new Date().getTime()}`, totalCost },
      ]);
    }
    setEditingRecipe(null);
    form.reset({ name: '', yield: 0, grossWeight: 0, unit: 'kg', ingredients: [{ ingredientId: "", quantity: 0 }] });
    setIsDialogOpen(false);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    form.reset(recipe);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRecipes(recipes.filter((r) => r.id !== id));
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      form.reset({ name: '', yield: 0, grossWeight: 0, unit: 'kg', ingredients: [{ ingredientId: "", quantity: 0 }] });
      setEditingRecipe(null);
    }
    setIsDialogOpen(open);
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receitas & Produtos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie suas receitas e produtos (ingredientes preparados).
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingRecipe ? 'Editar' : 'Criar'} Receita</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da receita. O custo será calculado automaticamente.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Receita</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="yield">Fator de Rendimento</Label>
                    <Input id="yield" type="number" step="0.1" {...form.register("yield")} />
                     {form.formState.errors.yield && <p className="text-red-500 text-xs mt-1">{form.formState.errors.yield.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="grossWeight">Peso Total Bruto</Label>
                    <Input id="grossWeight" type="number" step="10" {...form.register("grossWeight")} />
                     {form.formState.errors.grossWeight && <p className="text-red-500 text-xs mt-1">{form.formState.errors.grossWeight.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade de Medida</Label>
                     <Controller name="unit" control={form.control} render={({ field }) => (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Quilograma (kg)</SelectItem>
                            <SelectItem value="l">Litro (l)</SelectItem>
                            <SelectItem value="un">Unidade (un)</SelectItem>
                          </SelectContent>
                        </Select>
                    )} />
                     {form.formState.errors.unit && <p className="text-red-500 text-xs mt-1">{form.formState.errors.unit.message}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Ingredientes da Receita</h3>
                   {fields.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-end mb-2">
                       <div className="flex-1">
                          <Label>Ingrediente Cru</Label>
                          <Controller name={`ingredients.${index}.ingredientId`} control={form.control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {allIngredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.id})</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )} />
                       </div>
                       <div className="w-32">
                          <Label>Qtd ({allIngredients.find(i => i.id === form.watch(`ingredients.${index}.ingredientId`))?.unit})</Label>
                          <Input type="number" {...form.register(`ingredients.${index}.quantity`)} />
                       </div>
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ ingredientId: "", quantity: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ingrediente
                  </Button>
                  {form.formState.errors.ingredients && <p className="text-red-500 text-xs mt-1">{form.formState.errors.ingredients.message || form.formState.errors.ingredients.root?.message}</p>}
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <Button type="submit">Salvar Receita</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas e Produtos Prontos</CardTitle>
          <CardDescription>
            Listagem de todos as suas receitas e produtos (ingredientes preparados).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Custo Total</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Peso Bruto</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-mono text-xs">{recipe.id}</TableCell>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>{formatCurrency(recipe.totalCost)}</TableCell>
                  <TableCell>{recipe.yield}</TableCell>
                  <TableCell>{recipe.grossWeight}</TableCell>
                  <TableCell>{recipe.unit}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleEdit(recipe)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(recipe.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
