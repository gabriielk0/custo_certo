"use client";

import { useState, useEffect } from "react";
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
import { getRecipes, getIngredients, addRecipe, updateRecipe, deleteRecipe } from "@/lib/data";
import type { Receita, Ingrediente } from "@/lib/types";

const recipeIngredientSchema = z.object({
  ingrediente_id: z.string().min(1),
  quantidade: z.coerce.number().min(0.01),
});

const recipeSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  rendimento: z.coerce.number().min(0, "Rendimento deve ser positivo"),
  peso_bruto: z.coerce.number().min(0, "Peso bruto deve ser positivo"),
  unidade: z.enum(["kg", "l", "un"]),
  ingredientes: z.array(recipeIngredientSchema).min(1, "Adicione pelo menos um ingrediente"),
});

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Receita[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingrediente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Receita | null>(null);

  useEffect(() => {
    getRecipes().then(setRecipes);
    getIngredients().then(setAllIngredients);
  }, []);

  const form = useForm<z.infer<typeof recipeSchema>>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      ingredientes: [{ ingrediente_id: "", quantidade: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredientes",
  });

  const onSubmit = async (data: z.infer<typeof recipeSchema>) => {
    const custo_total = data.ingredientes.reduce((acc, item) => {
      const ingredient = allIngredients.find(i => i.id.toString() === item.ingrediente_id);
      return acc + (ingredient ? ingredient.valorunit * item.quantidade : 0);
    }, 0);

    const recipeData = { ...data, custo_total };

    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, recipeData as Omit<Receita, 'id'>);
    } else {
      await addRecipe(recipeData as Omit<Receita, 'id'>);
    }
    
    const updatedRecipes = await getRecipes();
    setRecipes(updatedRecipes);
    setEditingRecipe(null);
    form.reset({ nome: '', rendimento: 0, peso_bruto: 0, unidade: 'kg', ingredientes: [{ ingrediente_id: "", quantidade: 0 }] });
    setIsDialogOpen(false);
  };

  const handleEdit = (recipe: Receita) => {
    setEditingRecipe(recipe);
    form.reset(recipe);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteRecipe(id);
    const updatedRecipes = await getRecipes();
    setRecipes(updatedRecipes);
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      form.reset({ nome: '', rendimento: 0, peso_bruto: 0, unidade: 'kg', ingredientes: [{ ingrediente_id: "", quantidade: 0 }] });
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
                    <Label htmlFor="nome">Nome da Receita</Label>
                    <Input id="nome" {...form.register("nome")} />
                    {form.formState.errors.nome && <p className="text-red-500 text-xs mt-1">{form.formState.errors.nome.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rendimento">Fator de Rendimento</Label>
                    <Input id="rendimento" type="number" step="0.1" {...form.register("rendimento")} />
                     {form.formState.errors.rendimento && <p className="text-red-500 text-xs mt-1">{form.formState.errors.rendimento.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="peso_bruto">Peso Total Bruto</Label>
                    <Input id="peso_bruto" type="number" step="10" {...form.register("peso_bruto")} />
                     {form.formState.errors.peso_bruto && <p className="text-red-500 text-xs mt-1">{form.formState.errors.peso_bruto.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="unidade">Unidade de Medida</Label>
                     <Controller name="unidade" control={form.control} render={({ field }) => (
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
                     {form.formState.errors.unidade && <p className="text-red-500 text-xs mt-1">{form.formState.errors.unidade.message}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Ingredientes da Receita</h3>
                   {fields.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-end mb-2">
                       <div className="flex-1">
                          <Label>Ingrediente Cru</Label>
                          <Controller name={`ingredientes.${index}.ingrediente_id`} control={form.control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {allIngredients.map(ing => <SelectItem key={ing.id} value={ing.id.toString()}>{ing.nome} ({ing.id})</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )} />
                       </div>
                       <div className="w-32">
                          <Label>Qtd ({allIngredients.find(i => i.id.toString() === form.watch(`ingredientes.${index}.ingrediente_id`))?.unit})</Label>
                          <Input type="number" {...form.register(`ingredientes.${index}.quantidade`)} />
                       </div>
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ ingrediente_id: "", quantidade: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ingrediente
                  </Button>
                  {form.formState.errors.ingredientes && <p className="text-red-500 text-xs mt-1">{form.formState.errors.ingredientes.message || form.formState.errors.ingredientes.root?.message}</p>}
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
                  <TableCell className="font-medium">{recipe.nome}</TableCell>
                  <TableCell>{formatCurrency(recipe.custo_total)}</TableCell>
                  <TableCell>{recipe.rendimento}</TableCell>
                  <TableCell>{recipe.peso_bruto}</TableCell>
                  <TableCell>{recipe.unidade}</TableCell>
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
