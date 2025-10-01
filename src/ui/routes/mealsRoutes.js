
const express = require('express');
const router = express.Router();
const path = require('path');
const multer  = require('multer');
const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const crud = require('../../persistence/crud');
const mealImageService = require('../../services/mealImageService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/meals', requireAuth, async (req, res) => {
  try {
    const ymd = todayYmd();
    const meals = await crud.getMealsByDateRange(req.session.user_id, ymd, ymd);
    res.render('meals/index', { date: ymd, meals });
  } catch (e) {
    res.status(500).render('404');
  }
});

router.post('/meals/analyze-image', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) return res.redirect('/meals');
    await mealImageService.analyzeMealImage(req.session.user_id, filePath);
    res.redirect('/meals');
  } catch (e) {
    res.status(500).render('404');
  }
});

router.post('/meals/create-manual', requireAuth, async (req, res) => {
  try {
    const ymd = todayYmd();
    await crud.createMeal({
      user_id: req.session.user_id,
      eaten_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      source: 'manual',
      calories: Number(req.body.calories || 0),
      protein: Number(req.body.protein || 0),
      carbs: Number(req.body.carbs || 0),
      fats: Number(req.body.fats || 0),
      sodium: Number(req.body.sodium || 0),
      sugar: Number(req.body.sugar || 0),
      gi_estimate: null,
      photo_path: null,
      analysis_json: null,
    });
    res.redirect('/meals');
  } catch (e) {
    res.status(500).render('404');
  }
});

module.exports = router;
