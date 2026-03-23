## PureSkin Clinic – Full-Stack App

Backend: Node.js (Express) + MySQL + Stripe  
Frontend: React (Vite) + Tailwind (to be scaffolded)

### Backend Setup (`server`)

1. Install dependencies:

```bash
cd server
npm install
```

2. Create MySQL database and tables:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

3. Create `.env` in `server` (based on this template):

```bash
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=pureskin_clinic

JWT_SECRET=super_secret_jwt_key_change_me
JWT_EXPIRES_IN=1h

STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

4. Run the dev server:

```bash
cd server
npm run dev
```

The health check will be available at `http://localhost:5000/api/health`.

### Database

- Schema: `database/schema.sql`
- Seed data (admin, doctors, patient, products): `database/seed.sql`
- Replace the placeholder bcrypt hashes in `seed.sql` with real hashes generated using the backend auth logic.

### Frontend (planned)

- React app (Vite + TypeScript) with Tailwind, routing, and role-based dashboards.
- Environment: `.env` with `VITE_API_BASE_URL=http://localhost:5000` and Stripe public key.


