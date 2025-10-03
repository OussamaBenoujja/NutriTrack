
const express = require('express');
const router = express.Router();
const crud = require('../../persistence/crud');
const planService = require('../../services/planService');
const { updateUserProfile } = require('../../services/coreServices');


function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await crud.getUserById(req.session.user_id);
    if (!user) return res.redirect('/auth/login');
    const message = req.query.updated ? 'Profile updated successfully' : null;
    res.render('profile/index', { user, message });
  } catch (e) {
    res.status(500).render('profile/index', { user: null, message: 'Failed to load profile' });
  }
});

router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Transform incoming fields: treat empty strings as "no change"
    const incoming = {};
    const raw = req.body || {};

    const copyIfProvided = (key, transform = v => v) => {
      if (raw[key] !== undefined && raw[key] !== '') {
        incoming[key] = transform(raw[key]);
      }
    };

    copyIfProvided('first_name', v => String(v).trim());
    copyIfProvided('last_name', v => String(v).trim());
    copyIfProvided('birth_date', v => String(v)); // expect YYYY-MM-DD
    copyIfProvided('weight', v => Number(v));
    copyIfProvided('height', v => Number(v));
    copyIfProvided('activity_level', v => String(v).trim());
    copyIfProvided('health_conditions', v => String(v).trim());
    copyIfProvided('profile_type', v => String(v).trim());
    copyIfProvided('description', v => String(v).trim());

    // Validate numeric inputs if supplied
    if (incoming.weight !== undefined && (isNaN(incoming.weight) || incoming.weight <= 0)) {
      throw new Error('INVALID_WEIGHT');
    }
    if (incoming.height !== undefined && (isNaN(incoming.height) || incoming.height <= 0)) {
      throw new Error('INVALID_HEIGHT');
    }

    await updateUserProfile(userId, incoming);
    await planService.getOrCreateActivePlan(userId);
    return res.redirect('/profile?updated=1');
  } catch (e) {
    // Attempt to re-render with an error message for better UX
    try {
      const user = await crud.getUserById(req.session.user_id);
      let message = 'Failed to update profile';
      if (e && e.message === 'INVALID_WEIGHT') message = 'Please provide a valid positive weight';
      else if (e && e.message === 'INVALID_HEIGHT') message = 'Please provide a valid positive height';
      res.status(500).render('profile/index', { user, message });
    } catch (_) {
      res.status(500).send('Failed to update profile');
    }
  }
});

module.exports = router;
