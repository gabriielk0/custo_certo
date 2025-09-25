import { atualizarPrato, excluirPrato } from '@/lib/data';
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const dishId = Number(params.id);
    if (isNaN(dishId)) {
      return NextResponse.json(
        { message: 'ID do prato inválido' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = dishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    await atualizarPrato(
      dishId,
      validation.data as Omit<Prato, 'id' | 'custo_total'>,
    );

    return NextResponse.json({ message: 'Prato atualizado com sucesso' });
  } catch (error: any) {
    console.error('Falha ao atualizar prato:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar prato', detail: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const dishId = Number(params.id);
    await excluirPrato(dishId);
    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Falha ao deletar prato:', error);
    return NextResponse.json(
      { message: 'Erro ao deletar prato' },
      { status: 500 },
    );
  }
}
