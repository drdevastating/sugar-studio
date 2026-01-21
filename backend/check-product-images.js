// backend/scripts/check-product-images.js
// Run this to see what image URLs are in your database

const pool = require('./config/database');

const checkProductImages = async () => {
  try {
    console.log('🔍 Checking product images in database...\n');
    
    const result = await pool.query(
      'SELECT id, name, image_url FROM products ORDER BY id'
    );
    
    console.log(`Found ${result.rows.length} products:\n`);
    
    result.rows.forEach(product => {
      const isCloudinary = product.image_url?.includes('cloudinary.com');
      const isLocal = product.image_url?.startsWith('/uploads');
      const status = isCloudinary ? '✅ Cloudinary' : isLocal ? '⚠️ Local' : '❌ Invalid';
      
      console.log(`[${product.id}] ${product.name}`);
      console.log(`    ${status}: ${product.image_url || 'NULL'}\n`);
    });
    
    const cloudinaryCount = result.rows.filter(p => p.image_url?.includes('cloudinary.com')).length;
    const localCount = result.rows.filter(p => p.image_url?.startsWith('/uploads')).length;
    const invalidCount = result.rows.length - cloudinaryCount - localCount;
    
    console.log('📊 Summary:');
    console.log(`✅ Cloudinary URLs: ${cloudinaryCount}`);
    console.log(`⚠️ Local URLs: ${localCount}`);
    console.log(`❌ Invalid/NULL: ${invalidCount}`);
    
    if (localCount > 0 || invalidCount > 0) {
      console.log('\n⚠️ WARNING: Some products have local or invalid image URLs!');
      console.log('These images will NOT load in production.');
      console.log('\nTo fix: Re-upload images through the admin panel using Cloudinary.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkProductImages();