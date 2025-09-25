import {
  obterIngredientes as getIngredientsData,
  adicionarIngrediente,
} from '@/lib/data';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ingredientSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco: z.coerce.number().min(0, 'Valor deve ser positivo'),
  tam_pacote: z.coerce.number().min(0.01, 'Volume deve ser maior que zero'),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'un']),
});

export async function GET() {
  try {
    const ingredients = await getIngredientsData();
    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Falha ao buscar ingredientes:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar ingredientes' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ingredientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    // Delega a criação e o cálculo para a função de acesso a dados
    const newIngredient = await adicionarIngrediente(validation.data);

    if (!newIngredient) {
      return NextResponse.json(
        { message: 'Erro ao obter dados do ingrediente criado' },
        { status: 500 },
      );
    }
    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    console.error('Falha ao criar ingrediente:', error);
    return NextResponse.json(
      { message: 'Erro ao criar ingrediente' },
      { status: 500 },
    );
  }
}
