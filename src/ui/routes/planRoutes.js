const express = require('express');
const router = express.Router();
const planService = require('../../services/planService');


function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}


async function ensureActivePlan(req, res, next) {
  try {
    
    if (!req.session || !req.session.user_id) return next();
    
    const plan = await planService.getOrCreateActivePlan(req.session.user_id);
    
    req.activePlan = plan;
    next();
  } catch (e) {
    console.error('ensureActivePlan failed:', e);
    
    next();
  }
}

router.use(['/dashboard', '/meals', '/reports', '/profile'], requireAuth, ensureActivePlan);

router.post('/plan/ensure', requireAuth, async (req, res) => {
  try {
    await planService.getOrCreateActivePlan(req.session.user_id);
    const back = (req.body.redirect || '/plan').trim();
    res.redirect(back + '?toast=success&toastTitle=Plan Updated&toastMessage=Your nutrition plan has been refreshed!');
  } catch (e) {
    console.error(e);
    res.redirect('/dashboard?toast=error&toastTitle=Plan Error&toastMessage=Failed to update your nutrition plan');
  }
});

router.post('/plan/refresh-after-profile', requireAuth, async (req, res) => {
  try {
    await planService.getOrCreateActivePlan(req.session.user_id);
    const back = (req.body.redirect || '/profile').trim();
    res.redirect(back + '?toast=success&toastTitle=Plan Updated&toastMessage=Your nutrition plan has been refreshed!');
  } catch (e) {
    console.error(e);
    res.redirect('/profile?toast=error&toastTitle=Plan Error&toastMessage=Failed to update your nutrition plan');
  }
});

module.exports = router;