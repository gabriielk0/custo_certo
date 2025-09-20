"use client";

import { useState, useEffect } from "react";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getExpenses, addExpense, updateExpense, deleteExpense } from "@/lib/data";
import type { Despesa } from "@/lib/types";

const expenseSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  tipo: z.enum(["fixed", "variable"]),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  data: z.string().min(1, "Data é obrigatória"),
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Despesa[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Despesa | null>(null);

  useEffect(() => {
    getExpenses().then(setExpenses);
  }, []);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
  });

  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    const updatedExpenses = await getExpenses();
    setExpenses(updatedExpenses);
    setEditingExpense(null);
    form.reset();
    setIsDialogOpen(false);
  };

  const handleEdit = (expense: Despesa) => {
    setEditingExpense(expense);
    form.reset({...expense, id: String(expense.id)});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(Number(id));
    const updatedExpenses = await getExpenses();
    setExpenses(updatedExpenses);
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      form.reset();
      setEditingExpense(null);
    }
    setIsDialogOpen(open);
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const renderTable = (type: 'fixed' | 'variable') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Data</TableHead>
          <TableHead><span className="sr-only">Ações</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.filter(e => e.tipo === type).map((expense) => (
          <TableRow key={expense.id}>
            <TableCell className="font-medium">{expense.descricao}</TableCell>
            <TableCell>{formatCurrency(expense.valor)}</TableCell>
            <TableCell>{expense.categoria}</TableCell>
            <TableCell>{format(new Date(expense.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
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
                  <DropdownMenuItem onSelect={() => handleEdit(expense)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleDelete(String(expense.id))} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas Gerais</h1>
          <p className="text-muted-foreground">
            Acompanhe suas despesas fixas e variáveis.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Editar' : 'Adicionar'} Despesa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da despesa.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" {...form.register("descricao")} />
                  {form.formState.errors.descricao && <p className="text-red-500 text-xs">{form.formState.errors.descricao.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="valor">Valor</Label>
                  <Input id="valor" type="number" step="0.01" {...form.register("valor")} />
                  {form.formState.errors.valor && <p className="text-red-500 text-xs">{form.formState.errors.valor.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Controller name="tipo" control={form.control} render={({ field }) => (
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixo</SelectItem>
                          <SelectItem value="variable">Variável</SelectItem>
                        </SelectContent>
                      </Select>
                  )} />
                   {form.formState.errors.tipo && <p className="text-red-500 text-xs">{form.formState.errors.tipo.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input id="categoria" {...form.register("categoria")} />
                  {form.formState.errors.categoria && <p className="text-red-500 text-xs">{form.formState.errors.categoria.message}</p>}
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" type="date" {...form.register("data")} />
                  {form.formState.errors.data && <p className="text-red-500 text-xs">{form.formState.errors.data.message}</p>}
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
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>
            Todas as despesas cadastradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fixed">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fixed">Despesas Fixas</TabsTrigger>
              <TabsTrigger value="variable">Despesas Variáveis</TabsTrigger>
            </TabsList>
            <TabsContent value="fixed">
              {renderTable('fixed')}
            </TabsContent>
            <TabsContent value="variable">
              {renderTable('variable')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
