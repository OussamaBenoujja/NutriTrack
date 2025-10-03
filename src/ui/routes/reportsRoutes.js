
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
    console.log('[REPORTS] full recompute start');
    const existing = await crud.getWeeklyReportsByUserId(req.session.user_id);
    const recomputed = [];
    for (const r of existing) {
      try {
        const rawStart = r.week_start_date;
        let weekStartYmd;
        if (rawStart instanceof Date) weekStartYmd = rawStart.toISOString().slice(0,10);
        else if (typeof rawStart === 'string') weekStartYmd = rawStart.slice(0,10);
        else weekStartYmd = new Date(rawStart).toISOString().slice(0,10);
        const updated = await weeklyReportService.recomputeAndUpdateReport(req.session.user_id, weekStartYmd, r);
        recomputed.push(updated);
      } catch (inner) {
        console.error('[REPORTS] recompute failed', r.week_start_date, inner.message);
        // fallback: push original row
        recomputed.push({
          report_id: r.report_id,
          week_start_date: r.week_start_date,
          week_end_date: r.week_end_date,
          nutritional_summary: typeof r.nutritional_summary === 'string' ? (function(s){ try { return JSON.parse(s); } catch{return {}; } })(r.nutritional_summary) : (r.nutritional_summary || {})
        });
      }
    }
    // Sort descending by week_start_date
    recomputed.sort((a,b)=> (b.week_start_date||'').localeCompare(a.week_start_date||''));
    const reports = recomputed.map(r => {
      const summary = r.nutritional_summary;
      const summaryObj = summary && typeof summary === 'object' ? summary : null;
      const jsonStr = summaryObj ? JSON.stringify(summaryObj) : (typeof summary === 'string' ? summary : null);
      let parsed = summaryObj;
      if (!parsed && jsonStr) { try { parsed = JSON.parse(jsonStr); } catch(_) { parsed = {}; } }
      if (parsed) {
        if (parsed.protein_sum!=null && parsed.avg_protein==null) parsed.avg_protein = Math.round(parsed.protein_sum/7);
        if (parsed.carbs_sum!=null && parsed.avg_carbs==null) parsed.avg_carbs = Math.round(parsed.carbs_sum/7);
        if (parsed.fats_sum!=null && parsed.avg_fats==null) parsed.avg_fats = Math.round(parsed.fats_sum/7);
        if (parsed.sodium_over_cap_days!=null && parsed.sodium_alerts==null) parsed.sodium_alerts = parsed.sodium_over_cap_days;
      }
      return {
        ...r,
        week_start_ymd: r.week_start_date,
        summary_json: jsonStr,
        _summary_object: parsed
      };
    });
    console.log('[REPORTS] full recompute done', reports.length);
    res.render('reports/weekly', { reports, message: null });
  } catch (e) {
    console.error(e);
    res.status(500).render('404');
  }
});

router.get('/reports', requireAuth, (req, res) => {
  return res.redirect('/reports/weekly');
});


router.post('/reports/weekly/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const weekStart = (req.body.week_start || '').trim() || currentWeekStartYmd();
    await weeklyReportService.generateWeeklyReport(userId, weekStart);
    res.redirect('/reports/weekly');
  } catch (e) {
    console.error(e);
    res.status(500).render('404');
  }
});

module.exports = router;
