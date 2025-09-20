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

// Ingredients
export async function getIngredients(): Promise<Ingrediente[]> {
  const [rows] = await db.query('SELECT * FROM ingredientes');
  if (!isRowDataPacket(rows)) return [];
  const ingredients = rows as any[];
  return ingredients.map((i) => {
    const preco = Number(i.preco ?? 0);
    const tam_pacote = Number(i.tam_pacote ?? 0);
    return {
      ...i,
      preco,
      tam_pacote,
      valorunit: tam_pacote > 0 ? preco / tam_pacote : 0,
    } as Ingrediente;
  });
}

export async function addIngredient(
  data: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  await db.query(
    'INSERT INTO ingredientes (nome, preco, tam_pacote, unit) VALUES (?, ?, ?, ?)',
    [data.nome, data.preco, data.tam_pacote, data.unit],
  );
  revalidatePath('/ingredients');
  revalidatePath('/dishes');
  revalidatePath('/recipes');
}

export async function updateIngredient(
  id: number,
  data: Omit<Ingrediente, 'id' | 'valorunit'>,
) {
  await db.query(
    'UPDATE ingredientes SET nome = ?, preco = ?, tam_pacote = ?, unit = ? WHERE id = ?',
    [data.nome, data.preco, data.tam_pacote, data.unit, id],
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

export async function addDish(data: Omit<Prato, 'id'>) {
  await db.query(
    'INSERT INTO pratos (nome, custo_total, preco_venda, itens) VALUES (?, ?, ?, ?)',
    [
      data.nome,
      data.custo_total,
      data.preco_venda,
      JSON.stringify(data.itens ?? []),
    ],
  );
  revalidatePath('/dishes');
}

export async function updateDish(id: number, data: Omit<Prato, 'id'>) {
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
