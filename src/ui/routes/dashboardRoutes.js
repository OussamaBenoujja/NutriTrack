
const express = require('express');
const router = express.Router();
const crud = require('../../persistence/crud');


function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
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

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const ymd = todayYmd();

    const [user, plan, meals, recs] = await Promise.all([
      crud.getUserById(userId),
      crud.getActivePlanByUserId(userId),
      crud.getMealsByDateRange(userId, ymd, ymd),
      crud.getRecommendationsByUserId(userId),
    ]);

    const totals = sumMeals(meals);

    res.render('dashboard/index', {
      user,
      plan,
      date: ymd,
      totals,
      recommendations: recs || []
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('404');
  }
});

module.exports = router;
