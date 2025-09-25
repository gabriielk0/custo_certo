// ...existing code...
'use server';
import 'server-only';

import type { Ingrediente, Receita, Despesa, Prato } from './types';
import { db } from './db';
import { revalidatePath } from 'next/cache';

// Type guard for RowDataPacket
function isRowDataPacket(row: any): row is any[] {
  return Array.isArray(row);
}

/**
 * Calcula o valor unitário (custo por g/ml/un) de um ingrediente.
 * @param preco - O preço do pacote.
 * @param tam_pacote - O tamanho do pacote.
 * @param unit - A unidade de medida ('g', 'kg', 'ml', 'l', 'un').
 * @returns O custo por unidade base (g/ml/un).
 */
function calcularValorUnitario(
  preco: number,
  tam_pacote: number,
  unit: 'g' | 'kg' | 'ml' | 'l' | 'un',
): number {
  if (tam_pacote <= 0) return 0;
  if (unit === 'kg' || unit === 'l') {
    return preco / (tam_pacote * 1000);
  }
  return preco / tam_pacote;
}

/**
 * Calcula o custo total de um prato com base em seus itens (ingredientes e receitas).
 * @param itens - Array de itens do prato com ID, tipo e quantidade.
 * @returns O custo total calculado do prato.
 */
async function calculateDishTotalCost(
  itens: {
    item_id: number;
    tipo_item: 'ingredient' | 'recipe';
    quantidade: number;
  }[],
): Promise<number> {
  const ingredients = await getIngredients();
  const recipes = await getRecipes();

  const allItemsMap = new Map<string, Ingrediente | Receita>();
  ingredients.forEach((ing) => allItemsMap.set(`ingredient-${ing.id}`, ing));
  recipes.forEach((rec) => allItemsMap.set(`recipe-${rec.id}`, rec));

  let totalCost = 0;
  for (const item of itens) {
    const key = `${item.tipo_item}-${item.item_id}`;
    const selectedItem = allItemsMap.get(key);

    if (!selectedItem || item.quantidade <= 0) continue;

    let itemCostPerUnit = 0;
    if ('valorunit' in selectedItem) {
      // Ingrediente
      itemCostPerUnit = selectedItem.valorunit ?? 0;
    } else {
      // Receita
      const rec = selectedItem as Receita;
      itemCostPerUnit =
        rec.rendimento > 0
          ? (rec.custo_total ?? 0) / (rec.rendimento * 1000)
          : 0;
    }
    totalCost += itemCostPerUnit * item.quantidade;
  }
  return totalCost;
}

// Ingredients
export async function getIngredients(): Promise<Ingrediente[]> {
  const [rows] = await db.query('SELECT * FROM ingredientes');
  if (!isRowDataPacket(rows)) return [];
  const ingredients = rows as any[];
  return ingredients.map((i) => {
    const preco = Number(i.preco ?? 0);
    const tam_pacote = Number(i.tam_pacote ?? 0);
    const valorunit = calcularValorUnitario(preco, tam_pacote, i.unit);
    return {
      ...i,
      preco,
      tam_pacote,
      valorunit,
    } as Ingrediente;
  });
}

export async function addIngredient(
  data: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  const { preco, tam_pacote, unit } = data;
  const valorunit = calcularValorUnitario(preco, tam_pacote, unit);
  const [result] = await db.query(
    'INSERT INTO ingredientes (nome, preco, tam_pacote, unit, valorunit) VALUES (?, ?, ?, ?, ?)',
    [data.nome, data.preco, data.tam_pacote, data.unit, valorunit],
  );

  const insertId = (result as any).insertId;
  if (!insertId) {
    return null;
  }

  const [newIngredientRows]: any[] = await db.query(
    'SELECT * FROM ingredientes WHERE id = ?',
    [insertId],
  );

  revalidatePath('/ingredients');
  revalidatePath('/dishes');
  revalidatePath('/recipes');

  const newIngredient = newIngredientRows[0]
    ? (newIngredientRows[0] as Ingrediente)
    : null;

  return newIngredient;
}

export async function updateIngredient(
  id: number,
  data: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  const { nome, preco, tam_pacote, unit } = data;
  const valorunit = calcularValorUnitario(preco, tam_pacote, unit);
  await db.query(
    'UPDATE ingredientes SET nome = ?, preco = ?, tam_pacote = ?, unit = ?, valorunit = ? WHERE id = ?',
    [nome, preco, tam_pacote, unit, valorunit, id],
  );
  revalidatePath('/ingredients');
  revalidatePath('/dishes');
  revalidatePath('/recipes');
}

export async function deleteIngredient(id: number) {
  await db.query('DELETE FROM ingredientes WHERE id = ?', [id]);
  revalidatePath('/ingredients');
  revalidatePath('/dishes');
  revalidatePath('/recipes');
}

// Recipes
export async function getRecipes(): Promise<Receita[]> {
  const [rows] = await db.query('SELECT * FROM receitas');
  if (!isRowDataPacket(rows)) return [];
  return (rows as any[]).map((r) => {
    const parsedIngredientes =
      typeof r.ingredientes === 'string' && r.ingredientes.length
        ? JSON.parse(r.ingredientes)
        : r.ingredientes ?? [];
    return {
      ...r,
      rendimento: Number(r.rendimento ?? 0),
      peso_bruto: Number(r.peso_bruto ?? 0),
      custo_total: Number(r.custo_total ?? 0),
      ingredientes: parsedIngredientes,
    } as Receita;
  });
}

