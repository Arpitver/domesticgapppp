# Domestic-Gap

A responsive home-services marketplace built with the MERN stack and Socket.IO. Customers browse and book services, find nearby workers on a map, and track the assigned worker live. Service providers manage their services and jobs.

## Features

- **Service marketplace**: browse, search and filter services by category, then book a time slot
- **Map-based discovery**: find available workers near you (MongoDB `2dsphere` + `$geoNear`, Leaflet/OpenStreetMap, no API key needed)
- **Real-time tracking**: the worker shares live GPS during an active job and the customer sees them move on the map (Socket.IO rooms per booking)
- **Authentication**: JWT login/register, profile management, password change
- **Booking history**: every booking with status, filters, and live status updates
- **Role-based access**: `customer` and `provider` roles enforced on both API (middleware) and UI (protected routes)

## Tech stack

| Layer | Tools |
| --- | --- |
| Database | MongoDB, Mongoose |
| Server | Node.js, Express, Socket.IO, JWT, bcryptjs |
| Client | React 18, Vite, React Router, Axios, Leaflet / react-leaflet, socket.io-client |

## Project structure

```
domestic-gap/
├── server/
│   ├── config/db.js
│   ├── middleware/auth.js      # JWT protect + restrictTo(role)
│   ├── models/                 # User, Service, Booking
│   ├── routes/                 # auth, users, services, workers, bookings
│   ├── socket.js               # authenticated sockets, booking rooms, live location
│   ├── seed.js                 # demo data
│   └── server.js
└── client/
    └── src/
        ├── components/         # Navbar, MapView, ProtectedRoute
        ├── context/            # AuthContext
        ├── lib/                # api, socket, helpers
        └── pages/              # Home, Nearby, ServiceDetail, Bookings, Track, Profile, ...
```

## Getting started

Requirements: Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. Install everything
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env (MONGO_URI, JWT_SECRET)

# 3. (optional) Load demo data centred on Bengaluru
npm run seed

# 4. Run server (port 5000) and client (port 5173) together
npm run dev
```

Open http://localhost:5173.

Demo logins after seeding (password `password123`):

- Customer: `customer@demo.com`
- Provider: `provider@demo.com`

To seed around another city, change `CENTER` at the top of `server/seed.js` and `DEFAULT_CENTER` in `client/src/lib/helpers.js`.

## Trying live tracking

1. In one browser, log in as the customer and book a service from `provider@demo.com` (Ravi Kumar, Plumbing). Click the map to drop the service pin.
2. In a second browser or private window, log in as the provider, open **Bookings**, and press **Accept**, then **Start trip**.
3. As the provider, click **Open map**, then **Share my live location**. Tick **Simulate driving** if you are testing from a desktop with no GPS.
4. As the customer, click **Track live** on the booking and watch the worker move toward you.

Browsers only allow geolocation on `https://` or `localhost`.

## API overview

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | authenticated |
| PUT | `/api/users/me` | authenticated |
| GET | `/api/services`, `/api/services/:id`, `/api/services/categories` | public |
| GET/POST/PUT/DELETE | `/api/services/mine`, `/api/services`, `/api/services/:id` | provider |
| GET | `/api/workers/nearby?lat&lng&radius&category` | public |
| POST | `/api/bookings` | customer |
| GET | `/api/bookings/mine`, `/api/bookings/:id` | participants |
| PATCH | `/api/bookings/:id/status` | participants (role-specific transitions) |

### Socket events

| Event | Direction | Purpose |
| --- | --- | --- |
| `booking:join` (id, ack) | client → server | join the booking room (participants only) |
| `location:update` `{bookingId, lat, lng}` | provider → server | stream position during an active booking |
| `location:updated` | server → room | new worker position |
| `booking:new`, `booking:updated` | server → users | live notifications and status changes |

Booking flow: `pending → accepted → on_the_way → in_progress → completed`. Providers can also reject a pending request; customers can cancel while it is pending or accepted.

## Production notes

- Build the client with `npm run build`, serve `client/dist` from a static host or from Express, and set `VITE_API_URL` and `VITE_SOCKET_URL` at build time if the API lives on another origin.
- Use a strong `JWT_SECRET`, set `CLIENT_URL` to your deployed origin, and serve everything over HTTPS.

## Deploying to Netlify and Render

- Netlify reads `netlify.toml`; its base directory is `client`, and its publish directory is `dist`.
- Create a free MongoDB Atlas cluster and database user. In Atlas Network Access, allow connections from Render. Render's free service does not provide a fixed outbound IP, so use a strong database password and restrict access further if your hosting plan supports it.
- In Render, create a Blueprint from this repository and use `render.yaml`. Enter the Atlas connection string as the `MONGO_URI` secret when prompted. Render generates `JWT_SECRET`; `CLIENT_URL` is set to the Netlify site.
- After the API deploys, verify `https://<render-service>.onrender.com/api/health` returns `{"ok":true}`.
- In Netlify environment variables, set `VITE_API_URL` to `https://<render-service>.onrender.com/api` and `VITE_SOCKET_URL` to `https://<render-service>.onrender.com`, then trigger a new deploy. These Vite variables are read at build time.
- To load demo users and services into a **fresh** database, run `npm run seed` from the server directory. Seeding deletes existing users, services, and bookings first.
