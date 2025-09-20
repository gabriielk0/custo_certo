"use client";

import { useState } from "react";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ingredients as initialIngredients } from "@/lib/data";
import type { Ingredient } from "@/lib/types";

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.coerce.number().min(0, "Valor deve ser positivo"),
  packageSize: z.coerce.number().min(0, "Volume deve ser positivo"),
  unit: z.enum(["g", "kg", "ml", "l", "un"]),
});

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const form = useForm<z.infer<typeof ingredientSchema>>({
    resolver: zodResolver(ingredientSchema),
  });

  const onSubmit = (data: z.infer<typeof ingredientSchema>) => {
    const costPerUnit = data.price / data.packageSize;
    if (editingIngredient) {
      setIngredients(
        ingredients.map((i) =>
          i.id === editingIngredient.id ? { ...i, ...data, costPerUnit } : i
        )
      );
    } else {
      setIngredients([
        ...ingredients,
        { ...data, id: new Date().toISOString(), costPerUnit },
      ]);
    }
    setEditingIngredient(null);
    form.reset();
    setIsDialogOpen(false);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    form.reset(ingredient);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      form.reset();
      setEditingIngredient(null);
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
          <h1 className="text-3xl font-bold tracking-tight">Ingredientes Crus</h1>
          <p className="text-muted-foreground">
            Gerencie seu inventário de ingredientes crus.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingIngredient ? 'Editar' : 'Adicionar'} Ingrediente</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do ingrediente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" {...form.register("name")} className="col-span-3" />
                  {form.formState.errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Valor Pago</Label>
                  <Input id="price" type="number" step="0.01" {...form.register("price")} className="col-span-3" />
                   {form.formState.errors.price && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.price.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="packageSize" className="text-right">Volume</Label>
                  <Input id="packageSize" type="number" {...form.register("packageSize")} className="col-span-3" />
                  {form.formState.errors.packageSize && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.packageSize.message}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">Unidade</Label>
                  <Controller name="unit" control={form.control} render={({ field }) => (
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Grama (g)</SelectItem>
                          <SelectItem value="kg">Quilograma (kg)</SelectItem>
                          <SelectItem value="ml">Mililitro (ml)</SelectItem>
                          <SelectItem value="l">Litro (l)</SelectItem>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                   {form.formState.errors.unit && <p className="col-span-4 text-red-500 text-xs text-right">{form.formState.errors.unit.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ingredientes</CardTitle>
          <CardDescription>
            Todos os ingredientes crus cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Custo por Unidade</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-mono text-xs">{ingredient.id}</TableCell>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{formatCurrency(ingredient.price)}</TableCell>
                  <TableCell>{ingredient.packageSize}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{formatCurrency(ingredient.costPerUnit)}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleEdit(ingredient)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(ingredient.id)} className="text-red-600">
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
