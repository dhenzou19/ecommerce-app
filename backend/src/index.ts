import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const app = express();
const port = 5000;

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: "postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce_db"
});

// Create the Prisma adapter using the pool
const adapter = new PrismaPg(pool);

// Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
        console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend API is running at http://localhost:${port}`);
});