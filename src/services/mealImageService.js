const fs = require('fs');
const path = require('path');
const crud = require('../persistence/crud');
const planService = require('./planService');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

function getMimeType(p) {
  const ext = path.extname(p).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/jpeg';
}

function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

async function analyzeMealImage(userId, imagePath) {
  if (!userId) throw new Error('missing userId');
  if (!imagePath) throw new Error('missing imagePath');

  const user = await crud.getUserById(userId);
  if (!user) throw new Error('user not found');

  const bytes = fs.readFileSync(imagePath);
  const b64 = Buffer.from(bytes).toString('base64');
  const mime = getMimeType(imagePath);

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const schemaHint = JSON.stringify({
    items: [{ name: 'string', quantity: 'number', unit: 'string', calories: 'number', protein: 'number', carbs: 'number', fats: 'number', sodium: 'number', sugar: 'number' }],
    totals: { calories: 'number', protein: 'number', carbs: 'number', fats: 'number', sodium: 'number', sugar: 'number' },
  });

  const profileInfo = {
    profile_type: user.profile_type || '',
    health_conditions: user.health_conditions || '',
  };

  const res = await model.invoke([
    {
      role: 'user',
      content: [
        { type: 'text', text: `Identify foods and estimate nutrients for this user profile: ${JSON.stringify(profileInfo)}. Return ONLY JSON matching this shape: ${schemaHint}` },
        { type: 'media', mimeType: mime, data: b64 },
      ],
    },
  ]);

  let text = '';
  if (typeof res.content === 'string') {
    text = res.content;
  } else if (Array.isArray(res.content)) {
    text = res.content.map(p => (typeof p === 'string' ? p : p?.text || '')).join(' ').trim();
  } else {
    text = String(res.content || '');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { items: [], totals: {} };
  }

  const t = parsed.totals || {};
  const totals = {
    calories: toNumber(t.calories),
    protein: toNumber(t.protein),
    carbs: toNumber(t.carbs),
    fats: toNumber(t.fats),
    sodium: toNumber(t.sodium),
    sugar: toNumber(t.sugar),
  };

  const eatenAt = new Date();
  const ymd = eatenAt.toISOString().slice(0, 10);

  const mealId = await crud.createMeal({
    user_id: userId,
    eaten_at: eatenAt.toISOString().slice(0, 19).replace('T', ' '),
    source: 'image',
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fats: totals.fats,
    sodium: totals.sodium,
    sugar: totals.sugar,
    gi_estimate: null,
    photo_path: imagePath,
    analysis_json: JSON.stringify(parsed),
  });

  const evalRes = await planService.evaluateDayAndRecommend(userId, ymd);

  return { meal_id: mealId, totals, recommendations_created: evalRes.recommendations_created };
}

module.exports = {
  analyzeMealImage,
};