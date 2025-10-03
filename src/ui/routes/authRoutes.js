const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');

router.get('/signup', (req, res) => {
  if (req.session && (req.session.user_id || req.session.user)) {
    return res.redirect('/dashboard');
  }
  res.render('auth/signup', { 
    error: null, 
    values: {} 
  });
});

router.post('/signup', async (req, res) => {
  const {
    first_name, last_name, email, password,
    birth_date, weight, height, activity_level,
    health_conditions, profile_type, description
  } = req.body;

  if (!first_name || !last_name || !email || !password || !profile_type) {
    return res.status(400).render('auth/signup', { 
      error: 'Missing required fields', 
      values: req.body,
      toast: 'error',
      toastTitle: 'Signup Failed',
      toastMessage: 'Please fill in all required fields'
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

    req.session.user_id = user.user_id;
    req.session.user = user;

    return res.redirect('/dashboard?toast=success&toastTitle=Welcome&toastMessage=Account created successfully!');
  } catch (err) {
    const msg = err.code === 'EMAIL_EXISTS' ? 'Email already in use' : 'Signup failed';
    return res.status(400).render('auth/signup', { 
      error: msg, 
      values: req.body,
      toast: 'error',
      toastTitle: 'Signup Failed',
      toastMessage: msg
    });
  }
});

router.get('/login', (req, res) => {
  if (req.session && (req.session.user_id || req.session.user)) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    error: null 
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('auth/login', { 
      error: 'Email and password are required',
      toast: 'error',
      toastTitle: 'Login Failed',
      toastMessage: 'Email and password are required'
    });
  }

  try {
    const user = await authService.login({ email, password });

    req.session.user_id = user.user_id;
    req.session.user = user;

    return res.redirect('/dashboard?toast=success&toastTitle=Welcome Back&toastMessage=You have successfully logged in!');
  } catch (err) {
    const msg = (err.code === 'USER_NOT_FOUND' || err.code === 'INVALID_PASSWORD')
      ? 'Invalid email or password'
      : 'Login failed';
    return res.status(401).render('auth/login', { 
      error: msg,
      toast: 'error',
      toastTitle: 'Login Failed',
      toastMessage: msg
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login?toast=info&toastTitle=Logged Out&toastMessage=You have been successfully logged out');
  });
});

module.exports = router;
