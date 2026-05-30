require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function getLocalFilename(url) {
  if (!url) return null;
  // Handle both /uploads/... and http://localhost:5000/uploads/...
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    return parts[parts.length - 1]; // get the filename part
  }
  return null;
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products. Checking for legacy local uploads...`);
    let updatedCount = 0;

    for (const p of products) {
      let changed = false;

      // Migrate single image
      const filename = getLocalFilename(p.image);
      if (filename) {
        const filepath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filepath)) {
          console.log(`Uploading ${filepath}...`);
          const result = await cloudinary.uploader.upload(filepath, { folder: 'jts_beauty/products' });
          p.image = result.secure_url;
          changed = true;
        } else {
          console.log(`File not found locally: ${filepath}`);
        }
      }

      // Migrate images array
      if (p.images && p.images.length > 0) {
        for (let i = 0; i < p.images.length; i++) {
          const imgFilename = getLocalFilename(p.images[i]);
          if (imgFilename) {
            const filepath = path.join(__dirname, 'uploads', imgFilename);
            if (fs.existsSync(filepath)) {
              console.log(`Uploading ${filepath}...`);
              const result = await cloudinary.uploader.upload(filepath, { folder: 'jts_beauty/products' });
              p.images[i] = result.secure_url;
              changed = true;
            } else {
              console.log(`File not found locally: ${filepath}`);
            }
          }
        }
      }

      if (changed) {
        await p.save();
        console.log(`Updated product: ${p.title || p.name}`);
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
