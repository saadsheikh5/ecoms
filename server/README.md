# JTS Beauty Backend API

A simple, beginner-friendly Node.js/Express/MongoDB backend for the JTS Beauty ecommerce store.

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Admin login
│   ├── productController.js
│   ├── orderController.js
│   ├── reviewController.js
│   └── couponController.js
├── middleware/
│   ├── auth.js            # JWT protection
│   ├── errorHandler.js    # Global error handler
│   └── upload.js          # Image upload (multer)
├── models/
│   ├── Admin.js
│   ├── Product.js         # Supports wig variants
│   ├── Order.js           # Guest checkout
│   ├── Review.js
│   └── Coupon.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── reviewRoutes.js
│   └── couponRoutes.js
├── utils/
│   └── apiError.js        # Custom error class
├── uploads/               # Product images saved here
├── .env.example           # Copy to .env and fill in values
├── .gitignore
├── package.json
└── server.js              # App entry point
```

---

## Image Safety For Back4App

Product uploads use Cloudinary storage. Do not store new production product images in `server/uploads/`, because Back4App containers can replace local files during deploys/restarts.

Keep these environment variables unset in Back4App:

```
ALLOW_IMAGE_REMOVAL=true
ALLOW_DESTRUCTIVE_SEED=true
```

By default, product updates preserve existing image references when an update accidentally submits an empty image list, and the seed reset refuses to clear collections unless `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set.

## 🚀 Getting Started

### 1. Install MongoDB
Download and install MongoDB Community: https://www.mongodb.com/try/download/community

### 2. Set Up Environment Variables
```bash
# In the server/ folder, copy the example file:
copy .env.example .env
```
Then open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/jtsbeauty
JWT_SECRET=make_this_a_long_random_secret_string
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Create the uploads folder
```bash
mkdir uploads
```

### 4. Start the Server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

---

## 👤 Create Your First Admin Account

Run this **once** using a tool like Postman or Thunder Client:

```
POST http://localhost:5000/api/auth/create-admin
Content-Type: application/json

{
  "name": "JTS Admin",
  "email": "admin@jtsbeauty.com",
  "password": "your_secure_password"
}
```

⚠️ **After creating your admin, disable the `/create-admin` route in `routes/authRoutes.js`!**

---

## 🔐 Admin Login

```
POST http://localhost:5000/api/auth/login

{
  "email": "admin@jtsbeauty.com",
  "password": "your_password"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "name": "JTS Admin", "email": "admin@jtsbeauty.com" }
}
```

For all protected routes, add this header:
```
Authorization: Bearer <your_token>
```

---

## 📦 API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/login | Public | Admin login |
| GET | /api/auth/me | Admin | Get logged-in admin |
| POST | /api/auth/create-admin | Public | Create admin (disable after use) |

### Products
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/products | Public | Get all products |
| GET | /api/products/:id | Public | Get single product |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |

### Orders
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/orders | Public | Place order (guest checkout) |
| GET | /api/orders | Admin | Get all orders |
| GET | /api/orders/:id | Admin | Get single order |
| PUT | /api/orders/:id/status | Admin | Update order status |
| DELETE | /api/orders/:id | Admin | Delete order |

### Reviews
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/reviews | Public | Get all reviews |
| POST | /api/reviews | Public | Add a review |
| DELETE | /api/reviews/:id | Admin | Delete a review |

### Coupons
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/coupons/validate | Public | Validate a coupon at checkout |
| GET | /api/coupons | Admin | Get all coupons |
| POST | /api/coupons | Admin | Create a coupon |
| PUT | /api/coupons/:id | Admin | Update a coupon |
| DELETE | /api/coupons/:id | Admin | Delete a coupon |

---

## 🔗 Connecting to the React Frontend

When ready to connect, update the `AdminLogin.jsx` file — find the comment that says:
```js
// --- BACKEND INTEGRATION ---
// When your Node/Express backend is ready, replace this block with:
```
And uncomment the fetch call below it.

---

## 🛡️ Security Features
- ✅ Helmet (security headers)
- ✅ Rate limiting (100 req/10min, 10 login attempts/15min)
- ✅ CORS (only allows your frontend URL)
- ✅ bcrypt password hashing
- ✅ JWT authentication
- ✅ MongoDB sanitization (NoSQL injection protection)
- ✅ XSS protection
- ✅ Input validation via Mongoose
- ✅ File upload validation (type + size)
- ✅ Centralized error handling
