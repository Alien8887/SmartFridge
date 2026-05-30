import { MealSuggestion } from '../types';

// ── Backward-compatible simple export ───────────────────────────────────
export const mealSuggestions: MealSuggestion[] = [
  { name: 'Creamy Chicken Broccoli', ingredients: ['Chicken Breast', 'Broccoli', 'Fresh Milk'], time: '25 min' },
  { name: 'Greek Yogurt Parfait',    ingredients: ['Greek Yogurt', 'Strawberries', 'Bananas'],  time: '5 min'  },
  { name: 'Fresh Garden Salad',      ingredients: ['Broccoli', 'Carrots', 'Spinach'],           time: '10 min' },
  { name: 'Beef Stir Fry',           ingredients: ['Ground Beef', 'Carrots', 'Spinach'],        time: '20 min' },
];

// ── Full recipe catalog ─────────────────────────────────────────────────
export interface Recipe {
  id:          string;
  name:        string;
  emoji:       string;
  category:    'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
  ingredients: string[];    // partial-match against InventoryItem.name
  steps:       string[];
  time:        string;
  prepMins:    number;
  calories:    number;
  servings:    number;
  difficulty:  'Easy' | 'Medium' | 'Hard';
  tags:        string[];
}

export const recipes: Recipe[] = [
  {
    id: 'r01', name: 'Creamy Chicken Broccoli Pasta', emoji: '🍝',
    category: 'Dinner', difficulty: 'Medium', time: '30 min', prepMins: 30, calories: 520, servings: 2,
    ingredients: ['Chicken', 'Broccoli', 'Milk', 'Butter', 'Cheese'],
    steps: [
      'Boil pasta until al dente. Reserve ½ cup pasta water.',
      'Season chicken breast with salt and pepper; sear 4 min each side, then slice.',
      'Blanch broccoli florets for 2 minutes in boiling water.',
      'Melt butter in a pan; whisk in milk and grated cheese until a smooth sauce forms.',
      'Toss pasta, chicken, and broccoli in the sauce. Add pasta water if too thick.',
      'Serve immediately with extra grated cheese.',
    ],
    tags: ['protein', 'comfort food', 'creamy'],
  },
  {
    id: 'r02', name: 'Greek Yogurt Parfait', emoji: '🫙',
    category: 'Breakfast', difficulty: 'Easy', time: '5 min', prepMins: 5, calories: 280, servings: 1,
    ingredients: ['Greek Yogurt', 'Strawberries', 'Bananas'],
    steps: [
      'Slice strawberries and bananas.',
      'Layer Greek yogurt at the base of a glass.',
      'Add a layer of mixed fruit.',
      'Repeat layers. Top with a drizzle of honey if available.',
    ],
    tags: ['healthy', 'quick', 'no-cook'],
  },
  {
    id: 'r03', name: 'Spinach & Egg Omelette', emoji: '🥚',
    category: 'Breakfast', difficulty: 'Easy', time: '10 min', prepMins: 10, calories: 320, servings: 1,
    ingredients: ['Eggs', 'Spinach', 'Butter', 'Cheese'],
    steps: [
      'Whisk 3 eggs with a pinch of salt and pepper.',
      'Melt butter in a non-stick pan over medium heat.',
      'Pour in eggs; let the edges set before folding gently.',
      'Add fresh spinach and grated cheese to one half.',
      'Fold the omelette over and slide onto plate.',
    ],
    tags: ['protein', 'quick', 'vegetarian'],
  },
  {
    id: 'r04', name: 'Pan-Seared Salmon', emoji: '🐟',
    category: 'Dinner', difficulty: 'Medium', time: '20 min', prepMins: 20, calories: 410, servings: 2,
    ingredients: ['Salmon', 'Butter', 'Broccoli'],
    steps: [
      'Pat salmon fillets dry; season generously with salt, pepper, and a squeeze of lemon.',
      'Heat butter in a skillet over high heat until foaming.',
      'Place salmon skin-side up; cook 4 minutes. Flip and cook 3 more minutes.',
      'Simultaneously steam broccoli for 4 minutes until bright green.',
      'Serve salmon over broccoli with pan butter drizzled on top.',
    ],
    tags: ['omega-3', 'keto', 'gluten-free'],
  },
  {
    id: 'r05', name: 'Beef and Carrot Stir Fry', emoji: '🥢',
    category: 'Dinner', difficulty: 'Easy', time: '20 min', prepMins: 20, calories: 450, servings: 2,
    ingredients: ['Ground Beef', 'Carrots', 'Spinach'],
    steps: [
      'Julienne carrots into thin strips.',
      'Brown ground beef in a hot wok until no pink remains.',
      'Add carrots; stir-fry on high heat for 3 minutes.',
      'Add spinach and toss until wilted, about 1 minute.',
      'Season with soy sauce, garlic, and sesame oil.',
      'Serve over steamed rice.',
    ],
    tags: ['quick', 'protein', 'asian'],
  },
  {
    id: 'r06', name: 'Banana Oat Pancakes', emoji: '🥞',
    category: 'Breakfast', difficulty: 'Easy', time: '15 min', prepMins: 15, calories: 380, servings: 2,
    ingredients: ['Bananas', 'Eggs', 'Milk'],
    steps: [
      'Mash 2 ripe bananas in a bowl until smooth.',
      'Whisk in 2 eggs and ¼ cup milk.',
      'Stir in ½ cup oats and a pinch of cinnamon.',
      'Heat a non-stick pan over medium heat; pour batter in small rounds.',
      'Cook 2–3 min each side until golden.',
      'Serve with sliced strawberries or honey.',
    ],
    tags: ['healthy', 'gluten-free option', 'sweet'],
  },
  {
    id: 'r07', name: 'Apple Cheddar Spinach Salad', emoji: '🥗',
    category: 'Lunch', difficulty: 'Easy', time: '10 min', prepMins: 10, calories: 290, servings: 1,
    ingredients: ['Apples', 'Cheese', 'Spinach'],
    steps: [
      'Wash and dry fresh spinach leaves.',
      'Thinly slice apples and cube cheddar cheese.',
      'Combine in a bowl with a handful of walnuts if available.',
      'Drizzle with olive oil, apple cider vinegar, salt and pepper.',
      'Toss gently and serve immediately.',
    ],
    tags: ['no-cook', 'vegetarian', 'crunchy'],
  },
  {
    id: 'r08', name: 'Creamy Tomato Soup', emoji: '🍅',
    category: 'Lunch', difficulty: 'Easy', time: '25 min', prepMins: 25, calories: 240, servings: 2,
    ingredients: ['Tomatoes', 'Milk', 'Butter'],
    steps: [
      'Dice 4 ripe tomatoes; sauté with butter and a clove of garlic for 5 minutes.',
      'Add ½ cup water or broth; simmer 10 minutes.',
      'Blend until completely smooth.',
      'Stir in milk and heat gently — do not boil.',
      'Season with salt, pepper, and fresh basil.',
      'Serve with crusty bread.',
    ],
    tags: ['comfort food', 'vegetarian', 'warming'],
  },
  {
    id: 'r09', name: 'Chicken Caesar Salad', emoji: '🥙',
    category: 'Lunch', difficulty: 'Easy', time: '20 min', prepMins: 20, calories: 430, servings: 2,
    ingredients: ['Chicken', 'Spinach', 'Cheese'],
    steps: [
      'Grill or pan-fry chicken breast until cooked through; rest 5 min, then slice.',
      'Wash spinach and arrange on plates.',
      'Shave cheddar or parmesan over the top.',
      'Add croutons and sliced chicken.',
      'Drizzle with Caesar dressing (lemon juice, mayo, mustard, Worcestershire).',
    ],
    tags: ['protein', 'lunch', 'classic'],
  },
  {
    id: 'r10', name: 'Strawberry Banana Smoothie', emoji: '🥤',
    category: 'Snack', difficulty: 'Easy', time: '5 min', prepMins: 5, calories: 220, servings: 1,
    ingredients: ['Strawberries', 'Bananas', 'Greek Yogurt', 'Milk'],
    steps: [
      'Peel and slice banana.',
      'Hull strawberries.',
      'Add all ingredients to a blender with a handful of ice.',
      'Blend on high until completely smooth.',
      'Pour into a tall glass and serve immediately.',
    ],
    tags: ['quick', 'no-cook', 'refreshing'],
  },
  {
    id: 'r11', name: 'Beef Bolognese', emoji: '🍝',
    category: 'Dinner', difficulty: 'Medium', time: '40 min', prepMins: 40, calories: 580, servings: 3,
    ingredients: ['Ground Beef', 'Tomatoes', 'Carrots'],
    steps: [
      'Finely dice carrots and onions; sauté in olive oil until soft.',
      'Add ground beef; cook until browned.',
      'Stir in crushed tomatoes and a splash of milk.',
      'Season with Italian herbs, salt, and pepper.',
      'Simmer on low for 20–25 minutes, stirring occasionally.',
      'Toss with cooked spaghetti and serve with parmesan.',
    ],
    tags: ['italian', 'comfort food', 'protein'],
  },
  {
    id: 'r12', name: 'Broccoli Cheddar Soup', emoji: '🥦',
    category: 'Lunch', difficulty: 'Medium', time: '30 min', prepMins: 30, calories: 360, servings: 3,
    ingredients: ['Broccoli', 'Cheese', 'Milk', 'Butter'],
    steps: [
      'Melt butter in a large pot; sauté diced onion 3 minutes.',
      'Add broccoli florets and broth; simmer 12 minutes until tender.',
      'Blend half the soup for a creamy texture, leave half chunky.',
      'Stir in milk and shredded cheddar over low heat until melted.',
      'Season and serve with crusty bread.',
    ],
    tags: ['vegetarian', 'warming', 'comfort food'],
  },
  {
    id: 'r13', name: 'Glazed Carrot Sticks', emoji: '🥕',
    category: 'Snack', difficulty: 'Easy', time: '20 min', prepMins: 20, calories: 180, servings: 2,
    ingredients: ['Carrots', 'Butter'],
    steps: [
      'Peel and cut carrots into even sticks.',
      'Melt butter in a pan; add carrots with a pinch of sugar.',
      'Cook on medium heat, turning occasionally, until caramelized and tender.',
      'Finish with a pinch of sea salt and fresh thyme if available.',
    ],
    tags: ['vegetarian', 'snack', 'quick'],
  },
  {
    id: 'r14', name: 'Orange Glazed Salmon', emoji: '🍊',
    category: 'Dinner', difficulty: 'Medium', time: '25 min', prepMins: 25, calories: 390, servings: 2,
    ingredients: ['Salmon', 'Orange Juice', 'Butter'],
    steps: [
      'Season salmon fillets with salt and pepper.',
      'Heat butter in an oven-safe pan; sear salmon 3 min each side.',
      'Pour orange juice over salmon; transfer to oven (200°C / 400°F).',
      'Bake 8–10 minutes until flaky.',
      'Spoon pan sauce over salmon and serve with steamed vegetables.',
    ],
    tags: ['citrus', 'omega-3', 'elegant'],
  },
  {
    id: 'r15', name: 'Yogurt Berry Bowl', emoji: '🍓',
    category: 'Breakfast', difficulty: 'Easy', time: '5 min', prepMins: 5, calories: 210, servings: 1,
    ingredients: ['Greek Yogurt', 'Strawberries', 'Apples'],
    steps: [
      'Dice apples into small cubes; hull and slice strawberries.',
      'Spoon thick Greek yogurt into a bowl.',
      'Arrange fruit on top.',
      'Drizzle with honey and add granola if available.',
    ],
    tags: ['healthy', 'no-cook', 'high protein'],
  },
  {
    id: 'r16', name: 'Creamy Spinach Pasta', emoji: '🌿',
    category: 'Dinner', difficulty: 'Easy', time: '20 min', prepMins: 20, calories: 480, servings: 2,
    ingredients: ['Spinach', 'Milk', 'Butter', 'Cheese'],
    steps: [
      'Cook pasta until al dente.',
      'Melt butter in a wide pan; add garlic and cook 1 minute.',
      'Add milk and grated cheese; stir until sauce thickens.',
      'Add fresh spinach; toss until wilted.',
      'Drain pasta and toss through the sauce. Serve with extra cheese.',
    ],
    tags: ['vegetarian', 'quick', 'creamy'],
  },
  {
    id: 'r17', name: 'Chicken Vegetable Soup', emoji: '🍲',
    category: 'Dinner', difficulty: 'Easy', time: '35 min', prepMins: 35, calories: 310, servings: 3,
    ingredients: ['Chicken', 'Carrots', 'Spinach', 'Tomatoes'],
    steps: [
      'Dice chicken breast into bite-size pieces.',
      'Sauté chicken in olive oil until lightly browned.',
      'Add diced carrots and cook 3 minutes.',
      'Add chopped tomatoes and 1 litre of water or stock.',
      'Simmer 15 minutes; add spinach in the final 2 minutes.',
      'Season with salt, pepper, and fresh herbs.',
    ],
    tags: ['healthy', 'warming', 'protein'],
  },
];