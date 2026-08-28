# ירח הדבש שלנו — Honeymoon App

A beautiful, fully-featured honeymoon trip planning app with persistent data storage.

## Features

- 📍 **Trip Planning**: Organize multiple destinations with dates
- 🛫 **Flight Tracking**: Log all your flights with confirmation numbers
- 🏨 **Hotel Bookings**: Keep track of accommodations
- 🎫 **Activities**: Plan tours and experiences
- 🚂 **Transfers & Transport**: Track trains, ferries, buses, and other ground transport
- 💰 **Budget Tracking**: Monitor expenses by category and destination
- 🗺️ **Interactive Map**: Visualize your trip route (with optional Google Maps)
- 💾 **Persistent Storage**: All data is automatically saved to SQLite database

## Quick Start

You need [Node.js](https://nodejs.org) installed (18+ recommended).

### 1. Install & Run

```bash
npm install
npm run dev:all
```

This starts both servers:
- **Backend**: http://localhost:3001 (Express + SQLite)
- **Frontend**: http://localhost:5175 (React + Vite)

### 2. Configure Google Maps (Optional)

To enable the interactive map, add your Google Maps API key to `.env`:

```bash
# .env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

Then restart the server. The app will load the map with real tiles and autocomplete.

**Don't have an API key?** 
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project
- Enable the Maps JavaScript API and Places API
- Create an API key with Application Restrictions set to your domain

### Run Separately

```bash
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend dev server
npm run dev
```

## How Persistence Works

- **Backend**: Express.js server on port 3001
- **Database**: SQLite (trips.db, auto-created)
- **Sync**: Changes auto-save to database in real-time
- **Fallback**: If server is unavailable, app uses local data and falls back gracefully

### Database Structure

```
trips                 → Trip metadata (name, budget)
├── stops           → Destinations with dates
│   ├── bookings    → Flights, hotels, activities, transfers
│   └── notes       → Location notes
├── expenses        → Budget items
└── categories      → Expense categories
```

## Deploy to Production

### Using Vercel (Simplest)

1. Push your code to GitHub
2. Connect repo to Vercel at https://vercel.com
3. Add environment variables in Vercel settings if needed
4. It auto-deploys on every push

**Note**: For production, you'll need to deploy the backend separately (e.g., Heroku, Railway, or your own server). Update the API URL in App.jsx from `localhost:3001` to your server URL.

### Using Netlify

1. Build the frontend: `npm run build`
2. Drag the `dist` folder to https://app.netlify.com/drop
3. For the backend, deploy separately and update the API URL

### Self-Hosted Option

Deploy `server.js` to your own server (VPS, dedicated host, etc.) and update the API URL in App.jsx.

## API Reference

### Trips
- `GET /api/trips/default` — Get or create default trip
- `GET /api/trips/:id` — Get trip with all data
- `PUT /api/trips/:id` — Update name/budget

### Stops
- `POST /api/stops` — Add destination
- `PUT /api/stops/:id` — Update destination
- `DELETE /api/stops/:id` — Remove destination

### Bookings
- `POST /api/bookings` — Add flight/hotel/activity/transfer
- `DELETE /api/bookings/:id` — Remove booking

### Expenses
- `POST /api/expenses` — Add expense
- `DELETE /api/expenses/:id` — Remove expense

### Categories
- `POST /api/categories` — Add expense category

## Transfers & Transportation

New in this version! Track all ground transportation:
- **Trains**: Eurostar, local rail, high-speed trains
- **Ferries**: Island hoppers, scenic crossings
- **Buses**: Long-distance coaches, shuttles
- **Other**: Taxis, car rentals, airport transfers

Each transfer stores:
- Type/description
- Departure date & time
- Confirmation number
- Details (station, notes, etc.)

## Securing Your API Key

### Development
Your API key is stored in `.env` (git-ignored, never committed):
```bash
# .env — NOT committed to git
GOOGLE_MAPS_API_KEY=your_secret_key_here
```

### Production
When deploying:

1. **Restrict your API key** in Google Cloud Console:
   - Go to APIs & Services → Credentials
   - Click your API key → **Application restrictions**
   - Choose **Websites** → Add your domain (e.g., `honeymoon-app.vercel.app`)
   - Click **Save**

2. **Store securely** on your server:
   - For Vercel: Add to Environment Variables
   - For other servers: Set `GOOGLE_MAPS_API_KEY` in your deployment platform
   - Never commit the key to git

## Troubleshooting

### Database Issues
```bash
# Reset database (will lose all data)
rm trips.db
npm run server
```

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Server Not Responding
- Check both servers are running (`npm run dev:all`)
- Check browser console for CORS errors
- Verify ports 3001 and 5175 are available

## Notes

- The app is fully in Hebrew with RTL layout
- All data persists automatically — no manual save button needed
- Works offline with fallback data if server unavailable
- Optimized for mobile and desktop
