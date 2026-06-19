import type { AdminNutritionPlan } from './db'

type SeedPlan = Omit<AdminNutritionPlan, 'id' | 'updatedAt'>

function food(
  name: string, quantity: string, calories: number,
  proteinG: number, carbsG: number, fatG: number,
  benefits: string, isVegetarian = true
) {
  return { name, quantity, calories, proteinG, carbsG, fatG, benefits, isVegetarian }
}

function meal(name: string, timeSlot: string, items: ReturnType<typeof food>[], notes = '') {
  return { name, timeSlot, notes, items }
}

export const DEFAULT_NUTRITION_PLANS: Record<string, SeedPlan> = {
  BUILD_MUSCLE: {
    goal: 'BUILD_MUSCLE', goalLabel: 'Build Muscle', goalEmoji: '💪',
    dailyCalories: 2800, proteinG: 160, carbsG: 320, fatG: 80,
    isPublished: true,
    headerImageUrl: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&h=280&fit=crop&q=80',
    iconImageUrl:   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=80&h=80&fit=crop&q=80',
    hydration: '3.5–4 L water/day. Add electrolytes on training days.',
    generalTips: [
      'Eat every 3–4 hours to keep amino-acid levels elevated.',
      'Have a protein source at every meal — paneer, eggs, dal, or chicken.',
      'Do not skip the pre- and post-workout meals.',
      'Whole foods first. Protein powder is a supplement — not a meal.',
    ],
    meals: [
      meal('Pre-Workout Snack', '6:00 – 7:00 AM', [
        food('Banana', '1 large', 90, 1, 23, 0, 'Fast-digesting carbs for instant workout energy'),
        food('Peanut Butter', '1 tbsp', 95, 4, 3, 8, 'Healthy fats + protein for sustained energy'),
        food('Low-fat Milk', '200 ml', 70, 7, 10, 1, 'Casein protein keeps you full through workout'),
      ]),
      meal('Breakfast', '8:00 – 9:00 AM', [
        food('Paneer Paratha (whole wheat)', '2 parathas', 420, 18, 54, 14, 'High protein + complex carbs for muscle fuel'),
        food('Dahi (curd)', '1 cup / 150 g', 90, 8, 10, 2, 'Probiotics for gut health; casein for slow protein release'),
        food('Whole Eggs', '3 eggs', 210, 18, 2, 15, 'Complete amino-acid profile; highest biological value protein', false),
      ]),
      meal('Mid-Morning', '11:00 AM', [
        food('Chana Chaat', '1 cup', 180, 10, 28, 3, 'Chickpeas — slow carb + fibre + plant protein'),
        food('Nimbu Paani (no sugar)', '1 glass', 10, 0, 3, 0, 'Electrolytes + Vitamin C'),
      ]),
      meal('Lunch', '1:00 – 2:00 PM', [
        food('Cooked Rice (white)', '1.5 cups', 320, 6, 70, 1, 'Fast carbs for post-workout glycogen replenishment'),
        food('Masoor Dal Tadka', '1 bowl / 200 g', 200, 14, 30, 4, 'Lentils: complete plant protein when combined with rice'),
        food('Chicken Curry (breast)', '150 g chicken', 250, 38, 6, 9, 'Lean protein for muscle protein synthesis', false),
        food('Palak Sabzi', '1 cup', 80, 5, 10, 3, 'Iron + folate for red blood cell production'),
        food('Mixed Salad with Lemon', '1 plate', 50, 2, 8, 1, 'Micronutrients + enzymes for digestion'),
      ]),
      meal('Post-Workout', '5:00 PM', [
        food('Sabudana Khichdi', '1 bowl', 250, 4, 55, 3, 'Fast carbs to spike insulin and drive glucose into muscles'),
        food('Whey Protein Shake', '1 scoop / 200 ml milk', 250, 30, 18, 4, 'Fast-absorbing whey to maximise MPS in the anabolic window', false),
      ]),
      meal('Dinner', '8:00 – 9:00 PM', [
        food('Whole Wheat Roti', '3 rotis', 270, 9, 54, 4, 'Complex carbs + fibre'),
        food('Rajma Curry', '1 cup', 210, 13, 34, 4, 'Kidney beans — plant protein + slow carb'),
        food('Grilled Paneer Tikka', '100 g', 260, 18, 5, 18, 'High protein, medium fat — ideal for overnight recovery'),
        food('Cucumber Raita', '1 cup', 80, 4, 8, 3, 'Probiotics + cooling digestive aid'),
      ]),
      meal('Before Bed', '10:30 PM', [
        food('Warm Turmeric Milk (haldi doodh)', '250 ml', 150, 8, 12, 6, 'Casein protein for 7-hr slow release; curcumin reduces DOMS'),
      ]),
    ],
  },

  LOSE_FAT: {
    goal: 'LOSE_FAT', goalLabel: 'Lose Fat', goalEmoji: '🔥',
    dailyCalories: 1700, proteinG: 130, carbsG: 160, fatG: 55,
    isPublished: true,
    headerImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=280&fit=crop&q=80',
    iconImageUrl:   'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=80&h=80&fit=crop&q=80',
    hydration: '3–4 L water/day. Warm water before meals suppresses appetite.',
    generalTips: [
      'Eat protein first at every meal — it signals satiety hormones (GLP-1, PYY).',
      'Prefer complex carbs (brown rice, whole wheat) over refined ones.',
      'Cook in minimal oil — use non-stick or air-frying techniques.',
      'Do not eat carbs late at night — insulin sensitivity is lower in the evening.',
    ],
    meals: [
      meal('Early Morning (empty stomach)', '6:00 – 7:00 AM', [
        food('Warm Water + Lemon + Jeera (cumin)', '1 glass', 10, 0, 2, 0, 'Boosts metabolism, suppresses appetite, aids liver detox'),
        food('Soaked Methi (fenugreek seeds)', '1 tsp soaked', 15, 1, 2, 0, 'Slows glucose absorption, reduces insulin spikes'),
      ]),
      meal('Breakfast', '8:00 – 9:00 AM', [
        food('Moong Dal Chilla', '3 chillas', 250, 16, 32, 4, 'High protein, low fat breakfast — keeps you full 4+ hours'),
        food('Green Chutney (mint + coriander)', '2 tbsp', 20, 1, 3, 0, 'Antioxidants + zero-calorie flavour'),
        food('Boiled Egg Whites', '3 whites', 50, 11, 0, 0, 'Pure protein with zero fat', false),
      ]),
      meal('Mid-Morning', '11:00 AM', [
        food('Green Tea', '1 cup', 5, 0, 1, 0, 'EGCG catechins increase fat oxidation by ~17%'),
        food('Roasted Makhana (fox nuts)', '30 g', 100, 4, 19, 1, 'Low GI snack — prevents energy crashes'),
      ]),
      meal('Lunch', '1:00 PM', [
        food('Brown Rice', '¾ cup cooked', 160, 3, 34, 1, 'Lower GI than white rice; more fibre'),
        food('Chana Dal', '1 bowl', 175, 12, 26, 4, 'High satiety, high fibre, medium protein'),
        food('Palak Sabzi', '1 cup', 80, 5, 10, 3, 'Iron + folate; very low calorie density'),
        food('Raita with cucumber', '1 cup', 80, 5, 8, 2, 'Probiotics improve fat metabolism'),
      ]),
      meal('Afternoon Snack', '4:00 PM', [
        food('Mixed Sprouts', '1 cup', 120, 9, 18, 1, 'Sprouting increases enzyme activity + protein bioavailability'),
      ]),
      meal('Dinner (light)', '7:00 – 8:00 PM', [
        food('Jowar / Bajra Roti', '2 rotis', 180, 6, 36, 2, 'Millets: high fibre + magnesium'),
        food('Mixed Vegetable Sabzi (no potato)', '1 cup', 100, 4, 14, 3, 'Micronutrient-dense, low calorie'),
        food('Clear Soup (tomato / dal)', '1 bowl', 60, 3, 9, 1, 'Broth signals satiety with almost zero calories'),
      ]),
    ],
  },

  IMPROVE_CARDIO: {
    goal: 'IMPROVE_CARDIO', goalLabel: 'Improve Cardio', goalEmoji: '❤️',
    dailyCalories: 2200, proteinG: 110, carbsG: 290, fatG: 65,
    isPublished: true,
    headerImageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=280&fit=crop&q=80',
    iconImageUrl:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&q=80',
    hydration: '4+ L water/day. Drink 500 ml 2 hours before cardio.',
    generalTips: [
      "Carbs are your primary cardio fuel — don't restrict them.",
      'Iron-rich foods prevent anaemia which kills cardio performance.',
      'Eat 1–2 hours before long cardio sessions. Never train fasted for long runs.',
      'Banana + jaggery is an excellent intra-workout natural energy source.',
    ],
    meals: [
      meal('Pre-Cardio', '6:30 AM', [
        food('2 Bananas', '2 medium', 180, 2, 46, 0, 'Fast + medium GI carbs — perfect 60-minute training fuel'),
        food('Coconut Water', '200 ml', 45, 0, 10, 0, 'Natural electrolytes (potassium) pre-workout'),
      ]),
      meal('Post-Cardio Breakfast', '9:00 AM', [
        food('Poha with veggies', '1.5 cups', 300, 8, 56, 5, 'Fast-replenishing carb with micronutrients'),
        food('Boiled Egg', '2 whole eggs', 140, 12, 1, 10, 'Complete protein for post-workout repair', false),
        food('Fresh Orange Juice', '150 ml', 70, 1, 16, 0, 'Vitamin C + carbs; enhances iron absorption from eggs'),
      ]),
      meal('Lunch', '1:00 PM', [
        food('White Rice', '1.5 cups', 320, 6, 70, 1, 'Rapid glycogen restoration after morning training'),
        food('Arhar / Toor Dal', '1 bowl', 190, 12, 28, 4, 'Protein + carbs + iron for RBC production'),
        food('Baingan Bharta or Any Sabzi', '1 cup', 100, 4, 14, 4, 'Diverse micronutrients for immune function'),
        food('Curd', '1 cup', 90, 8, 10, 2, 'Probiotics for gut health; improves nutrient absorption'),
      ]),
      meal('Snack', '4:00 PM', [
        food('Ragi Roti', '2 small', 180, 5, 37, 2, 'Calcium + complex carbs for bone density and sustained energy'),
        food('Jaggery (gur)', '10 g', 40, 0, 10, 0, 'Natural sugar + iron — better than refined sugar'),
      ]),
      meal('Dinner', '8:00 PM', [
        food('Whole Wheat Roti', '2 rotis', 180, 6, 36, 3, 'Complex carbs for overnight glycogen restoration'),
        food('Chicken Curry or Rajma', '150 g / 1 cup', 230, 30, 8, 9, 'High protein for muscle repair', false),
        food('Palak Dal', '1 cup', 140, 10, 20, 3, 'Iron + protein; add lemon for better absorption'),
      ]),
    ],
  },

  IMPROVE_FLEXIBILITY: {
    goal: 'IMPROVE_FLEXIBILITY', goalLabel: 'Improve Flexibility', goalEmoji: '🤸',
    dailyCalories: 1900, proteinG: 90, carbsG: 240, fatG: 65,
    isPublished: true,
    headerImageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&h=280&fit=crop&q=80',
    iconImageUrl:   'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=80&h=80&fit=crop&q=80',
    hydration: '3.5 L water/day. Dehydration directly reduces muscle elasticity.',
    generalTips: [
      'Anti-inflammatory foods are key — turmeric, ginger, omega-3s.',
      'Magnesium-rich foods reduce muscle cramps and support flexibility.',
      'Avoid highly processed foods — they increase systemic inflammation.',
      'Collagen-boosting foods (amla, bone broth) support joint health.',
    ],
    meals: [
      meal('Morning', '7:00 AM', [
        food('Amla (Indian gooseberry) juice or raw', '1 amla / 30 ml juice', 20, 0, 5, 0, 'Highest natural Vitamin C — essential for collagen synthesis'),
        food('Soaked Almonds', '6–8 almonds', 70, 3, 3, 6, 'Magnesium + Vitamin E — reduces muscle soreness and stiffness'),
      ]),
      meal('Breakfast', '8:30 AM', [
        food('Oats Upma with vegetables', '1 bowl', 280, 10, 46, 6, 'Oats: high magnesium, anti-inflammatory beta-glucan'),
        food('Turmeric + Ginger Tea', '1 cup', 15, 0, 3, 0, 'Curcumin + gingerol — potent natural anti-inflammatories'),
      ]),
      meal('Lunch', '1:00 PM', [
        food('Khichdi (rice + moong dal)', '1 large bowl', 320, 14, 56, 5, 'Easily digestible; high magnesium; tryptophan for relaxation'),
        food('Dahi', '1 cup', 90, 8, 10, 2, 'Calcium for bone health; probiotics for gut'),
        food('Stir-fried Palak + Methi', '1 cup', 90, 6, 12, 2, 'Magnesium + folate + iron'),
      ]),
      meal('Dinner', '7:30 PM', [
        food('2 Rotis', '2 whole wheat', 180, 6, 36, 3, 'Complex carbs for gentle energy'),
        food('Mixed Dal (5-lentil dal)', '1 bowl', 200, 13, 30, 4, 'Complete plant amino acids + magnesium'),
        food('Beetroot Raita', '1 cup', 100, 5, 14, 2, 'Nitrates in beets improve circulation to muscles'),
      ]),
    ],
  },

  GENERAL_FITNESS: {
    goal: 'GENERAL_FITNESS', goalLabel: 'General Fitness', goalEmoji: '⭐',
    dailyCalories: 2000, proteinG: 100, carbsG: 240, fatG: 65,
    isPublished: true,
    headerImageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=280&fit=crop&q=80',
    iconImageUrl:   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&h=80&fit=crop&q=80',
    hydration: '3 L water/day minimum.',
    generalTips: [
      'Eat the rainbow — different coloured vegetables each day.',
      'Balanced macro split: 50% carbs, 20% protein, 30% fat.',
      'Avoid skipping breakfast — sets metabolic tone for the day.',
      'Limit fried snacks. Choose roasted, boiled, or air-fried alternatives.',
    ],
    meals: [
      meal('Breakfast', '8:00 AM', [
        food('Idli (2–3) + Sambar', '2 idli + 1 bowl sambar', 290, 12, 52, 4, 'Fermented rice-lentil: probiotics + complete protein when combined'),
        food('Coconut Chutney', '2 tbsp', 60, 1, 3, 5, 'Healthy MCT fats from coconut support energy'),
        food('Filter Coffee / Chai (low sugar)', '1 cup', 60, 2, 8, 2, 'Moderate caffeine improves alertness'),
      ]),
      meal('Lunch', '1:00 PM', [
        food('Roti (2–3 whole wheat)', '2 rotis', 220, 7, 44, 3, 'Whole wheat: fibre + B vitamins'),
        food('Mixed Vegetable Curry', '1 bowl', 140, 5, 22, 4, 'Diverse micronutrients'),
        food('Moong or Masoor Dal', '1 cup', 170, 12, 25, 3, 'Protein + iron for energy'),
        food('Salad with lemon dressing', '1 plate', 60, 3, 8, 1, 'Digestive enzymes + Vitamin C'),
      ]),
      meal('Evening Snack', '4:30 PM', [
        food('Chana Jor Garam or Murmura Bhel', '1 cup', 130, 6, 22, 2, 'Protein snack; low oil version'),
        food('Buttermilk (chaas)', '1 glass', 70, 5, 8, 2, 'Probiotics + hydration + electrolytes'),
      ]),
      meal('Dinner', '8:00 PM', [
        food('Brown Rice or Bajra Roti', '1 cup / 2 roti', 250, 6, 50, 3, 'Complex carb for steady energy'),
        food('Palak Paneer or Dal Makhani', '1 cup', 220, 12, 18, 12, 'Protein + iron + calcium'),
        food('Dahi', '1 small cup', 70, 5, 8, 2, 'Gut health + protein'),
      ]),
    ],
  },
}
