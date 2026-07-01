import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // <-- NEW
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs'; // <-- NEW
import jwt from 'jsonwebtoken'; // <-- NEW

const app = express();
const port = 5000;
const JWT_SECRET = 'your_super_secret_key_here'; // CHANGE THIS LATER!

// Database setup
const pool = new pg.Pool({
  connectionString: "postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce_db"
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- MIDDLEWARE ---
app.use(cors({
  origin: true, // Allow only your frontend
  credentials: true, // <-- ALLOW COOKIES
}));
app.use(express.json());
app.use(cookieParser()); // <-- READ COOKIES

// --- HELPER: VERIFY TOKEN (The Gatekeeper) ---
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token; // Grab the cookie
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // Attach the user ID to the request
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// --- PUBLIC ROUTES ---

// 1. Get Products (Public)
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. Register User
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || 'User' },
    });
    res.status(201).json({ message: 'User created!', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

// 3. Login User (Sets HTTP-Only Cookie)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,   // Cannot be accessed by JavaScript (XSS protection)
      secure: false,    // We are on localhost (HTTP), so set to false for now
      sameSite: 'lax',  // Protects against CSRF
      maxAge: 86400000, // 1 day in milliseconds
    });

    res.status(200).json({ message: 'Login successful!', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// 4. Logout (Clears the cookie)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// --- PROTECTED ROUTES (Requires Login) ---

// 5. Add to Cart (Uses the real logged-in user!)
app.post('/api/cart', verifyToken, async (req: any, res: any) => {
  const { productId, quantity } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // 🎉 LOOK! NO MORE HARDCODED USER ID! 🎉
  const userId = req.userId; // Grabbed from the cookie!

  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity || 1,
        },
      });
    }

    res.status(200).json({ message: 'Item added to cart successfully!' });
  } catch (error) {
    console.error('Cart Error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Backend API is running at http://localhost:${port}`);
});