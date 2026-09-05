/* eslint-disable no-console */
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Atlas works reliably over IPv4 on networks that expose MongoDB through IPv6/NAT64.
dns.setDefaultResultOrder('ipv4first');

const img = (url, alt) => ({
  url,
  publicId: '',
  alt,
});

const imageUrls = {
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
  smartphone2: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
  laptop2: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  earbuds: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
  home: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85',
  gaming: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=85',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
  fashion: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
};

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';
  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected. Wiping existing demo catalog...');

  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@demo.com', 'customer@demo.com'] } }),
    Category.deleteMany({}),
    Product.deleteMany({}),
  ]);

  console.log('Creating users...');
  await User.create({
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'Admin@1234',
    role: 'admin',
    phone: '9990001111',
  });
  await User.create({
    name: 'Demo Customer',
    email: 'customer@demo.com',
    password: 'Customer@1234',
    role: 'customer',
    phone: '9990002222',
    addresses: [
      {
        label: 'Home',
        fullName: 'Demo Customer',
        phone: '9990002222',
        addressLine1: '221B Baker Street',
        city: 'Ajmer',
        state: 'Rajasthan',
        postalCode: '305001',
        country: 'India',
        isDefault: true,
      },
    ],
  });

  console.log('Creating categories...');
  const categoryDefs = [
    { name: 'Mobiles', description: 'Smartphones, accessories, and everyday mobile essentials.' },
    { name: 'Laptops & Tablets', description: 'Laptops and tablets for work, study, creativity, and entertainment.' },
    { name: 'Audio', description: 'Wireless earbuds, headphones, speakers, and audio accessories.' },
    { name: 'Wearables', description: 'Smartwatches and fitness-focused wearable technology.' },
    { name: 'Cameras', description: 'Cameras and gear for creators, photography, and video.' },
    { name: 'Home & Kitchen', description: 'Useful appliances and products for a smarter home.' },
    { name: 'Gaming', description: 'Gaming consoles, controllers, monitors, and accessories.' },
    { name: 'Fashion & Footwear', description: 'Everyday clothing, sneakers, and lifestyle essentials.' },
  ];
  const categories = await Category.insertMany(categoryDefs);
  const cat = (name) => categories.find((c) => c.name === name)._id;

  console.log('Creating realistic retail catalog...');
  const products = [
    // Mobiles
    { name: 'Apple iPhone 15 128GB', brand: 'Apple', category: cat('Mobiles'), price: 69900, discountPercentage: 8, stock: 18, image: imageUrls.smartphone, rating: 4.7, reviewCount: 1842, featured: true, specs: [['Display', '6.1-inch Super Retina XDR'], ['Storage', '128GB'], ['Camera', '48MP Main + 12MP Ultra Wide'], ['Battery', 'All-day battery life']] },
    { name: 'Samsung Galaxy A55 5G 256GB', brand: 'Samsung', category: cat('Mobiles'), price: 45999, discountPercentage: 13, stock: 31, image: imageUrls.smartphone2, rating: 4.5, reviewCount: 967, featured: true, specs: [['Display', '6.6-inch FHD+ Super AMOLED'], ['Storage', '256GB'], ['Camera', '50MP Triple Camera'], ['Network', '5G Dual SIM']] },
    { name: 'OnePlus 12R 5G 256GB', brand: 'OnePlus', category: cat('Mobiles'), price: 45999, discountPercentage: 17, stock: 24, image: imageUrls.smartphone, rating: 4.6, reviewCount: 733, specs: [['Display', '6.78-inch AMOLED 120Hz'], ['Storage', '256GB'], ['RAM', '8GB'], ['Battery', '5500mAh']] },
    { name: 'Google Pixel 8a 128GB', brand: 'Google', category: cat('Mobiles'), price: 52999, discountPercentage: 15, stock: 14, image: imageUrls.smartphone2, rating: 4.6, reviewCount: 518, specs: [['Display', '6.1-inch OLED 120Hz'], ['Storage', '128GB'], ['Camera', '64MP Dual Camera'], ['OS', 'Android']] },

    // Laptops & Tablets
    { name: 'Apple MacBook Air 13-inch M2', brand: 'Apple', category: cat('Laptops & Tablets'), price: 99900, discountPercentage: 10, stock: 10, image: imageUrls.laptop, rating: 4.8, reviewCount: 1241, featured: true, specs: [['Processor', 'Apple M2'], ['Memory', '8GB Unified Memory'], ['Storage', '256GB SSD'], ['Display', '13.6-inch Liquid Retina']] },
    { name: 'Dell Inspiron 14 Intel Core i5', brand: 'Dell', category: cat('Laptops & Tablets'), price: 67990, discountPercentage: 12, stock: 16, image: imageUrls.laptop2, rating: 4.4, reviewCount: 689, specs: [['Processor', 'Intel Core i5'], ['Memory', '16GB RAM'], ['Storage', '512GB SSD'], ['Display', '14-inch FHD']] },
    { name: 'HP Pavilion 15 Ryzen 5', brand: 'HP', category: cat('Laptops & Tablets'), price: 64990, discountPercentage: 14, stock: 21, image: imageUrls.laptop, rating: 4.3, reviewCount: 542, specs: [['Processor', 'AMD Ryzen 5'], ['Memory', '16GB RAM'], ['Storage', '512GB SSD'], ['Display', '15.6-inch FHD']] },
    { name: 'Apple iPad 10th Generation 64GB', brand: 'Apple', category: cat('Laptops & Tablets'), price: 44900, discountPercentage: 9, stock: 13, image: imageUrls.laptop2, rating: 4.7, reviewCount: 1035, specs: [['Display', '10.9-inch Liquid Retina'], ['Storage', '64GB'], ['Chip', 'A14 Bionic'], ['Connectivity', 'Wi-Fi']] },

    // Audio
    { name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', category: cat('Audio'), price: 34990, discountPercentage: 18, stock: 12, image: imageUrls.audio, rating: 4.8, reviewCount: 2210, featured: true, specs: [['Type', 'Over-ear Wireless'], ['Noise Control', 'Active Noise Cancellation'], ['Battery', 'Up to 30 hours'], ['Connectivity', 'Bluetooth']] },
    { name: 'Apple AirPods Pro (2nd Generation)', brand: 'Apple', category: cat('Audio'), price: 24900, discountPercentage: 12, stock: 27, image: imageUrls.earbuds, rating: 4.7, reviewCount: 1950, specs: [['Type', 'True Wireless Earbuds'], ['Noise Control', 'Active Noise Cancellation'], ['Charging', 'USB-C'], ['Features', 'Spatial Audio']] },
    { name: 'JBL Flip 6 Portable Bluetooth Speaker', brand: 'JBL', category: cat('Audio'), price: 13999, discountPercentage: 21, stock: 44, image: imageUrls.audio, rating: 4.6, reviewCount: 875, specs: [['Output', '30W'], ['Battery', 'Up to 12 hours'], ['Water Resistance', 'IP67'], ['Connectivity', 'Bluetooth 5.1']] },
    { name: 'boAt Airdopes 141 ANC', brand: 'boAt', category: cat('Audio'), price: 4490, discountPercentage: 34, stock: 85, image: imageUrls.earbuds, rating: 4.2, reviewCount: 4210, specs: [['Type', 'True Wireless Earbuds'], ['Noise Control', 'ANC'], ['Battery', 'Up to 42 hours'], ['Charging', 'USB-C']] },

    // Wearables
    { name: 'Apple Watch Series 9 GPS', brand: 'Apple', category: cat('Wearables'), price: 44900, discountPercentage: 11, stock: 9, image: imageUrls.watch, rating: 4.7, reviewCount: 842, featured: true, specs: [['Display', '45mm Retina Display'], ['Health', 'Heart Rate & Sleep Tracking'], ['Water Resistance', '50m'], ['Connectivity', 'GPS']] },
    { name: 'Samsung Galaxy Watch6 44mm', brand: 'Samsung', category: cat('Wearables'), price: 36999, discountPercentage: 24, stock: 15, image: imageUrls.watch, rating: 4.5, reviewCount: 604, specs: [['Display', '1.5-inch Super AMOLED'], ['Health', 'Sleep & Heart Monitoring'], ['Battery', 'Up to 40 hours'], ['Water Resistance', '5ATM + IP68']] },
    { name: 'Noise ColorFit Pro 5', brand: 'Noise', category: cat('Wearables'), price: 4999, discountPercentage: 26, stock: 65, image: imageUrls.watch, rating: 4.2, reviewCount: 1804, specs: [['Display', '1.96-inch AMOLED'], ['Health', 'SpO2 & Heart Rate'], ['Battery', 'Up to 7 days'], ['Water Resistance', 'IP68']] },
    { name: 'Fitbit Charge 6 Fitness Tracker', brand: 'Fitbit', category: cat('Wearables'), price: 14999, discountPercentage: 19, stock: 22, image: imageUrls.watch, rating: 4.4, reviewCount: 491, specs: [['Tracking', 'Activity, Sleep & Heart Rate'], ['GPS', 'Built-in GPS'], ['Battery', 'Up to 7 days'], ['Water Resistance', '50m']] },

    // Cameras
    { name: 'Sony Alpha ZV-E10 Mirrorless Camera', brand: 'Sony', category: cat('Cameras'), price: 72990, discountPercentage: 9, stock: 8, image: imageUrls.camera, rating: 4.7, reviewCount: 432, featured: true, specs: [['Sensor', '24.2MP APS-C'], ['Video', '4K'], ['Lens Mount', 'Sony E-mount'], ['Screen', '3-inch Vari-angle']] },
    { name: 'Canon EOS R50 Mirrorless Camera', brand: 'Canon', category: cat('Cameras'), price: 79990, discountPercentage: 13, stock: 7, image: imageUrls.camera, rating: 4.6, reviewCount: 318, specs: [['Sensor', '24.2MP APS-C'], ['Video', '4K'], ['Autofocus', 'Dual Pixel CMOS AF II'], ['Connectivity', 'Wi-Fi & Bluetooth']] },
    { name: 'GoPro HERO12 Black Action Camera', brand: 'GoPro', category: cat('Cameras'), price: 44990, discountPercentage: 16, stock: 11, image: imageUrls.camera, rating: 4.5, reviewCount: 765, specs: [['Video', '5.3K60'], ['Stabilization', 'HyperSmooth 6.0'], ['Waterproof', 'Up to 10m'], ['Connectivity', 'Wi-Fi + Bluetooth']] },
    { name: 'DJI Osmo Mobile 6 Smartphone Gimbal', brand: 'DJI', category: cat('Cameras'), price: 15990, discountPercentage: 20, stock: 19, image: imageUrls.camera, rating: 4.4, reviewCount: 286, specs: [['Stabilization', '3-axis gimbal'], ['Control', 'Bluetooth'], ['Foldable', 'Yes'], ['Compatibility', 'iOS & Android']] },

    // Home & Kitchen
    { name: 'Philips Air Fryer 4.1L', brand: 'Philips', category: cat('Home & Kitchen'), price: 9995, discountPercentage: 22, stock: 28, image: imageUrls.home, rating: 4.5, reviewCount: 1320, featured: true, specs: [['Capacity', '4.1L'], ['Power', '1400W'], ['Cooking', 'Rapid Air Technology'], ['Control', 'Digital']] },
    { name: 'Dyson V8 Cordless Vacuum Cleaner', brand: 'Dyson', category: cat('Home & Kitchen'), price: 39900, discountPercentage: 12, stock: 8, image: imageUrls.home, rating: 4.6, reviewCount: 611, specs: [['Type', 'Cordless Stick Vacuum'], ['Runtime', 'Up to 40 minutes'], ['Filtration', 'Whole-machine filtration'], ['Bin', 'Hygienic point-and-shoot']] },
    { name: 'Prestige 4-Burner Gas Stove', brand: 'Prestige', category: cat('Home & Kitchen'), price: 12995, discountPercentage: 18, stock: 20, image: imageUrls.home, rating: 4.3, reviewCount: 905, specs: [['Burners', '4'], ['Top', 'Toughened Glass'], ['Ignition', 'Manual'], ['Finish', 'Black']] },
    { name: 'Bajaj OTG 22L Oven Toaster Grill', brand: 'Bajaj', category: cat('Home & Kitchen'), price: 6999, discountPercentage: 15, stock: 35, image: imageUrls.home, rating: 4.2, reviewCount: 742, specs: [['Capacity', '22L'], ['Power', '1200W'], ['Functions', 'Bake, Toast & Grill'], ['Timer', '60 minutes']] },

    // Gaming
    { name: 'Sony PlayStation 5 Slim Console', brand: 'Sony', category: cat('Gaming'), price: 54990, discountPercentage: 5, stock: 6, image: imageUrls.gaming, rating: 4.8, reviewCount: 1580, featured: true, specs: [['Storage', '1TB SSD'], ['Resolution', 'Up to 4K'], ['Drive', 'Disc Edition'], ['Controller', 'DualSense included']] },
    { name: 'Xbox Wireless Controller', brand: 'Microsoft', category: cat('Gaming'), price: 5990, discountPercentage: 12, stock: 42, image: imageUrls.gaming, rating: 4.6, reviewCount: 1145, specs: [['Connectivity', 'Bluetooth & Xbox Wireless'], ['Platform', 'Xbox, PC, Mobile'], ['Power', 'AA batteries'], ['Port', 'USB-C']] },
    { name: 'Logitech G102 LIGHTSYNC Gaming Mouse', brand: 'Logitech', category: cat('Gaming'), price: 2495, discountPercentage: 20, stock: 76, image: imageUrls.gaming, rating: 4.5, reviewCount: 3260, specs: [['Sensor', '8000 DPI'], ['Buttons', '6 programmable'], ['Lighting', 'LIGHTSYNC RGB'], ['Connection', 'USB']] },
    { name: 'Acer Nitro 24-inch Gaming Monitor', brand: 'Acer', category: cat('Gaming'), price: 14999, discountPercentage: 17, stock: 18, image: imageUrls.gaming, rating: 4.4, reviewCount: 532, specs: [['Size', '23.8-inch'], ['Refresh Rate', '180Hz'], ['Resolution', 'Full HD'], ['Response', '1ms']] },

    // Fashion & Footwear
    { name: 'Nike Air Max SC Casual Sneakers', brand: 'Nike', category: cat('Fashion & Footwear'), price: 7495, discountPercentage: 18, stock: 38, image: imageUrls.shoes, rating: 4.5, reviewCount: 914, featured: true, specs: [['Type', 'Casual Sneakers'], ['Upper', 'Textile & Synthetic'], ['Sole', 'Rubber'], ['Use', 'Lifestyle']] },
    { name: 'Adidas Runfalcon 3 Running Shoes', brand: 'Adidas', category: cat('Fashion & Footwear'), price: 5999, discountPercentage: 22, stock: 47, image: imageUrls.shoes, rating: 4.4, reviewCount: 1210, specs: [['Type', 'Running Shoes'], ['Upper', 'Textile'], ['Sole', 'Rubber'], ['Closure', 'Lace-up']] },
    { name: 'Levi’s Men’s Regular Fit Cotton T-Shirt', brand: "Levi's", category: cat('Fashion & Footwear'), price: 1999, discountPercentage: 25, stock: 70, image: imageUrls.fashion, rating: 4.3, reviewCount: 682, specs: [['Fit', 'Regular'], ['Fabric', 'Cotton'], ['Sleeve', 'Half Sleeve'], ['Care', 'Machine Wash']] },
    { name: 'Puma Women’s Essentials Hoodie', brand: 'Puma', category: cat('Fashion & Footwear'), price: 3499, discountPercentage: 20, stock: 33, image: imageUrls.fashion, rating: 4.4, reviewCount: 398, specs: [['Fit', 'Regular'], ['Fabric', 'Cotton Blend'], ['Style', 'Pullover Hoodie'], ['Care', 'Machine Wash']] },
  ];

  const now = Date.now();
  const docs = products.map((p, i) => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    discountPercentage: p.discountPercentage,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    featured: Boolean(p.featured),
    active: true,
    description: `${p.name} is a retail-ready ${p.brand} product listed in Voltra's ${categories.find((c) => c._id.equals(p.category)).name} collection. Product details, pricing, stock and specifications are managed from the Voltra catalog and can be updated by an administrator.`,
    shortDescription: `${p.name} — a popular everyday choice available from Voltra.`,
    sku: `VOL-${now}-${String(i + 1).padStart(3, '0')}`,
    images: [img(p.image, p.name)],
    specifications: p.specs.map(([key, value]) => ({ key, value })),
    tags: [p.brand.toLowerCase(), categories.find((c) => c._id.equals(p.category)).name.toLowerCase(), 'bestseller'],
  }));

  await Product.insertMany(docs);

  console.log('\n✅ Seed complete.');
  console.log('Admin login:    admin@demo.com / Admin@1234');
  console.log('Customer login: customer@demo.com / Customer@1234');
  console.log(`Categories: ${categories.length}, Products: ${docs.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
