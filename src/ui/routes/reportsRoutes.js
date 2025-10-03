
const express = require('express');
const router = express.Router();
const crud = require('../../persistence/crud');
const weeklyReportService = require('../../services/weeklyReportService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}

function toYmd(d) {
  return d.toISOString().slice(0, 10);
}


function currentWeekStartYmd() {
  const now = new Date();
  const day = now.getDay(); 
  const diff = (day === 0 ? -6 : 1 - day); 
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return toYmd(monday);
}


router.get('/reports/weekly', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const [user, reports] = await Promise.all([
      crud.getUserById(userId),
      crud.getWeeklyReportsByUserId(userId)
    ]);
    
    res.render('reports/weekly', { 
      user, 
      reports: reports || [], 
      message: null
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('404');
  }
});


router.post('/reports/weekly/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const weekStart = (req.body.week_start || '').trim() || currentWeekStartYmd();
    await weeklyReportService.generateWeeklyReport(userId, weekStart);
    res.redirect('/reports/weekly?toast=success&toastTitle=Report Generated&toastMessage=Weekly report generated successfully!');
  } catch (e) {
    console.error(e);
    res.redirect('/reports/weekly?toast=error&toastTitle=Generation Failed&toastMessage=Failed to generate weekly report. Please try again.');
  }
});

module.exports = router;
