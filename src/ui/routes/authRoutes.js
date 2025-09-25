const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');

//render login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    if (user) {
        req.session.user = user; 
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid email or password' });
    }
});



module.exports = router;
