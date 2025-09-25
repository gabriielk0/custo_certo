// Caminho do arquivo: src/app/api/recipes/route.ts
import { getRecipes } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const recipes = await getRecipes();
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Falha ao buscar receitas:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar receitas' },
      { status: 500 },
    );
  }
}
