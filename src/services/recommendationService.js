const crud = require('../persistence/crud');
const planService = require('./planService');

function sumMeals(meals) {
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, sodium: 0, sugar: 0 };
  for (const m of meals || []) {
    totals.calories += Number(m.calories || 0);
    totals.protein += Number(m.protein || 0);
    totals.carbs += Number(m.carbs || 0);
    totals.fats += Number(m.fats || 0);
    totals.sodium += Number(m.sodium || 0);
    totals.sugar += Number(m.sugar || 0);
  }
  return totals;
}

async function generateDailyRecommendations(userId, dateYmd) {
  if (!userId) throw new Error('missing userId');
  if (!dateYmd) throw new Error('missing date (YYYY-MM-DD)');

  const plan = await planService.getOrCreateActivePlan(userId);
  const meals = await crud.getMealsByDateRange(userId, dateYmd, dateYmd); // expects your meals CRUD exists
  const totals = sumMeals(meals);

  const recs = [];

  if (plan.max_sodium != null && totals.sodium > Number(plan.max_sodium)) {
    recs.push({
      content: `Sodium too high for ${dateYmd}. Consider lower-salt choices next meal.`,
      type: 'Medical Alert',
    });
  }

  if (plan.max_sugar != null && totals.sugar > Number(plan.max_sugar)) {
    recs.push({
      content: `Sugar above daily cap on ${dateYmd}. Prefer low-sugar options next meal.`,
      type: 'Medical Alert',
    });
  }

  if (plan.target_proteins && totals.protein < Number(plan.target_proteins) * 0.9) {
    recs.push({
      content: `Protein intake is low for ${dateYmd}. Add a protein source in the next meal.`,
      type: 'Coaching Tip',
    });
  }

  if (plan.target_calories) {
    const target = Number(plan.target_calories);
    if (totals.calories > target + 200) {
      recs.push({
        content: `Calories above target on ${dateYmd}. Make the next meal lighter.`,
        type: 'Coaching Tip',
      });
    } else if (totals.calories < target - 300) {
      recs.push({
        content: `Calories below target on ${dateYmd}. Add a small balanced snack.`,
        type: 'Coaching Tip',
      });
    }
  }

  let created = 0;
  for (const r of recs) {
    await crud.createRecommendation({
      user_id: userId,
      content: r.content,
      type: r.type,
    });
    created += 1;
  }

  return { totals, created };
}

async function listRecommendations(userId) {
  if (!userId) throw new Error('missing userId');
  return crud.getRecommendationsByUserId(userId);
}

async function markRecommendationAsRead(recommendationId) {
  if (!recommendationId) throw new Error('missing recommendationId');
  return crud.markRecommendationAsRead(recommendationId);
}

module.exports = {
  generateDailyRecommendations,
  listRecommendations,
  markRecommendationAsRead,
};