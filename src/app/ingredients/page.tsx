'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Ingrediente } from '@/lib/types';

const ingredientSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco: z.coerce.number().min(0, 'Valor deve ser positivo'),
  tam_pacote: z.coerce.number().min(0, 'Volume deve ser positivo'),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'un']),
});

/* Client-side fetch helpers */
async function fetchIngredients(): Promise<Ingrediente[]> {
  const res = await fetch('/api/ingredients');
  if (!res.ok) throw new Error('Falha ao buscar ingredientes');
  return res.json();
}

async function createIngredientApi(
  ingredient: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  const res = await fetch('/api/ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient),
  });
  if (!res.ok) throw new Error('Falha ao criar ingrediente');
  return res.json();
}

async function updateIngredientApi(
  id: string | number,
  ingredient: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  const res = await fetch(`/api/ingredients/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient),
  });
  if (!res.ok) throw new Error('Falha ao atualizar ingrediente');
  return res.json();
}

async function deleteIngredientApi(id: string | number) {
  const res = await fetch(`/api/ingredients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao deletar ingrediente');
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingrediente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<Ingrediente | null>(null);

  const form = useForm<z.infer<typeof ingredientSchema>>({
    resolver: zodResolver(ingredientSchema),
  });

  useEffect(() => {
    async function loadIngredients() {
      try {
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (err) {
        console.warn('Não foi possível carregar ingredientes:', err);
        setIngredients([]);
      }
    }
    loadIngredients();
  }, []);

  const onSubmit = async (data: z.infer<typeof ingredientSchema>) => {
    try {
      if (editingIngredient && editingIngredient.id) {
        await updateIngredientApi(editingIngredient.id, data);
      } else {
        await createIngredientApi(data);
      }
      // Re-fetch ingredients to update the list
      const updatedIngredients = await fetchIngredients();
      setIngredients(updatedIngredients);

      // Reset form and state
      setEditingIngredient(null);
      form.reset({
        nome: '',
        preco: 0,
        tam_pacote: 0,
        unit: 'g',
      });
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Erro ao salvar ingrediente:', err);
      // Aqui você pode adicionar um toast ou mensagem de erro para o usuário
    }
  };

  const handleEdit = (ingredient: Ingrediente) => {
    setEditingIngredient(ingredient);
    form.reset({
      id: ingredient.id,
      nome: ingredient.nome as any,
      preco: (ingredient.preco as unknown as number) ?? 0,
      tam_pacote: (ingredient.tam_pacote as unknown as number) ?? 1,
      unit: (ingredient.unit as any) ?? 'g',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Tem certeza que deseja deletar este ingrediente?')) return;
    try {
      await deleteIngredientApi(id);
      setIngredients((prev) => prev.filter((i) => String(i.id) !== String(id)));
    } catch (err) {
      console.error('Erro ao deletar ingrediente:', err);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingIngredient(null);
    }
    setIsDialogOpen(open);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ingredientes Crus
          </h1>
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
                <DialogTitle>
                  {editingIngredient ? 'Editar' : 'Adicionar'} Ingrediente
                </DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do ingrediente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    {...form.register('nome')}
                    className="col-span-3"
                  />
                  {form.formState.errors.nome && (
                    <p className="col-span-4 text-red-500 text-xs text-right">
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="preco" className="text-right">
                    Valor Pago
                  </Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    {...form.register('preco')}
                    className="col-span-3"
                  />
                  {form.formState.errors.preco && (
                    <p className="col-span-4 text-red-500 text-xs text-right">
                      {form.formState.errors.preco.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tam_pacote" className="text-right">
                    Volume
                  </Label>
                  <Input
                    id="tam_pacote"
                    type="number"
                    {...form.register('tam_pacote')}
                    className="col-span-3"
                  />
                  {form.formState.errors.tam_pacote && (
                    <p className="col-span-4 text-red-500 text-xs text-right">
                      {form.formState.errors.tam_pacote.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Unidade
                  </Label>
                  <Controller
                    name="unit"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
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
                    )}
                  />
                  {form.formState.errors.unit && (
                    <p className="col-span-4 text-red-500 text-xs text-right">
                      {form.formState.errors.unit.message}
                    </p>
                  )}
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
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-mono text-xs">
                    {ingredient.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ingredient.nome}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(ingredient.preco))}
                  </TableCell>
                  <TableCell>{ingredient.tam_pacote}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>
                    {formatCurrency(Number((ingredient as any).valorunit ?? 0))}
                  </TableCell>
                  <TableCell>
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
                          onSelect={() => handleEdit(ingredient)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleDelete(ingredient.id)}
                          className="text-red-600"
                        >
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
