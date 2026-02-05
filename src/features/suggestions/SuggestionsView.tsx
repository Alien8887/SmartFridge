import React from 'react';
import { ShoppingCart, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mealSuggestions } from '../../data/demoMeals';

interface SuggestionsViewProps {
  darkMode: boolean;
  theme: any;
}

export function SuggestionsView({ darkMode, theme }: SuggestionsViewProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <Card className={theme.card}>
        <h3 className={`text-lg md:text-xl font-bold ${theme.text} mb-4 md:mb-6 flex items-center gap-2`}>
          <ShoppingCart className="w-5 md:w-6 h-5 md:h-6" /> Smart Meal Suggestions
        </h3>
        <div className="space-y-4">
          {mealSuggestions.map((meal, idx) => (
            <div key={idx} className={`${theme.hover} rounded-xl p-4 md:p-5 border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h4 className={`font-semibold ${theme.text} text-base md:text-lg`}>{meal.name}</h4>
                  <div className={`text-xs md:text-sm ${theme.textMuted} flex items-center gap-2 mt-1`}>
                    <Clock className="w-4 h-4" /> {meal.time}
                  </div>
                </div>
                <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors text-sm">
                  Cook Now
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ing, i) => (
                  <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={theme.card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base md:text-lg font-bold ${theme.text}`}>Smart Shopping List</h3>
          <Button variant="success" icon={<ShoppingBag className="w-4 h-4" />}>
            Buy Now (Demo)
          </Button>
        </div>
        <div className="space-y-2">
          {['Fresh Milk (2L)', 'Chicken Breast (1kg)', 'Broccoli (500g)', 'Strawberries (400g)', 'Eggs (12pcs)'].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${theme.hover}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} />
                <span className={`${theme.text} text-sm md:text-base`}>{item}</span>
              </div>
              <button className="text-xs px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors">
                Quick Buy
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}