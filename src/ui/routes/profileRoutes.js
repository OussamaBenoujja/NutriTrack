
const express = require('express');
const router = express.Router();
const crud = require('../../persistence/crud');
const planService = require('../../services/planService');


function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await crud.getUserById(req.session.user_id);
    if (!user) return res.redirect('/auth/login');
    
    res.render('profile/index', { 
      user, 
      message: null
    });
  } catch (e) {
    res.status(500).render('profile/index', { 
      user: null, 
      message: 'Failed to load profile'
    });
  }
});

router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const data = {
      first_name: req.body.first_name || null,
      last_name: req.body.last_name || null,
      birth_date: req.body.birth_date || null,
      weight: req.body.weight || null,
      height: req.body.height || null,
      activity_level: req.body.activity_level || null,
      health_conditions: req.body.health_conditions || null,
      profile_type: req.body.profile_type || null,
      description: req.body.description || null,
    };
    await crud.updateUser(userId, data);
    
    await planService.getOrCreateActivePlan(userId);
    res.redirect('/profile?toast=success&toastTitle=Profile Updated&toastMessage=Your profile has been updated successfully!');
  } catch (e) {
    res.redirect('/profile?toast=error&toastTitle=Update Failed&toastMessage=Failed to update profile. Please try again.');
  }
});

module.exports = router;
