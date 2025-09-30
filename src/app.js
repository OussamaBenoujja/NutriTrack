


const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
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

const authRouter = require('./ui/routes/authRoutes');
// const dashboardRouter = require('./ui/routes/dashboard'); 

app.use('/auth', authRouter);
// app.use('/dashboard', dashboardRouter);

app.get('/', (req, res) => res.redirect('/auth/login'));

app.use((req, res) => res.status(404).render('404'));

app.listen(port, () => {
  console.log(`app is running on port : http://localhost:${port}`);
});
