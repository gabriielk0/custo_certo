import 'server-only';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Valida se a variável de ambiente está definida
if (!process.env.DATABASE_URL) {
  throw new Error('A variável de ambiente DATABASE_URL não está definida.');
}

// Cria a conexão com o banco de dados
// A URL de conexão do PlanetScale/Aiven já inclui as configurações de SSL necessárias
export const db = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
});

const createTables = async () => {
  await db.execute(`
        CREATE TABLE IF NOT EXISTS ingredientes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255),
            preco DECIMAL(10, 2),
            tam_pacote DECIMAL(10, 2),
            unit VARCHAR(255),
            valorunit DECIMAL(10, 2)
        );`);
  await db.execute(`
        CREATE TABLE IF NOT EXISTS receitas (
            id VARCHAR(5) NOT NULL PRIMARY KEY,
            nome VARCHAR(255),
            rendimento DECIMAL(10, 2),
            peso_bruto DECIMAL(10, 2),
            unidade VARCHAR(255),
            custo_total DECIMAL(10, 2),
            ingredientes JSON
        );`);
  await db.execute(`
        CREATE TABLE IF NOT EXISTS pratos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255),
            custo_total DECIMAL(10, 2),
            preco_venda DECIMAL(10, 2),
            itens JSON
        );`);
  await db.execute(`
        CREATE TABLE IF NOT EXISTS despesas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            descricao VARCHAR(255),
            valor DECIMAL(10, 2),
            tipo VARCHAR(255),
            categoria VARCHAR(255),
            data VARCHAR(255)
        );
    `);
};

