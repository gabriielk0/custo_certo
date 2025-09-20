export type Ingrediente = {
  id: number;
  nome: string;
  preco: number;
  tam_pacote: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'un';
  valorunit: number;
};

export type IngredienteDaReceita = {
  ingrediente_id: string;
  quantidade: number;
};

export type Receita = {
  id: string;
  nome: string;
  rendimento: number;
  peso_bruto: number;
  unidade: 'kg' | 'l' | 'un';
  custo_total: number;
  ingredientes: IngredienteDaReceita[];
};

export type ItemDoPrato = {
  // Can be an ingredient or a recipe
  item_id: string;
  // 'ingredient' or 'recipe'
  tipo_item: 'ingredient' | 'recipe';
  quantidade: number;
};

export type Prato = {
  id: string;
  nome: string;
  custo_total: number;
  preco_venda: number;
  itens: ItemDoPrato[];
};


export type Despesa = {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'fixed' | 'variable';
  categoria: string;
  data: string;
};
