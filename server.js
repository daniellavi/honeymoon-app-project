import express from 'express';
import Database from 'better-sqlite3';
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

const db = new Database(path.join(__dirname, 'trips.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = FULL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    budgetTotal REAL DEFAULT 30000,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stops (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    name TEXT,
    country TEXT,
    start TEXT,
    end TEXT,
    lat REAL,
    lng REAL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tripId) REFERENCES trips(id)
  );

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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stopId) REFERENCES stops(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    desc TEXT,
    amount REAL,
    categoryId TEXT,
    stopId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tripId) REFERENCES trips(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tripId) REFERENCES trips(id)
  );
`);

// Helper functions for database queries
const dbAll = (query, params = []) => {
  try {
    return Promise.resolve(db.prepare(query).all(...params));
  } catch (err) {
    return Promise.reject(err);
  }
};

const dbRun = (query, params = []) => {
  try {
    return Promise.resolve(db.prepare(query).run(...params));
  } catch (err) {
    return Promise.reject(err);
  }
};

const dbGet = (query, params = []) => {
  try {
    return Promise.resolve(db.prepare(query).get(...params));
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get or create default trip
app.get('/api/trips/default', async (req, res) => {
  try {
    let trip = await dbGet('SELECT * FROM trips LIMIT 1');

    if (!trip) {
      const tripId = 'trip-' + Date.now();
      await dbRun('INSERT INTO trips (id, name) VALUES (?, ?)', [tripId, 'ירח הדבש שלנו']);
      trip = await dbGet('SELECT * FROM trips WHERE id = ?', [tripId]);
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
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const stops = await dbAll('SELECT * FROM stops WHERE tripId = ? ORDER BY ROWID', [id]);
    const categories = await dbAll('SELECT * FROM categories WHERE tripId = ?', [id]);
    const expenses = await dbAll('SELECT * FROM expenses WHERE tripId = ?', [id]);

    // Get bookings for each stop
    for (const stop of stops) {
      const bookings = await dbAll('SELECT * FROM bookings WHERE stopId = ?', [stop.id]);
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
    await dbRun('UPDATE trips SET name = ?, budgetTotal = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [name, budgetTotal, id]);
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
      'INSERT INTO stops (id, tripId, name, country, start, end, lat, lng, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
      'UPDATE stops SET name = ?, country = ?, start = ?, end = ?, lat = ?, lng = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
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
    await dbRun('DELETE FROM bookings WHERE stopId = ?', [id]);
    await dbRun('DELETE FROM stops WHERE id = ?', [id]);
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
      'INSERT INTO bookings (id, stopId, kind, origin, destination, label, detail, confirmation, date, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, stopId, kind, origin, destination, label, detail, confirmation, date, time]
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
      'UPDATE bookings SET kind = ?, origin = ?, destination = ?, label = ?, detail = ?, confirmation = ?, date = ?, time = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [kind, origin, destination, label, detail, confirmation, date, time, id]
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
    await dbRun('DELETE FROM bookings WHERE id = ?', [id]);
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
      'INSERT INTO expenses (id, tripId, desc, amount, categoryId, stopId) VALUES (?, ?, ?, ?, ?, ?)',
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
    await dbRun('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add categories
app.post('/api/categories', async (req, res) => {
  try {
    const { id, tripId, name } = req.body;
    await dbRun('INSERT INTO categories (id, tripId, name) VALUES (?, ?, ?)', [id, tripId, name]);
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

// Graceful shutdown to ensure all pending writes complete
const shutdown = () => {
  console.log('Closing server...');
  try {
    db.close();
    console.log('Database closed');
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
