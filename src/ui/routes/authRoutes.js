const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');

//render login page
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        error: null,
        title: 'Login - NutriPack',
        pageTitle: 'Welcome Back',
        pageSubtitle: 'Please sign in to your account',
        rightPanelTitle: 'Welcome Back to NutriPack',
        rightPanelSubtitle: 'Track your nutrition and make healthier choices with our AI-powered food analysis.'
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    if (user) {
        req.session.user = user; 
        res.redirect('/dashboard');
    } else {
        res.render('auth/login', { 
            error: 'Invalid email or password',
            title: 'Login - NutriPack',
            pageTitle: 'Welcome Back',
            pageSubtitle: 'Please sign in to your account',
            rightPanelTitle: 'Welcome Back to NutriPack',
            rightPanelSubtitle: 'Track your nutrition and make healthier choices with our AI-powered food analysis.'
        });
    }
});

//render register page
router.get('/register', (req, res) => {
    res.render('auth/register', { 
        error: null,
        title: 'Register - NutriPack',
        pageTitle: 'Create Account',
        pageSubtitle: 'Join NutriPack and start tracking your nutrition',
        rightPanelTitle: 'Start Your Nutrition Journey',
        rightPanelSubtitle: 'Join thousands of users who are already making healthier choices with NutriPack.'
    });
});

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    
    // Validate password confirmation
    if (password !== confirmPassword) {
        return res.render('auth/register', { 
            error: 'Passwords do not match',
            title: 'Register - NutriPack',
            pageTitle: 'Create Account',
            pageSubtitle: 'Join NutriPack and start tracking your nutrition',
            rightPanelTitle: 'Start Your Nutrition Journey',
            rightPanelSubtitle: 'Join thousands of users who are already making healthier choices with NutriPack.'
        });
    }
    
    try {
        const fullName = `${firstName} ${lastName}`.trim();
        const user = await authService.register(email, password, fullName);
        req.session.user = user;
        res.redirect('/dashboard');
    } catch (error) {
        res.render('auth/register', { 
            error: error.message,
            title: 'Register - NutriPack',
            pageTitle: 'Create Account',
            pageSubtitle: 'Join NutriPack and start tracking your nutrition',
            rightPanelTitle: 'Start Your Nutrition Journey',
            rightPanelSubtitle: 'Join thousands of users who are already making healthier choices with NutriPack.'
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

module.exports = router;