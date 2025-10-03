const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { errorHandler } = require('./utils/errorHandler');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 9000;

app.set('views', path.join(__dirname, 'ui', 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'ui', 'public')));


app.use(session({
  secret: process.env.SESSION_SECRET || 'osama',
  resave: false,
  saveUninitialized: true
}));

// routers
const authRouter = require('./ui/routes/authRoutes');
const dashboardRoutes = require('./ui/routes/dashboardRoutes');
const mealsRoutes = require('./ui/routes/mealsRoutes');
const planRoutes = require('./ui/routes/planRoutes');
const reportsRoutes = require('./ui/routes/reportsRoutes');
const profileRoutes = require('./ui/routes/profileRoutes');

app.use('/auth', authRouter);
app.use('/', dashboardRoutes);
app.use('/', mealsRoutes);
app.use('/', planRoutes);
app.use('/', reportsRoutes);
app.use('/', profileRoutes);

// Test routes (development only)
if (process.env.NODE_ENV === 'development') {
  const testRoutes = require('./ui/routes/testRoutes');
  app.use('/', testRoutes);
}

// landing
app.get('/', (req, res) => res.redirect('/dashboard'));

// Error handling middleware
app.use(errorHandler);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).render('error/404');
});

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(port, () => {
  console.log(`app is running on port : http://localhost:${port}`);
});
