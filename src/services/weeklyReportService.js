const crud = require('../persistence/crud');
const planService = require('./planService');

function toYmd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(dateYmd, n) {
  const d = new Date(dateYmd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

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

function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = Number(heightCm) / 100;
  if (!h) return null;
  const val = Number(weightKg) / (h * h);
  return Math.round(val * 10) / 10;
}

async function generateWeeklyReport(userId, weekStartYmd) {
  if (!userId) throw new Error('missing userId');
  if (!weekStartYmd) throw new Error('missing weekStartYmd');

  const weekEndYmd = addDays(weekStartYmd, 6);

  const user = await crud.getUserById(userId);
  const plan = await planService.getOrCreateActivePlan(userId);

  //meal collector per day
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStartYmd, i);
    const meals = await crud.getMealsByDateRange(userId, day, day);
    const totals = sumMeals(meals);
    days.push({ day, totals });
  }

  
  let sumCalories = 0;
  let sumProtein = 0;
  let sumCarbs = 0;
  let sumFats = 0;
  let sodiumOverCapDays = 0;
  let sugarOverCapDays = 0;
  let proteinAdequateDays = 0;
  let caloriesWithinBandDays = 0;

  for (const d of days) {
    const t = d.totals;
    sumCalories += t.calories;
    sumProtein += t.protein;
    sumCarbs += t.carbs;
    sumFats += t.fats;

    if (plan.max_sodium != null && t.sodium > Number(plan.max_sodium)) {
      sodiumOverCapDays += 1;
    }
    if (plan.max_sugar != null && t.sugar > Number(plan.max_sugar)) {
      sugarOverCapDays += 1;
    }

    if (plan.target_proteins && t.protein >= Number(plan.target_proteins) * 0.9) {
      proteinAdequateDays += 1;
    }

    if (plan.target_calories) {
      const target = Number(plan.target_calories);
      if (t.calories >= target - 300 && t.calories <= target + 200) {
        caloriesWithinBandDays += 1;
      }
    }
  }

  const avgCalories = Math.round(sumCalories / 7);

  //weight/bmi
  const startWeight = user.weight ? Number(user.weight) : null;
  const endWeight = startWeight; 
  const startBmi = bmi(startWeight, user.height);
  const endBmi = bmi(endWeight, user.height);

  const nutritional_summary = {
    avg_calories: avgCalories,
    protein_sum: Math.round(sumProtein),
    carbs_sum: Math.round(sumCarbs),
    fats_sum: Math.round(sumFats),
    sodium_over_cap_days: sodiumOverCapDays,
    sugar_over_cap_days: sugarOverCapDays,
    protein_adequate_days: proteinAdequateDays,
    calories_within_band_days: caloriesWithinBandDays,
  };

  let performance_notes = null;
  const profile = (user.profile_type || '').toLowerCase();
  if (profile.includes('athlete')) {
    performance_notes = `Protein adequate on ${proteinAdequateDays}/7 days; carbs sum ${Math.round(sumCarbs)}g this week.`;
  } else if (profile.includes('diabetes')) {
    performance_notes = `Sugar over cap on ${sugarOverCapDays}/7 days; consider lower-sugar swaps.`;
  } else if (profile.includes('weight_loss')) {
    performance_notes = `Avg calories ${avgCalories} kcal; stayed near target on ${caloriesWithinBandDays}/7 days.`;
  }

  const weight_evolution = {
    start_weight: startWeight,
    end_weight: endWeight,
    start_bmi: startBmi,
    end_bmi: endBmi,
  };

  const reportId = await crud.createWeeklyReport({
    user_id: userId,
    week_start_date: weekStartYmd,
    week_end_date: weekEndYmd,
    nutritional_summary: JSON.stringify(nutritional_summary),
    weight_evolution: JSON.stringify(weight_evolution),
    performance_notes,
  });

  return {
    report_id: reportId,
    user_id: userId,
    week_start_date: weekStartYmd,
    week_end_date: weekEndYmd,
    nutritional_summary,
    weight_evolution,
    performance_notes,
  };
}

async function listWeeklyReports(userId) {
  if (!userId) throw new Error('missing userId');
  return crud.getWeeklyReportsByUserId(userId);
}

module.exports = {
  generateWeeklyReport,
  listWeeklyReports,
};


