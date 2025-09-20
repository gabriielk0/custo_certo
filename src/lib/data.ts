import type { Ingredient, Recipe, Expense, Dish } from './types';

export const ingredients: Ingredient[] = [
  { id: '1', name: 'Arroz Cru', price: 20, packageSize: 5000, unit: 'g', costPerUnit: 0.004 },
  { id: '2', name: 'Feijão Cru', price: 8, packageSize: 1000, unit: 'g', costPerUnit: 0.008 },
  { id: '3', name: 'Óleo de Soja', price: 9, packageSize: 900, unit: 'ml', costPerUnit: 0.01 },
  { id: '4', name: 'Alho', price: 15, packageSize: 1000, unit: 'g', costPerUnit: 0.015 },
  { id: '5', name: 'Sal', price: 3, packageSize: 1000, unit: 'g', costPerUnit: 0.003 },
  { id: '6', name: 'Patinho moído', price: 40, packageSize: 1000, unit: 'kg', costPerUnit: 40 },
  { id: '7', name: 'Batata Palha', price: 15, packageSize: 500, unit: 'g', costPerUnit: 0.03 },
  { id: '8', name: 'Creme de Leite', price: 4, packageSize: 200, unit: 'g', costPerUnit: 0.02 },
  { id: '9', name: 'Extrato de Tomate', price: 5, packageSize: 340, unit: 'g', costPerUnit: 0.0147 },
];

export const recipes: Recipe[] = [
  {
    id: 'R1',
    name: 'Arroz Cozido',
    yield: 1,
    grossWeight: 1000,
    unit: 'kg',
    totalCost: 2.18,
    ingredients: [
      { ingredientId: '1', quantity: 500 }, // Arroz
      { ingredientId: '3', quantity: 10 }, // Óleo
      { ingredientId: '4', quantity: 5 }, // Alho
      { ingredientId: '5', quantity: 5 }, // Sal
    ],
  },
  {
    id: 'R2',
    name: 'Feijão Cozido',
    yield: 1,
    grossWeight: 1200,
    unit: 'kg',
    totalCost: 8.23,
    ingredients: [
      { ingredientId: '2', quantity: 1000 }, // Feijão
      { ingredientId: '4', quantity: 10 }, // Alho
      { ingredientId: '5', quantity: 8 }, // Sal
    ],
  },
  {
    id: 'R3',
    name: 'Carne Moída Refogada',
    yield: 0.8,
    grossWeight: 1000,
    unit: 'kg',
    totalCost: 40.3,
    ingredients: [
      { ingredientId: '6', quantity: 1 }, // Patinho moído (1kg)
      { ingredientId: '3', quantity: 20 }, // Óleo
      { ingredientId: '4', quantity: 5 }, // Alho
      { ingredientId: '5', quantity: 5 }, // Sal
    ],
  },
  {
    id: 'R4',
    name: 'Estrogonofe de Carne',
    yield: 1.2,
    grossWeight: 1200,
    unit: 'kg',
    totalCost: 49.31,
    ingredients: [
      { ingredientId: '6', quantity: 1 }, // Patinho moído (1kg)
      { ingredientId: '8', quantity: 400 }, // Creme de Leite (2 caixas)
      { ingredientId: '9', quantity: 340 }, // Extrato de Tomate (1 lata)
      { ingredientId: '3', quantity: 20 }, // Óleo
      { ingredientId: '4', quantity: 5 }, // Alho
      { ingredientId: '5', quantity: 5 }, // Sal
    ]
  }
];

export const dishes: Dish[] = [
    {
        id: 'D1',
        name: 'PF de Estrogonofe',
        totalCost: 15.65,
        sellingPrice: 29.90,
        items: [
            { itemId: 'R1', itemType: 'recipe', quantity: 200 }, // 200g de Arroz Cozido
            { itemId: 'R4', itemType: 'recipe', quantity: 300 }, // 300g de Estrogonofe
            { itemId: '7', itemType: 'ingredient', quantity: 50 } // 50g de Batata Palha
        ]
    }
]

export const expenses: Expense[] = [
  { id: '1', description: 'Aluguel', amount: 3000, type: 'fixed', category: 'Imóvel', date: '2023-05-01' },
  { id: '2', description: 'Conta de Luz', amount: 450, type: 'fixed', category: 'Utilities', date: '2023-05-10' },
  { id: '3', description: 'Conta de Água', amount: 200, type: 'fixed', category: 'Utilities', date: '2023-05-12' },
  { id: '4', description: 'Marketing Digital', amount: 800, type: 'variable', category: 'Marketing', date: '2023-05-15' },
  { id: '5', description: 'Manutenção de Equipamento', amount: 500, type: 'variable', category: 'Manutenção', date: '2023-05-20' },
];
