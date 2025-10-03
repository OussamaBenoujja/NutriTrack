const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimize and compress uploaded images
 * @param {string} inputPath - Path to the original image
 * @param {string} outputPath - Path where optimized image should be saved
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} - Optimization results
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg'
    } = options;

    // Get original image metadata
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Optimize the image
    await sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: quality })
      .toFile(outputPath);

    // Get optimized image metadata
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSize = optimizedStats.size;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

    return {
      success: true,
      originalSize,
      optimizedSize,
      compressionRatio: parseFloat(compressionRatio),
      outputPath
    };

  } catch (error) {
    console.error('Error optimizing image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate thumbnail for an image
 * @param {string} inputPath - Path to the original image
 * @param {string} outputPath - Path where thumbnail should be saved
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} - Thumbnail generation results
 */
async function generateThumbnail(inputPath, outputPath, options = {}) {
  try {
    const {
      width = 300,
      height = 300,
      quality = 80
    } = options;

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate thumbnail
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: quality })
      .toFile(outputPath);

    return {
      success: true,
      outputPath
    };

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get image metadata
 * @param {string} imagePath - Path to the image
 * @returns {Promise<Object>} - Image metadata
 */
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);
    
    return {
      success: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: stats.size,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate image file
 * @param {string} imagePath - Path to the image
 * @returns {Promise<Object>} - Validation results
 */
async function validateImage(imagePath) {
  try {
    const metadata = await getImageMetadata(imagePath);
    
    if (!metadata.success) {
      return {
        valid: false,
        error: metadata.error
      };
    }

    const { width, height, format, size } = metadata;
    
    // Check dimensions
    if (width < 100 || height < 100) {
      return {
        valid: false,
        error: 'Image too small. Minimum dimensions: 100x100 pixels'
      };
    }

    if (width > 4000 || height > 4000) {
      return {
        valid: false,
        error: 'Image too large. Maximum dimensions: 4000x4000 pixels'
      };
    }

    // Check file size (10MB limit)
    if (size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File too large. Maximum size: 10MB'
      };
    }

    // Check format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    const formatLower = format.toLowerCase();
    if (!allowedFormats.includes(formatLower)) {
      return {
        valid: false,
        error: `Unsupported format: ${format}. Allowed: JPG, PNG, WebP`
      };
    }

    return {
      valid: true,
      metadata
    };

  } catch (error) {
    console.error('Error validating image:', error);
    return {
      valid: false,
      error: 'Invalid image file'
    };
  }
}

module.exports = {
  optimizeImage,
  generateThumbnail,
  getImageMetadata,
  validateImage
};
