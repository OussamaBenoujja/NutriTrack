const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');



//SignUp 
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Register - NutriTrack',
    pageTitle: 'Create Your Account',
    pageSubtitle: 'Join NutriTrack and start your healthy journey today.',
    error: null, 
    values: {} 
  });
});


router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, birth_date, weight, height, activity_level, health_conditions, profile_type, description } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).render('auth/register', { 
      title: 'Register - NutriTrack',
      pageTitle: 'Create Your Account',
      pageSubtitle: 'Join NutriTrack and start your healthy journey today.',
      error: 'Missing required fields', 
      values: req.body 
    });
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
    const msg = err.code === 'EMAIL_EXISTS' ? 'Email already in use' : 'Registration failed';
    return res.status(400).render('auth/register', { 
      title: 'Register - NutriTrack',
      pageTitle: 'Create Your Account',
      pageSubtitle: 'Join NutriTrack and start your healthy journey today.',
      error: msg, 
      values: req.body 
    });
  }
});



//Login
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login - NutriTrack',
    pageTitle: 'Welcome Back',
    pageSubtitle: 'Sign in to your account to continue.',
    error: null 
  });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('auth/login', { 
      title: 'Login - NutriTrack',
      pageTitle: 'Welcome Back',
      pageSubtitle: 'Sign in to your account to continue.',
      error: 'Email and password are required' 
    });
  }

  try {
    const user = await authService.login({ email, password });
    req.session.user = user;
    return res.redirect('/dashboard');
  } catch (err) {
    const msg = err.code === 'USER_NOT_FOUND' || err.code === 'INVALID_PASSWORD'
      ? 'Invalid email or password'
      : 'Login failed';
    return res.status(401).render('auth/login', { 
      title: 'Login - NutriTrack',
      pageTitle: 'Welcome Back',
      pageSubtitle: 'Sign in to your account to continue.',
      error: msg 
    });
  }
});

//LogOut
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
