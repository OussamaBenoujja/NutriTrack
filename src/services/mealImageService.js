const fs = require('fs');
const path = require('path');
const crud = require('../persistence/crud');
const planService = require('./planService');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const imageOptimization = require('./imageOptimizationService');

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

  console.log('image analysis started!!');

  if (!userId) throw new Error('missing userId');
  if (!imagePath) throw new Error('missing imagePath');

  const user = await crud.getUserById(userId);
  if (!user) throw new Error('user not found');

  // Validate and optimize the image
  console.log('Validating image...');
  const validation = await imageOptimization.validateImage(imagePath);
  if (!validation.valid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }

  // Create optimized version
  const optimizedPath = imagePath.replace(/(\.[^.]+)$/, '_optimized$1');
  console.log('Optimizing image...');
  const optimization = await imageOptimization.optimizeImage(imagePath, optimizedPath, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85
  });

  if (!optimization.success) {
    console.warn('Image optimization failed, using original:', optimization.error);
  } else {
    console.log(`Image optimized: ${optimization.compressionRatio}% size reduction`);
    // Use optimized image for analysis
    imagePath = optimizedPath;
  }

  const bytes = fs.readFileSync(imagePath);
  const b64 = Buffer.from(bytes).toString('base64');
  const mime = getMimeType(imagePath);

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
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
        { type: 'text', text: `Identify foods and estimate nutrients for this user profile: ${JSON.stringify(profileInfo)}. Return ONLY JSON matching this shape and also make sure not to add  backticks pure output directly NO : ${schemaHint}` },
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

  console.log(text);
  let clean = text.replace(/```json|```/g, '').trim();
  console.log(clean);
  let parsed;
  try {
    parsed = JSON.parse(clean);
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

  // Clean up temporary optimized file if it exists
  if (optimization.success && fs.existsSync(optimizedPath)) {
    try {
      fs.unlinkSync(optimizedPath);
      console.log('Cleaned up temporary optimized file');
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError.message);
    }
  }

  const evalRes = await planService.evaluateDayAndRecommend(userId, ymd);
  console.log({ meal_id: mealId, totals, recommendations_created: evalRes.recommendations_created });
  return { meal_id: mealId, totals, recommendations_created: evalRes.recommendations_created };
}

module.exports = {
  analyzeMealImage,
};