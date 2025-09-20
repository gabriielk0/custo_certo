"use server";
import "server-only";

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
    const ingredients = rows as Ingrediente[];
    return ingredients.map(i => ({...i, custoPorUnidade: Number(i.preco) / Number(i.tam_pacote)}));
}

export async function addIngredient(data: Omit<Ingrediente, 'id' | 'custoPorUnidade'>) {
    await db.query('INSERT INTO ingredientes (nome, preco, tam_pacote, unit) VALUES (?, ?, ?, ?)', [data.nome, data.preco, data.tam_pacote, data.unit]);
    revalidatePath('/ingredients');
    revalidatePath('/dishes');
    revalidatePath('/recipes');
}

export async function updateIngredient(id: number, data: Omit<Ingrediente, 'id' | 'custoPorUnidade'>) {
    await db.query('UPDATE ingredientes SET nome = ?, preco = ?, tam_pacote = ?, unit = ? WHERE id = ?', [data.nome, data.preco, data.tam_pacote, data.unit, id]);
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
    const recipes = rows as any[];
    return recipes.map(r => ({...r, ingredientes: JSON.parse(r.ingredientes)}));
}

export async function addRecipe(data: Omit<Receita, 'id'>) {
    const id = `R${new Date().getTime()}`;
    await db.query('INSERT INTO receitas (id, nome, rendimento, peso_bruto, unidade, custo_total, ingredientes) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, data.nome, data.rendimento, data.peso_bruto, data.unidade, data.custo_total, JSON.stringify(data.ingredientes)]);
    revalidatePath('/recipes');
    revalidatePath('/dishes');
}

export async function updateRecipe(id: string, data: Omit<Receita, 'id'>) {
    await db.query('UPDATE receitas SET nome = ?, rendimento = ?, peso_bruto = ?, unidade = ?, custo_total = ?, ingredientes = ? WHERE id = ?', [data.nome, data.rendimento, data.peso_bruto, data.unidade, data.custo_total, JSON.stringify(data.ingredientes), id]);
    revalidatePath('/recipes');
    revalidatePath('/dishes');
}

export async function deleteRecipe(id: string) {
    await db.query('DELETE FROM receitas WHERE id = ?', [id]);
    revalidatePath('/recipes');
    revalidatePath('/dishes');
}

// Dishes
export async function getDishes(): Promise<Prato[]> {
    const [rows] = await db.query('SELECT * FROM pratos');
     if (!isRowDataPacket(rows)) return [];
    const dishes = rows as any[];
    return dishes.map(d => ({...d, itens: JSON.parse(d.itens)}));
}

export async function addDish(data: Omit<Prato, 'id'>) {
    const id = `D${new Date().getTime()}`;
    await db.query('INSERT INTO pratos (id, nome, custo_total, preco_venda, itens) VALUES (?, ?, ?, ?, ?)', [id, data.nome, data.custo_total, data.preco_venda, JSON.stringify(data.itens)]);
    revalidatePath('/dishes');
}

export async function updateDish(id: string, data: Omit<Prato, 'id'>) {
    await db.query('UPDATE pratos SET nome = ?, custo_total = ?, preco_venda = ?, itens = ? WHERE id = ?', [data.nome, data.custo_total, data.preco_venda, JSON.stringify(data.itens), id]);
    revalidatePath('/dishes');
}

export async function deleteDish(id: string) {
    await db.query('DELETE FROM pratos WHERE id = ?', [id]);
    revalidatePath('/dishes');
}

// Expenses
export async function getExpenses(): Promise<Despesa[]> {
    const [rows] = await db.query('SELECT * FROM despesas');
    if (!isRowDataPacket(rows)) return [];
    return rows as Despesa[];
}

export async function addExpense(data: Omit<Despesa, 'id'>) {
    const id = `E${new Date().getTime()}`;
    await db.query('INSERT INTO despesas (id, descricao, valor, tipo, categoria, data) VALUES (?, ?, ?, ?, ?, ?)', [id, data.descricao, data.valor, data.tipo, data.categoria, data.data]);
    revalidatePath('/expenses');
}

export async function updateExpense(id: string, data: Omit<Despesa, 'id'>) {
    await db.query('UPDATE despesas SET descricao = ?, valor = ?, tipo = ?, categoria = ?, data = ? WHERE id = ?', [data.descricao, data.valor, data.tipo, data.categoria, data.data, id]);
    revalidatePath('/expenses');
}

export async function deleteExpense(id: string) {
    await db.query('DELETE FROM despesas WHERE id = ?', [id]);
    revalidatePath('/expenses');
}

// Used for client components
export async function getAllIngredientsAndRecipes() {
    const ingredients = await getIngredients();
    const recipes = await getRecipes();
    return { ingredients, recipes };
}
