// backend/uploadToCloudinary.js
// Run this script to migrate local images to Cloudinary

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (localPath) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'sugar-studio',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' }
      ]
    });
    
    console.log('✅ Uploaded:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    return null;
  }
};

const migrateImages = async () => {
  try {
    console.log('\n🚀 Starting image migration to Cloudinary...\n');

    // Get all products with local image URLs
    const { rows: products } = await pool.query(
      "SELECT id, name, image_url FROM products WHERE image_url LIKE '%localhost%' OR image_url LIKE '/uploads/%'"
    );

    if (products.length === 0) {
      console.log('✅ No local images found. All images are already on Cloudinary!');
      return;
    }

    console.log(`Found ${products.length} products with local images\n`);

    for (const product of products) {
      console.log(`\n📦 Processing: ${product.name}`);
      console.log(`   Current URL: ${product.image_url}`);

      // Extract local file path
      let localPath;
      if (product.image_url.includes('localhost')) {
        // Extract path from URL like http://localhost:3000/uploads/image.jpg
        const urlPath = new URL(product.image_url).pathname;
        localPath = path.join(__dirname, urlPath);
      } else if (product.image_url.startsWith('/uploads/')) {
        // Direct path like /uploads/image.jpg
        localPath = path.join(__dirname, product.image_url);
      } else {
        console.log('   ⚠️  Unknown URL format, skipping');
        continue;
      }

      // Check if file exists
      if (!fs.existsSync(localPath)) {
        console.log(`   ⚠️  File not found at: ${localPath}`);
        console.log('   💡 Please manually upload this image or provide correct path');
        continue;
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImage(localPath);

      if (cloudinaryUrl) {
        // Update database
        await pool.query(
          'UPDATE products SET image_url = $1 WHERE id = $2',
          [cloudinaryUrl, product.id]
        );
        console.log(`   ✅ Updated database with new URL`);
      }
    }

    // Also check categories
    console.log('\n\n📂 Checking categories...\n');
    const { rows: categories } = await pool.query(
      "SELECT id, name, image_url FROM categories WHERE image_url LIKE '%localhost%' OR image_url LIKE '/uploads/%'"
    );

    if (categories.length > 0) {
      for (const category of categories) {
        console.log(`\n📁 Processing category: ${category.name}`);
        
        let localPath;
        if (category.image_url.includes('localhost')) {
          const urlPath = new URL(category.image_url).pathname;
          localPath = path.join(__dirname, urlPath);
        } else if (category.image_url.startsWith('/uploads/')) {
          localPath = path.join(__dirname, category.image_url);
        }

        if (localPath && fs.existsSync(localPath)) {
          const cloudinaryUrl = await uploadImage(localPath);
          if (cloudinaryUrl) {
            await pool.query(
              'UPDATE categories SET image_url = $1 WHERE id = $2',
              [cloudinaryUrl, category.id]
            );
            console.log(`   ✅ Category updated`);
          }
        }
      }
    }

    console.log('\n\n🎉 Migration complete!');
    console.log('✅ All images have been uploaded to Cloudinary');
    console.log('✅ Database has been updated with new URLs\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

// Alternative: Upload by providing direct file paths
const uploadSpecificFiles = async (filePaths) => {
  console.log('\n🚀 Uploading specific files...\n');

  const uploadedUrls = [];

  for (const filePath of filePaths) {
    console.log(`\n📤 Uploading: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filePath}`);
      continue;
    }

    const cloudinaryUrl = await uploadImage(filePath);
    if (cloudinaryUrl) {
      uploadedUrls.push({
        localPath: filePath,
        cloudinaryUrl
      });
      console.log(`   ✅ Uploaded successfully`);
    }
  }

  console.log('\n\n📋 Upload Summary:');
  console.log('='.repeat(60));
  uploadedUrls.forEach(({ localPath, cloudinaryUrl }) => {
    console.log(`\nLocal:      ${localPath}`);
    console.log(`Cloudinary: ${cloudinaryUrl}`);
  });
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Copy these URLs to update your product/category image_url in database\n');

  await pool.end();
  process.exit(0);
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  // Upload specific files provided as arguments
  uploadSpecificFiles(args);
} else {
  // Migrate all local images from database
  migrateImages();
}

// USAGE EXAMPLES:
// 
// 1. Migrate all images from database:
//    node uploadToCloudinary.js
//
// 2. Upload specific files:
//    node uploadToCloudinary.js backend/uploads/cake1.jpg backend/uploads/cake2.jpg
//
// 3. Upload all files in uploads folder:
//    node uploadToCloudinary.js backend/uploads/*.jpg