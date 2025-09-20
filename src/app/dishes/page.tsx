"use client";

import { useState, useEffect }from "react";
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  dishes as initialDishes,
  recipes as allRecipes,
  ingredients as allIngredients,
} from "@/lib/data";
import type { Dish, Recipe } from "@/lib/types";

const dishItemSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(["ingredient", "recipe"]),
  quantity: z.coerce.number().min(0.01),
});

const dishSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  sellingPrice: z.coerce.number().min(0, "Preço deve ser positivo"),
  items: z.array(dishItemSchema).min(1, "Adicione pelo menos um item"),
});

const allItems = [
  ...allIngredients.map((i) => ({ ...i, type: "ingredient" as const })),
  ...allRecipes.map((r) => ({ ...r, type: "recipe" as const })),
];

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const form = useForm<z.infer<typeof dishSchema>>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      items: [{ itemId: "", itemType: "recipe", quantity: 0 }],
      sellingPrice: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const watchedSellingPrice = form.watch("sellingPrice");

  const totalCost = watchedItems.reduce((acc, item) => {
    if (!item.itemId || !item.quantity) return acc;
    const selectedItem = allItems.find(
      (i) => i.id === item.itemId && i.type === item.itemType
    );
    if (!selectedItem) return acc;

    let itemCostPerUnit = 0;
    if (selectedItem.type === "ingredient") {
      itemCostPerUnit = selectedItem.costPerUnit;
    } else {
      const recipeItem = selectedItem as Recipe;
      itemCostPerUnit = recipeItem.yield > 0 ? recipeItem.totalCost / recipeItem.yield : 0;
    }

    return acc + itemCostPerUnit * item.quantity;
  }, 0);
  
  const profitMargin = watchedSellingPrice > 0 ? (watchedSellingPrice - totalCost) / watchedSellingPrice : 0;
  
  const handleMarginChange = (margin: number) => {
    if (totalCost > 0) {
        const newPrice = totalCost / (1 - margin);
        form.setValue("sellingPrice", parseFloat(newPrice.toFixed(2)));
    }
  };


  const onSubmit = (data: z.infer<typeof dishSchema>) => {
    const dishData = { ...data, totalCost };

    if (editingDish) {
      setDishes(dishes.map((d) => (d.id === editingDish.id ? { ...dishData, id: editingDish.id } : d)));
    } else {
      setDishes([...dishes, { ...dishData, id: `D${new Date().getTime()}` }]);
    }
    
    setEditingDish(null);
    form.reset({
      name: "",
      sellingPrice: 0,
      items: [{ itemId: "", itemType: "recipe", quantity: 0 }],
    });
    setIsFormOpen(false);
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    form.reset(dish);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDishes(dishes.filter((r) => r.id !== id));
  };

  const handleOpenForm = (open: boolean) => {
    if (!open) {
      form.reset({
        name: "",
        sellingPrice: 0,
        items: [{ itemId: "", itemType: "recipe", quantity: 0 }],
      });
      setEditingDish(null);
    }
    setIsFormOpen(open);
  };

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  
  const formatPercent = (value: number) => {
    return value.toLocaleString("pt-BR", { style: 'percent', minimumFractionDigits: 2 });
  }

  const AnalysisPanel = ({ dish }: { dish: Dish }) => {
    const initialMargin = dish.sellingPrice > 0 ? (dish.sellingPrice - dish.totalCost) / dish.sellingPrice : 0.3;
    const [desiredMargin, setDesiredMargin] = useState(initialMargin > 0 ? initialMargin : 0.3);

    if (!dish) return null;
    
    // Análise com Preço Praticado
    const actualProfit = dish.sellingPrice - dish.totalCost;
    const actualProfitMargin = dish.sellingPrice > 0 ? actualProfit / dish.sellingPrice : 0;
    
    // Análise com Preço Sugerido
    const suggestedPrice = dish.totalCost / (1 - desiredMargin);
    const suggestedProfit = suggestedPrice - dish.totalCost;

    return (
       <div className="flex flex-col h-full">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Análise do Prato: {dish.name}</SheetTitle>
          <SheetDescription>
            Análise de custos, lucros e sugestão de preço.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Análise de Preço Praticado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Preço de Venda (Praticado)</span>
                        <span className="font-bold text-lg">{formatCurrency(dish.sellingPrice)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Custo Total dos Insumos</span>
                        <span className="font-bold text-lg">{formatCurrency(dish.totalCost)}</span>
                    </div>
                    <hr/>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Lucro Bruto (Praticado)</span>
                        <span className={`font-bold text-lg ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(actualProfit)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Margem de Lucro (Praticada)</span>
                        <span className={`font-bold text-lg ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(actualProfitMargin)}</span>
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
                               setDesiredMargin(Math.max(0, Math.min(100, value)) / 100);
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
                        <span className="text-muted-foreground">Preço de Venda Sugerido</span>
                        <span className="font-bold text-xl text-primary">{formatCurrency(suggestedPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Lucro Bruto Previsto</span>
                        <span className={`font-bold text-lg ${suggestedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(suggestedProfit)}</span>
                    </div>
                </CardContent>
            </Card>

        </div>
        </ScrollArea>
         <SheetFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => setSelectedDish(null)}>Fechar</Button>
        </SheetFooter>
      </div>
    )
  }

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
                <DialogTitle>{editingDish ? "Editar" : "Criar"} Prato</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do prato. O custo será calculado
                  automaticamente.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <Label htmlFor="name">Nome do Prato</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    <Label htmlFor="sellingPrice">Preço de Venda (R$)</Label>
                    <Input id="sellingPrice" type="number" step="0.01" {...form.register("sellingPrice")} />
                    {form.formState.errors.sellingPrice && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.formState.errors.sellingPrice.message}
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
                            if(!isNaN(value)) {
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
                      Custo Total: <span className="font-bold">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                  {fields.map((item, index) => {
                    const selectedItem = allItems.find(
                      (i) => i.id === watchedItems[index]?.itemId && i.type === watchedItems[index]?.itemType
                    );
                    let itemCostPerUnit = 0;
                    if (selectedItem) {
                      if (selectedItem.type === 'ingredient') {
                        itemCostPerUnit = selectedItem.costPerUnit;
                      } else {
                        const recipeItem = selectedItem as Recipe;
                        itemCostPerUnit = recipeItem.yield > 0 ? recipeItem.totalCost / recipeItem.yield : 0;
                      }
                    }
                    const itemTotalCost = itemCostPerUnit * (watchedItems[index]?.quantity || 0);

                    return (
                      <div key={item.id} className="flex gap-2 items-end mb-2">
                        <div className="flex-1">
                          <Label>Item (Ingrediente ou Receita)</Label>
                          <Controller
                            name={`items.${index}.itemId`}
                            control={form.control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  const [id, type] = value.split("|");
                                  form.setValue(
                                    `items.${index}.itemType`,
                                    type as "ingredient" | "recipe"
                                  );
                                  field.onChange(id);
                                }}
                                defaultValue={field.value ? `${field.value}|${form.watch(`items.${index}.itemType`)}` : ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allIngredients.map((ing) => (
                                    <SelectItem
                                      key={ing.id}
                                      value={`${ing.id}|ingredient`}
                                    >
                                      {ing.name} (Ingrediente Cru)
                                    </SelectItem>
                                  ))}
                                  {allRecipes.map((rec) => (
                                    <SelectItem
                                      key={rec.id}
                                      value={`${rec.id}|recipe`}
                                    >
                                      {rec.name} (Receita)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="w-24">
                          <Label>Qtd (g/ml)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            {...form.register(`items.${index}.quantity`)}
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
                  )})}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ itemId: "", itemType: "recipe", quantity: 0 })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                  </Button>
                  {form.formState.errors.items && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.items.message ||
                        form.formState.errors.items.root?.message}
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
            Seus pratos prontos para venda. Clique no ícone de olho para ver a análise de preço.
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
                const profit = dish.sellingPrice - dish.totalCost;
                return (
                <TableRow key={dish.id}>
                  <TableCell className="font-mono text-xs">{dish.id}</TableCell>
                  <TableCell className="font-medium">{dish.name}</TableCell>
                  <TableCell>{formatCurrency(dish.totalCost)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(dish.sellingPrice)}</TableCell>
                   <TableCell className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
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
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleEdit(dish); }}>
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
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Sheet open={!!selectedDish} onOpenChange={(open) => !open && setSelectedDish(null)}>
        <SheetContent className="sm:max-w-lg p-0">
           {selectedDish && <AnalysisPanel dish={selectedDish} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
