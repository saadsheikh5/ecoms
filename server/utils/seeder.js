const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');

async function seedInMemoryDatabase() {
  try {
    console.log('Seeding in-memory database with initial datasets...');

    // 1. Clear collections
    await Admin.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});

    // 2. Create Default Admin
    await Admin.create({
      name: 'JTS Beauty Admin',
      email: 'admin@jtsbeauty.com',
      password: 'admin123',
    });
    console.log('✓ Seeded Admin: admin@jtsbeauty.com (password: admin123)');

    // 3. Create Default Products
    const productsToSeed = [
      // --- Wigs Category ---
      {
        title: 'Tri Color Body Wave',
        description: 'JTs Beauty Tri Color Body Wave 13x4 • 250 Density • 30 inch • Transparent Lace',
        category: 'Wigs',
        price: 500,
        stock: 12,
        image: 'images/tri color body wave.png',
        isFeatured: true,
        variants: [
          { length: '30 inch', density: '250%', price: 500, stock: 12, sku: 'WIG-TRI-30-250' }
        ]
      },
      {
        title: 'Light Color Bob Wig',
        description: '13x4 • 14 inch • 230 Density • Transparent Lace',
        category: 'Wigs',
        price: 280,
        stock: 8,
        image: 'images/light bob wig.jpeg',
        isFeatured: true,
        variants: [
          { length: '14 inch', density: '230%', price: 280, stock: 8, sku: 'WIG-BOB-LT-14' }
        ]
      },
      {
        title: 'Dark Bob Wig',
        description: 'Dark Bob • 13x4 • 14 inch • 230 Density • Transparent Lace',
        category: 'Wigs',
        price: 290,
        stock: 5,
        image: 'images/Dark Bob lace.jpeg',
        isFeatured: true,
        variants: [
          { length: '14 inch', density: '230%', price: 290, stock: 5, sku: 'WIG-BOB-DK-14' }
        ]
      },
      {
        title: 'Straight Premium Wig',
        description: 'Premium straight wig with 250 density transparent lace, 10 inch to 40 inch available',
        category: 'Wigs',
        price: 250,
        stock: 15,
        image: 'images/straight.png',
        variants: [
          { length: '16 inch', density: '250%', price: 250, stock: 5, sku: 'WIG-STR-16' },
          { length: '20 inch', density: '250%', price: 310, stock: 5, sku: 'WIG-STR-20' },
          { length: '24 inch', density: '250%', price: 380, stock: 5, sku: 'WIG-STR-24' }
        ]
      },
      {
        title: 'Bodywave Classic',
        description: 'Luxurious body wave wig, 10 inch to 40 inch available',
        category: 'Wigs',
        price: 280,
        stock: 10,
        image: 'images/body-wave-1.PNG',
        variants: [
          { length: '18 inch', density: '250%', price: 280, stock: 5, sku: 'WIG-BW-18' },
          { length: '22 inch', density: '250%', price: 350, stock: 5, sku: 'WIG-BW-22' }
        ]
      },

      // --- Lace Tints Category ---
      {
        title: 'JTs Lace Tint - Light Warm Brown',
        description: 'Premium lace tint spray designed for light warm brown complexions.',
        category: 'Lace Tints',
        price: 10,
        stock: 45,
        image: 'images/lace tint spray -light warm brown.jpeg',
      },
      {
        title: 'JTs Lace Tint - Medium Brown',
        description: 'Premium lace tint spray designed for medium brown complexions.',
        category: 'Lace Tints',
        price: 10,
        stock: 30,
        image: 'images/lace tint spray -medium brown.jpeg',
      },
      {
        title: 'JTs Lace Tint - Dark Brown',
        description: 'Premium lace tint spray designed for dark brown complexions.',
        category: 'Lace Tints',
        price: 10,
        stock: 25,
        image: 'images/lace tint spray -dark brown.jpeg',
      },

      // --- Hair Products Category ---
      {
        title: 'JTs Beauty World LG Bonding Glue',
        description: 'Water-resistant, skin-safe professional hair system lace adhesive.',
        category: 'Hair Products',
        price: 7.50,
        stock: 50,
        image: 'images/lace-glue/lace-glue-pro-pineapple.jpeg',
      },
      {
        title: 'JTs Lace Glue Pro - Pineapple',
        description: 'Sweet scented, extra-hold skin-safe lace bonding glue.',
        category: 'Hair Products',
        price: 9.99,
        stock: 40,
        image: 'images/lace-glue/lace-glue-pro-pineapple.jpeg',
      },
      {
        title: 'JTs Glue Remover',
        description: 'Fast-acting lace release and solvent formula for clean removals.',
        category: 'Hair Products',
        price: 8.99,
        stock: 35,
        image: 'images/lace-glue/GLUE-REMOVER.jpg',
      },
      {
        title: 'JTs Wax Stick',
        description: 'Premium flyaway tamer and edge sleek wax stick.',
        category: 'Hair Products',
        price: 7.99,
        stock: 60,
        image: 'images/lace-glue/WAX-STICK.jpg',
      },

      // --- Bonnets Category ---
      {
        title: 'Black Hair Bonnet',
        description: 'Ultra-soft satin double-lined sleep cap to protect curls.',
        category: 'Bonnets',
        price: 15,
        stock: 20,
        image: 'images/black bonnet.jpg',
      },
      {
        title: 'Pink Hair Bonnet',
        description: 'Luxurious double-lined satin cap in pastel pink.',
        category: 'Bonnets',
        price: 18,
        stock: 15,
        image: 'images/pink bonnet new.jpg',
      }
    ];

    await Product.insertMany(productsToSeed);
    console.log(`✓ Seeded ${productsToSeed.length} Products`);

    // 4. Seed some initial reviews for Tri Color Body Wave and Straight Premium
    const reviewsToSeed = [
      {
        product: 'Tri Color Body Wave',
        category: 'Wigs',
        customerName: 'Sarah Smith',
        rating: 5,
        comment: 'Absolutely love the quality! The lace melts perfectly into the skin.',
      },
      {
        product: 'Tri Color Body Wave',
        category: 'Wigs',
        customerName: 'Jane Doe',
        rating: 4,
        comment: 'Matches my skin perfectly. Very comfortable to wear all day.',
      },
      {
        product: 'Straight Premium Wig',
        category: 'Wigs',
        customerName: 'Kiana J.',
        rating: 5,
        comment: 'Silky smooth, does not tangle at all. Beautiful shine!',
      }
    ];

    await Review.insertMany(reviewsToSeed);
    console.log(`✓ Seeded ${reviewsToSeed.length} Reviews`);

    // 5. Seed some initial Coupons
    const couponsToSeed = [
      {
        code: 'WELCOME15',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 50,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        code: 'JTS5OFF',
        discountType: 'fixed',
        discountValue: 5,
        minOrderAmount: 20,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      }
    ];

    await Coupon.insertMany(couponsToSeed);
    console.log(`✓ Seeded ${couponsToSeed.length} Discount Coupons`);
    console.log('✓ Seeding complete! Database is fully functional and ready.');

  } catch (error) {
    console.error('✗ Seeding Failed:', error);
  }
}

module.exports = { seedInMemoryDatabase };
