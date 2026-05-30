const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');
const Order = require('../models/Order');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    if (!fs.existsSync(uploadsDir)) {
      console.log('No uploads directory found. Exiting.');
      process.exit(0);
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory.`);

    const urlMap = {};

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      // Skip if it's a directory
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log(`Uploading ${file} to Cloudinary...`);
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'jts-beauty/products',
        });
        urlMap[`/uploads/${file}`] = result.secure_url;
        console.log(`Success: ${result.secure_url}`);
      } catch (err) {
        console.error(`Failed to upload ${file}:`, err.message);
      }
    }

    console.log('Mapping complete:', urlMap);

    // Update Products
    console.log('Updating Products...');
    const products = await Product.find();
    let productsUpdated = 0;
    for (const product of products) {
      let changed = false;

      if (product.image && urlMap[product.image]) {
        product.image = urlMap[product.image];
        changed = true;
      } else if (product.image && product.image.startsWith('/uploads/')) {
        console.log(`Warning: Product ${product._id} has local image ${product.image} but file was not found/uploaded.`);
      }

      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          if (urlMap[product.images[i]]) {
            product.images[i] = urlMap[product.images[i]];
            changed = true;
          }
        }
      }

      if (changed) {
        await product.save();
        productsUpdated++;
      }
    }
    console.log(`Updated ${productsUpdated} products.`);

    // Update Orders
    console.log('Updating Orders...');
    const orders = await Order.find();
    let ordersUpdated = 0;
    for (const order of orders) {
      let changed = false;
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.image && urlMap[item.image]) {
            item.image = urlMap[item.image];
            changed = true;
          }
        }
      }
      if (changed) {
        await order.save();
        ordersUpdated++;
      }
    }
    console.log(`Updated ${ordersUpdated} orders.`);

    console.log('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
