// src/app/api/dishes/route.ts
import {
  obterPratos,
  adicionarPrato,
  atualizarPrato,
  excluirPrato,
} from '@/lib/data';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const dishItemSchema = z.object({
  item_id: z.coerce.number().min(1),
  tipo_item: z.enum(['ingredient', 'recipe']),
  quantidade: z.coerce.number().min(0.01),
});

const dishSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1),
  preco_venda: z.coerce.number().min(0),
  itens: z.array(dishItemSchema).min(1),
  // custo_total será calculado pelo backend
});

export async function GET() {
  try {
    const dishes = await obterPratos();
    return NextResponse.json(dishes);
  } catch (error) {
    console.error('Falha ao buscar pratos:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar pratos' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = dishSchema.safeParse(body);

    if (!validation.success) {
      // devolver erros estruturados para o cliente interpretar
      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    const newDish = await adicionarPrato(
      validation.data as Omit<Prato, 'id' | 'custo_total'>,
    );

    if (!newDish) {
      return NextResponse.json(
        { message: 'Erro ao obter dados do prato criado' },
        { status: 500 },
      );
    }

    return NextResponse.json(newDish, { status: 201 });
  } catch (error: any) {
    console.error('Falha ao criar prato:', error);
    // se o erro veio do DB, retorna a mensagem para facilitar debug em dev
    return NextResponse.json(
      {
        message: 'Erro ao criar prato',
        detail: error?.message ?? String(error),
      },
      { status: 500 },
    );
  }
}
