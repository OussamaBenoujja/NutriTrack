
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configure multer with better options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow one file
  }
});

const crud = require('../../persistence/crud');
const mealImageService = require('../../services/mealImageService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user_id) return res.redirect('/auth/login');
  next();
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/meals', requireAuth, async (req, res) => {
  try {
    const ymd = todayYmd();
    const meals = await crud.getMealsByDateRange(req.session.user_id, ymd, ymd);
    
    res.render('meals/index', { 
      date: ymd, 
      meals
    });
  } catch (e) {
    console.error('Error loading meals page:', e);
    res.status(500).render('404');
  }
});

router.post('/meals/analyze-image', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) {
      return res.redirect('/meals?toast=error&toastTitle=Upload Failed&toastMessage=No image file was uploaded. Please select an image and try again.');
    }
    
    // Validate file size (additional check)
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      fs.unlinkSync(filePath); // Clean up the file
      return res.redirect('/meals?toast=error&toastTitle=File Too Large&toastMessage=File size too large. Please upload an image smaller than 10MB.');
    }
    
    await mealImageService.analyzeMealImage(req.session.user_id, filePath);
    res.redirect('/meals?toast=success&toastTitle=Meal Analyzed&toastMessage=Meal analyzed and saved successfully!');
  } catch (e) {
    console.error('Error analyzing meal image:', e);
    
    // Clean up uploaded file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.redirect('/meals?toast=error&toastTitle=Analysis Failed&toastMessage=Failed to analyze the image. Please try again with a clearer photo.');
  }
});

router.post('/meals/create-manual', requireAuth, async (req, res) => {
  try {
    const ymd = todayYmd();
    await crud.createMeal({
      user_id: req.session.user_id,
      eaten_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      source: 'manual',
      calories: Number(req.body.calories || 0),
      protein: Number(req.body.protein || 0),
      carbs: Number(req.body.carbs || 0),
      fats: Number(req.body.fats || 0),
      sodium: Number(req.body.sodium || 0),
      sugar: Number(req.body.sugar || 0),
      gi_estimate: null,
      photo_path: null,
      analysis_json: null,
    });
    res.redirect('/meals?toast=success&toastTitle=Meal Saved&toastMessage=Meal saved successfully!');
  } catch (e) {
    console.error('Error creating manual meal:', e);
    res.redirect('/meals?toast=error&toastTitle=Save Failed&toastMessage=Failed to save meal. Please try again.');
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.redirect('/meals?toast=error&toastTitle=File Too Large&toastMessage=File too large. Please upload an image smaller than 10MB.');
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.redirect('/meals?toast=error&toastTitle=Too Many Files&toastMessage=Too many files. Please upload only one image at a time.');
    } else {
      return res.redirect('/meals?toast=error&toastTitle=Upload Error&toastMessage=Upload error: ' + error.message);
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.redirect('/meals?toast=error&toastTitle=Invalid File Type&toastMessage=Invalid file type. Only JPG, PNG, and WebP images are allowed.');
  }
  
  next(error);
});

module.exports = router;
