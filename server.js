import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from dist folder (for production)
app.use(express.static(path.join(__dirname, 'dist')));

// PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Helper functions for database queries
const dbAll = async (query, params = []) => {
  const result = await pool.query(query, params);
  return result.rows;
};

const dbRun = async (query, params = []) => {
  const result = await pool.query(query, params);
  return result;
};

const dbGet = async (query, params = []) => {
  const result = await pool.query(query, params);
  return result.rows[0];
};

// Get or create default trip
app.get('/api/trips/default', async (req, res) => {
  try {
    let trip = await dbGet('SELECT * FROM trips LIMIT 1');

    if (!trip) {
      const tripId = 'trip-' + Date.now();
      await dbRun('INSERT INTO trips (id, name) VALUES ($1, $2)', [tripId, 'ירח הדבש שלנו']);
      trip = await dbGet('SELECT * FROM trips WHERE id = $1', [tripId]);
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full trip data with all relations
app.get('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await dbGet('SELECT * FROM trips WHERE id = $1', [id]);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const stops = await dbAll('SELECT * FROM stops WHERE tripId = $1 ORDER BY createdAt', [id]);
    const categories = await dbAll('SELECT * FROM categories WHERE tripId = $1', [id]);
    const expenses = await dbAll('SELECT * FROM expenses WHERE tripId = $1', [id]);

    // Get bookings for each stop
    for (const stop of stops) {
      const bookings = await dbAll('SELECT * FROM bookings WHERE stopId = $1', [stop.id]);
      stop.flights = bookings.filter(b => b.kind === 'flights');
      stop.hotels = bookings.filter(b => b.kind === 'hotels');
      stop.activities = bookings.filter(b => b.kind === 'activities');
      stop.transfers = bookings.filter(b => b.kind === 'transfers');
    }

    res.json({ ...trip, stops, categories, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update trip
app.put('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, budgetTotal } = req.body;
    await dbRun('UPDATE trips SET name = $1, budgetTotal = $2, updatedAt = CURRENT_TIMESTAMP WHERE id = $3', [name, budgetTotal, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add stop
app.post('/api/stops', async (req, res) => {
  try {
    const { id, tripId, name, country, start, end, lat, lng, notes } = req.body;
    await dbRun(
      'INSERT INTO stops (id, tripId, name, country, start, end, lat, lng, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, tripId, name, country, start, end, lat, lng, notes]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stop
app.put('/api/stops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, start, end, lat, lng, notes } = req.body;
    await dbRun(
      'UPDATE stops SET name = $1, country = $2, start = $3, end = $4, lat = $5, lng = $6, notes = $7, updatedAt = CURRENT_TIMESTAMP WHERE id = $8',
      [name, country, start, end, lat, lng, notes, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stop
app.delete('/api/stops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM bookings WHERE stopId = $1', [id]);
    await dbRun('DELETE FROM stops WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { id, stopId, kind, origin, destination, label, detail, confirmation, date, time } = req.body;
    await dbRun(
      'INSERT INTO bookings (id, stopId, kind, origin, destination, label, detail, confirmation, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, stopId, kind, origin, destination, label, detail, confirmation, date]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kind, origin, destination, label, detail, confirmation, date, time } = req.body;
    await dbRun(
      'UPDATE bookings SET kind = $1, origin = $2, destination = $3, label = $4, detail = $5, confirmation = $6, date = $7, updatedAt = CURRENT_TIMESTAMP WHERE id = $8',
      [kind, origin, destination, label, detail, confirmation, date, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { id, tripId, desc, amount, categoryId, stopId } = req.body;
    await dbRun(
      'INSERT INTO expenses (id, tripId, desc, amount, categoryId, stopId) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, tripId, desc, amount, categoryId, stopId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add categories
app.post('/api/categories', async (req, res) => {
  try {
    const { id, tripId, name } = req.body;
    await dbRun('INSERT INTO categories (id, tripId, name) VALUES ($1, $2, $3)', [id, tripId, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Maps API Key management
let googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

// Get API key (returns the key for frontend use)
app.get('/api/config/google-maps-key', (req, res) => {
  res.json({ apiKey: googleMapsApiKey });
});

// Set API key (for updating via UI)
app.post('/api/config/google-maps-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Invalid API key' });
  }
  googleMapsApiKey = apiKey;
  res.json({ success: true, apiKey });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to index.html for client-side routing (SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  if (googleMapsApiKey) {
    console.log('✓ Google Maps API key loaded from .env');
  } else {
    console.log('ℹ️  No Google Maps API key in .env');
    console.log('   → Add it to .env file, or set it via the app settings (gear icon)');
  }
  console.log('\n');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Closing server...');
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        budgetTotal NUMERIC DEFAULT 30000,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stops (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        name TEXT,
        country TEXT,
        start TEXT,
        end TEXT,
        lat NUMERIC,
        lng NUMERIC,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tripId) REFERENCES trips(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        stopId TEXT NOT NULL,
        kind TEXT NOT NULL,
        origin TEXT,
        destination TEXT,
        label TEXT,
        detail TEXT,
        confirmation TEXT,
        date TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stopId) REFERENCES stops(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        desc TEXT,
        amount NUMERIC,
        categoryId TEXT,
        stopId TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tripId) REFERENCES trips(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tripId) REFERENCES trips(id)
      )
    `);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

startServer();