const populateInitialData = async () => {
  try {
    const [ingredientRows]: any[] = await db.query(
      'SELECT COUNT(*) as count FROM ingredientes',
    );
    if (ingredientRows[0].count === 0) {
      const initialIngredients = [
        { id: 1, nome: 'Arroz Cru', preco: 20, tam_pacote: 5000, unit: 'g' },
        { id: 2, nome: 'Feijão Cru', preco: 8, tam_pacote: 1000, unit: 'g' },
        { id: 3, nome: 'Óleo de Soja', preco: 9, tam_pacote: 900, unit: 'ml' },
        { id: 4, nome: 'Alho', preco: 15, tam_pacote: 1000, unit: 'g' },
        { id: 5, nome: 'Sal', preco: 3, tam_pacote: 1000, unit: 'g' },
        {
          id: 6,
          nome: 'Patinho moído',
          preco: 40,
          tam_pacote: 1000,
          unit: 'kg',
        },
        { id: 7, nome: 'Batata Palha', preco: 15, tam_pacote: 500, unit: 'g' },
        { id: 8, nome: 'Creme de Leite', preco: 4, tam_pacote: 200, unit: 'g' },
        {
          id: 9,
          nome: 'Extrato de Tomate',
          preco: 5,
          tam_pacote: 340,
          unit: 'g',
        },
      ];
      for (const i of initialIngredients) {
        const valorunit =
          i.tam_pacote > 0 ? Number(i.preco) / Number(i.tam_pacote) : 0;
        await db.query(
          'INSERT INTO ingredientes (id, nome, preco, tam_pacote, unit, valorunit) VALUES (?, ?, ?, ?, ?, ?)',
          [i.id, i.nome, i.preco, i.tam_pacote, i.unit, valorunit],
        );
      }
    }

    const [recipeRows]: any[] = await db.query(
      'SELECT COUNT(*) as count FROM receitas',
    );
    if (recipeRows[0].count === 0) {
      const initialRecipes = [
        {
          id: 1,
          nome: 'Arroz Cozido',
          rendimento: 1,
          peso_bruto: 1000,
          unidade: 'kg',
          custo_total: 2.18,
          ingredientes: JSON.stringify([
            { ingrediente_id: 1, quantidade: 500 },
            { ingrediente_id: 3, quantidade: 10 },
            { ingrediente_id: 4, quantidade: 5 },
            { ingrediente_id: 5, quantidade: 5 },
          ]),
        },
        {
          id: 2,
          nome: 'Feijão Cozido',
          rendimento: 1,
          peso_bruto: 1200,
          unidade: 'kg',
          custo_total: 8.23,
          ingredientes: JSON.stringify([
            { ingrediente_id: 2, quantidade: 1000 },
            { ingrediente_id: 4, quantidade: 10 },
            { ingrediente_id: 5, quantidade: 8 },
          ]),
        },
        {
          id: 3,
          nome: 'Carne Moída Refogada',
          rendimento: 0.8,
          peso_bruto: 1000,
          unidade: 'kg',
          custo_total: 40.3,
          ingredientes: JSON.stringify([
            { ingrediente_id: 6, quantidade: 1 },
            { ingrediente_id: 3, quantidade: 20 },
            { ingrediente_id: 4, quantidade: 5 },
            { ingrediente_id: 5, quantidade: 5 },
          ]),
        },
        {
          id: 4,
          nome: 'Estrogonofe de Carne',
          rendimento: 1.2,
          peso_bruto: 1200,
          unidade: 'kg',
          custo_total: 49.31,
          ingredientes: JSON.stringify([
            { ingrediente_id: 6, quantidade: 1 },
            { ingrediente_id: 8, quantidade: 400 },
            { ingrediente_id: 9, quantidade: 340 },
            { ingrediente_id: 3, quantidade: 20 },
            { ingrediente_id: 4, quantidade: 5 },
            { ingrediente_id: 5, quantidade: 5 },
          ]),
        },
      ];
      for (const r of initialRecipes) {
        await db.query(
          'INSERT INTO receitas (id, nome, rendimento, peso_bruto, unidade, custo_total, ingredientes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            r.id,
            r.nome,
            r.rendimento,
            r.peso_bruto,
            r.unidade,
            r.custo_total,
            r.ingredientes,
          ],
        );
      }
    }

    const [dishRows]: any[] = await db.query(
      'SELECT COUNT(*) as count FROM pratos',
    );
    if (dishRows[0].count === 0) {
      const initialDishes = [
        {
          id: 1,
          nome: 'PF de Estrogonofe',
          custo_total: 15.65,
          preco_venda: 29.9,
          itens: JSON.stringify([
            { item_id: 1, tipo_item: 'recipe', quantidade: 200 },
            { item_id: 4, tipo_item: 'recipe', quantidade: 300 },
            { item_id: 7, tipo_item: 'ingredient', quantidade: 50 },
          ]),
        },
      ];
      for (const d of initialDishes) {
        await db.query(
          'INSERT INTO pratos (id, nome, custo_total, preco_venda, itens) VALUES (?, ?, ?, ?, ?)',
          [d.id, d.nome, d.custo_total, d.preco_venda, d.itens],
        );
      }
    }

    const [expenseRows]: any[] = await db.query(
      'SELECT COUNT(*) as count FROM despesas',
    );
    if (expenseRows[0].count === 0) {
      const initialExpenses = [
        {
          id: 1,
          descricao: 'Aluguel',
          valor: 3000,
          tipo: 'fixed',
          categoria: 'Imóvel',
          data: '2023-05-01',
        },
        {
          id: 2,
          descricao: 'Conta de Luz',
          valor: 450,
          tipo: 'fixed',
          categoria: 'Utilities',
          data: '2023-05-10',
        },
        {
          id: 3,
          descricao: 'Conta de Água',
          valor: 200,
          tipo: 'fixed',
          categoria: 'Utilities',
          data: '2023-05-12',
        },
        {
          id: 4,
          descricao: 'Marketing Digital',
          valor: 800,
          tipo: 'variable',
          categoria: 'Marketing',
          data: '2023-05-15',
        },
        {
          id: 5,
          descricao: 'Manutenção de Equipamento',
          valor: 500,
          tipo: 'variable',
          categoria: 'Manutenção',
          data: '2023-05-20',
        },
      ];
      for (const e of initialExpenses) {
        await db.query(
          'INSERT INTO despesas (id, descricao, valor, tipo, categoria, data) VALUES (?, ?, ?, ?, ?, ?)',
          [e.id, e.descricao, e.valor, e.tipo, e.categoria, e.data],
        );
      }
    }
  } catch (error) {
    console.warn(
      'Aviso: Não foi possível popular os dados iniciais. Se você já tem os dados no seu banco, pode ignorar este aviso.',
      error,
    );
  }
};

(async () => {
  try {
    await createTables();

    // Garante que as colunas de ID sejam AUTO_INCREMENT, alterando as tabelas existentes se necessário.
    // Isso é crucial porque `CREATE TABLE IF NOT EXISTS` não atualiza uma tabela existente.
    try {
      console.log(
        'Verificando e atualizando o schema das tabelas para IDs com AUTO_INCREMENT...',
      );
      await db.execute(
        `ALTER TABLE ingredientes MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;`,
      );
      await db.execute(`ALTER TABLE receitas MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;`);
      await db.execute(`ALTER TABLE pratos MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;`);
      await db.execute(`ALTER TABLE despesas MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;`);
    } catch (error: any) {
      console.warn("Aviso: Não foi possível executar ALTER TABLE. Se o schema já estiver correto, este aviso pode ser ignorado.", (error as Error).message);
    }

    await populateInitialData();
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
})();
