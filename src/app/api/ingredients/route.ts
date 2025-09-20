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
    // Usa a função getIngredients() que já tem toda a lógica necessária
    const getIngredients = async () => {
      const [ingredients] = await db.query('SELECT * FROM ingredientes');
      return ingredients;
    };
    const ingredients = await getIngredients();
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

    const { nome, preco, tam_pacote, unit } = validation.data;
    const valorunit = preco / tam_pacote;

    const [result] = await db.execute(
      'INSERT INTO ingredientes (nome, preco, tam_pacote, unit, valorunit) VALUES (?, ?, ?, ?, ?)',
      [nome, preco, tam_pacote, unit, valorunit],
    );

    const insertId = (result as any).insertId;
    const [newIngredientRows]: any[] = await db.query(
      'SELECT * FROM ingredientes WHERE id = ?',
      [insertId],
    );

    return NextResponse.json(newIngredientRows[0], { status: 201 });
  } catch (error) {
    console.error('Falha ao criar ingrediente:', error);
    return NextResponse.json(
      { message: 'Erro ao criar ingrediente' },
      { status: 500 },
    );
  }
}
