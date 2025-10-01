const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');



//SignUp 
router.get('/signup', (req, res) => {
  res.render('signup', { error: null, values: {} });
});


router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password, birth_date, weight, height, activity_level, health_conditions, profile_type, description } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).render('signup', { error: 'Missing required fields', values: req.body });
  }

  try {
    const user = await authService.register({
      first_name,
      last_name,
      email,
      password,
      birth_date: birth_date || null,
      weight: weight || null,
      height: height || null,
      activity_level: activity_level || null,
      health_conditions: health_conditions || null,
      profile_type: profile_type || null,
      description: description || null
    });

    req.session.user = user;
    return res.redirect('/dashboard');
  } catch (err) {
    const msg = err.code === 'EMAIL_EXISTS' ? 'Email already in use' : 'Signup failed';
    return res.status(400).render('signup', { error: msg, values: req.body });
  }
});



//Login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', { error: 'Email and password are required' });
  }

  try {
    const user = await authService.login({ email, password });
    req.session.user = user;
    return res.redirect('/dashboard');
  } catch (err) {
    const msg = err.code === 'USER_NOT_FOUND' || err.code === 'INVALID_PASSWORD'
      ? 'Invalid email or password'
      : 'Login failed';
    return res.status(401).render('login', { error: msg });
  }
});

//LogOut
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
