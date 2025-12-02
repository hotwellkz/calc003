import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiCalculatorRouter from './routes/aiCalculator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', aiCalculatorRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Произошла ошибка на сервере'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`🤖 Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
});

