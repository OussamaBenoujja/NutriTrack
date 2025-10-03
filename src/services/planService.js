const crud = require('../persistence/crud');

function hasCondition(health_conditions, keyword) {
  if (!health_conditions) return false;
  const s = String(health_conditions).toLowerCase();
  return s.includes(keyword.toLowerCase());
}

function computePlanTargetsFromUser(user) {
  const weight = user.weight ? Number(user.weight) : null;
  const baseCalories = weight ? Math.round(weight * 30) : 2000;

  let target_calories = baseCalories;
  let pPct = 0.20, cPct = 0.50, fPct = 0.30;

  const profile = (user.profile_type || '').toLowerCase();
  if (profile.includes('weight_loss')) {
    target_calories = Math.max(1200, baseCalories - 300);
    pPct = 0.25; cPct = 0.45; fPct = 0.30;
  } else if (profile.includes('athlete')) {
    target_calories = baseCalories;
    pPct = 0.25; cPct = 0.50; fPct = 0.25;
  } else if (profile.includes('diabetes')) {
    target_calories = baseCalories;
    pPct = 0.25; cPct = 0.40; fPct = 0.35;
  }

  const protein = Math.round((target_calories * pPct) / 4);
  const carbs = Math.round((target_calories * cPct) / 4);
  const fats = Math.round((target_calories * fPct) / 9);

  let max_sodium = null;
  let max_sugar = null;

  if (hasCondition(user.health_conditions, 'hypertension')) {
    max_sodium = 1500;
  }
  if (hasCondition(user.health_conditions, 'diabetes')) {
    max_sugar = 30;
  }

  return {
    target_calories,
    target_proteins: protein,
    target_carbs: carbs,
    target_fats: fats,
    max_sodium,
    max_sugar,
  };
}

async function getOrCreateActivePlan(userId) {
  const user = await crud.getUserById(userId);
  if (!user) {
    const err = new Error('user not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const existing = await crud.getActivePlanByUserId(userId);
  if (existing) return existing;

  const t = computePlanTargetsFromUser(user);
  const planData = {
    user_id: userId,
    target_calories: t.target_calories,
    target_proteins: t.target_proteins,
    target_carbs: t.target_carbs,
    target_fats: t.target_fats,
    max_sodium: t.max_sodium,
    max_sugar: t.max_sugar,
    start_date: new Date().toISOString().slice(0, 10),
    is_active: 1,
  };
  const planId = await crud.createPlan(planData);
  return { plan_id: planId, ...planData };
}

function sumDayTotals(meals) {
  const totals = {
    calories: 0, protein: 0, carbs: 0, fats: 0, sodium: 0, sugar: 0,
  };
  for (const m of meals) {
    totals.calories += Number(m.calories || 0);
    totals.protein += Number(m.protein || 0);
    totals.carbs += Number(m.carbs || 0);
    totals.fats += Number(m.fats || 0);
    totals.sodium += Number(m.sodium || 0);
    totals.sugar += Number(m.sugar || 0);
  }
  return totals;
}

async function evaluateDayAndRecommend(userId, dateYmd) {
  const plan = await getOrCreateActivePlan(userId);
  const meals = await crud.getMealsByDateRange(userId, dateYmd, dateYmd);
  const totals = sumDayTotals(meals);

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

  for (const r of recs) {
    await crud.createRecommendation({
      user_id: userId,
      content: r.content,
      type: r.type,
    });
  }

  return { plan, totals, recommendations_created: recs.length };
}

module.exports = {
  computePlanTargetsFromUser,
  getOrCreateActivePlan,
  evaluateDayAndRecommend,
};