export async function addRecipe(data: Omit<Receita, 'id'>) {
  await db.query(
    'INSERT INTO receitas (nome, rendimento, peso_bruto, unidade, custo_total, ingredientes) VALUES (?, ?, ?, ?, ?, ?)',
    [
      data.nome,
      data.rendimento,
      data.peso_bruto,
      data.unidade,
      data.custo_total,
      JSON.stringify(data.ingredientes ?? []),
    ],
  );
  revalidatePath('/recipes');
  revalidatePath('/dishes');
  // O ID agora é gerado pelo banco de dados, então não o retornamos diretamente aqui.
}

export async function updateRecipe(id: number, data: Omit<Receita, 'id'>) {
  await db.query(
    'UPDATE receitas SET nome = ?, rendimento = ?, peso_bruto = ?, unidade = ?, custo_total = ?, ingredientes = ? WHERE id = ?',
    [
      data.nome,
      data.rendimento,
      data.peso_bruto,
      data.unidade,
      data.custo_total,
      JSON.stringify(data.ingredientes ?? []),
      id,
    ],
  );
  revalidatePath('/recipes');
  revalidatePath('/dishes');
}

export async function deleteRecipe(id: number) {
  await db.query('DELETE FROM receitas WHERE id = ?', [id]);
  revalidatePath('/recipes');
  revalidatePath('/dishes');
}

// Dishes
export async function getDishes(): Promise<Prato[]> {
  const [rows] = await db.query('SELECT * FROM pratos');
  if (!isRowDataPacket(rows)) return [];
  return (rows as any[]).map((d) => ({
    ...d,
    custo_total: Number(d.custo_total ?? 0),
    preco_venda: Number(d.preco_venda ?? 0),
    itens:
      typeof d.itens === 'string' && d.itens.length
        ? JSON.parse(d.itens)
        : d.itens ?? [],
  })) as Prato[];
}

export async function addDish(data: Omit<Prato, 'id' | 'custo_total'>) {
  const custo_total = await calculateDishTotalCost(data.itens);
  const [result] = await db.query(
    'INSERT INTO pratos (nome, custo_total, preco_venda, itens) VALUES (?, ?, ?, ?)',
    [
      data.nome,
      data.custo_total,
      data.preco_venda,
      JSON.stringify(data.itens ?? []),
    ],
  );

  const insertId = (result as any).insertId;
  if (!insertId) {
    // tenta retornar algo útil ou lançar
    throw new Error('Não foi possível obter insertId ao criar prato');
  }

  const [newDishRows]: any[] = await db.query(
    'SELECT * FROM pratos WHERE id = ?',
    [insertId],
  );

  revalidatePath('/dishes');
  // garante que retornamos o objeto criado
  return newDishRows && newDishRows[0]
    ? ({
        ...newDishRows[0],
        custo_total: Number(newDishRows[0].custo_total ?? 0),
        preco_venda: Number(newDishRows[0].preco_venda ?? 0),
        itens:
          typeof newDishRows[0].itens === 'string' &&
          newDishRows[0].itens.length
            ? JSON.parse(newDishRows[0].itens)
            : newDishRows[0].itens ?? [],
      } as Prato)
    : null;
}

export async function updateDish(
  id: number,
  data: Omit<Prato, 'id' | 'custo_total'>,
) {
  const custo_total = await calculateDishTotalCost(data.itens);
  await db.query(
    'UPDATE pratos SET nome = ?, custo_total = ?, preco_venda = ?, itens = ? WHERE id = ?',
    [
      data.nome,
      data.custo_total,
      data.preco_venda,
      JSON.stringify(data.itens ?? []),
      id,
    ],
  );
  revalidatePath('/dishes');
}

export async function deleteDish(id: number) {
  await db.query('DELETE FROM pratos WHERE id = ?', [id]);
  revalidatePath('/dishes');
}

// Expenses
export async function getExpenses(): Promise<Despesa[]> {
  const [rows] = await db.query('SELECT * FROM despesas');
  if (!isRowDataPacket(rows)) return [];
  return rows as any[] as Despesa[];
}

export async function addExpense(data: Omit<Despesa, 'id'>) {
  await db.query(
    'INSERT INTO despesas (descricao, valor, tipo, categoria, data) VALUES (?, ?, ?, ?, ?)',
    [data.descricao, data.valor, data.tipo, data.categoria, data.data],
  );
  revalidatePath('/expenses');
}

export async function updateExpense(id: number, data: Omit<Despesa, 'id'>) {
  await db.query(
    'UPDATE despesas SET descricao = ?, valor = ?, tipo = ?, categoria = ?, data = ? WHERE id = ?',
    [data.descricao, data.valor, data.tipo, data.categoria, data.data, id],
  );
  revalidatePath('/expenses');
}

export async function deleteExpense(id: number) {
  await db.query('DELETE FROM despesas WHERE id = ?', [id]);
  revalidatePath('/expenses');
}

// Used for client components
export async function getAllIngredientsAndRecipes() {
  const ingredients = await getIngredients();
  const recipes = await getRecipes();
  return { ingredients, recipes };
}
// ...existing code...
