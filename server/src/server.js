import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import cors from 'cors';


app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing in server/.env');
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
