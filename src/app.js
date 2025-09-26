const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = 9000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'ui/public')));

// Set view engine and layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'ui/views'));
app.use(expressLayouts);

// Set default layout for auth routes
app.use('/auth', (req, res, next) => {
    res.locals.layout = 'layouts/auth';
    next();
});

// Session middleware
app.use(session({
    secret: 'osama',
    resave: false,
    saveUninitialized: true,
}));

// Import routes
const authRoutes = require('./ui/routes/authRoutes');

// Use routes
app.use('/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
    res.render('index', { title: 'NutriPack - Nutrition Tracker' });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.render('dashboard', { user: req.session.user });
    } else {
        res.redirect('/auth/login');
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(port, () => {
    console.log(`app is running on port : ${port}`);
});