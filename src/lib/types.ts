export type Ingredient = {
  id: string;
  name: string;
  price: number;
  packageSize: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'un';
  costPerUnit: number;
};

export type RecipeIngredient = {
  ingredientId: string;
  quantity: number;
};

export type Recipe = {
  id: string;
  name: string;
  yield: number;
  grossWeight: number;
  unit: 'kg' | 'l' | 'un';
  totalCost: number;
  ingredients: RecipeIngredient[];
};

export type DishItem = {
  // Can be an ingredient or a recipe
  itemId: string;
  // 'ingredient' or 'recipe'
  itemType: 'ingredient' | 'recipe';
  quantity: number;
};

export type Dish = {
  id: string;
  name: string;
  totalCost: number;
  sellingPrice: number;
  items: DishItem[];
};


export type Expense = {
  id: string;
  description: string;
  amount: number;
  type: 'fixed' | 'variable';
  category: string;
  date: string;
};
