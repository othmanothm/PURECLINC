## PureSkin Clinic — Secure Full-Stack Clinic Management System

PureSkin Clinic is a full-stack, role-based web application designed to digitize clinic operations for a dermatology and aesthetic clinic. The system combines appointment management, patient medical records, doctor–patient messaging, product e-commerce, order management, reviews, and administrative control in one platform.

The application is deployed in production:

* Frontend: https://pureclinic.online
* API: https://api.pureclinic.online/api

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* react-i18next for English/Arabic support

### Backend

* Node.js
* Express.js
* MySQL
* JWT Authentication
* Role-Based Access Control (RBAC)
* bcrypt password hashing
* Nodemailer / SMTP email notifications
* Stripe Checkout and Stripe Webhooks

### Deployment & Tools

* GitHub Actions
* Linux server deployment
* systemd services
* MySQL database migrations
* REST API architecture

## Main Features

### Patient Portal

* Patient registration and email verification
* Secure login using JWT
* Appointment booking with available time slots
* Medical profile and medical record management
* Doctor–patient messaging
* Product browsing, cart, checkout, and order tracking
* Review submission after completed appointments

### Doctor Portal

* Appointment queue management
* Appointment status updates
* Patient record access
* Treatment session documentation
* Patient messaging

### Admin Portal

* User and doctor management
* Product and inventory management
* Order management
* Review moderation
* Financial and operational dashboard features
* Granular admin permissions

## Security Features

* JWT-based authentication for protected API endpoints
* Role-based authorization for patient, doctor, and admin workflows
* Granular admin permissions for sensitive dashboard actions
* bcrypt password hashing
* Server-side input validation
* CORS restrictions for allowed frontend origins
* Stripe webhook signature verification
* Database transactions for critical workflows such as orders, payments, cancellations, and stock updates

## Project Structure

```text
PURECLINC/
├── client/              # React frontend
├── server/              # Node.js / Express backend
├── database/            # Database schema, migrations, and seed files
├── .github/workflows/   # GitHub Actions deployment workflow
├── README.md
└── package-lock.json
```

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/othmanothm/PURECLINC.git
cd PURECLINC
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure backend environment variables

Create an environment file inside the `server` directory based on the required variables:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=pureskin_clinic

JWT_SECRET=change_this_to_a_strong_secret
JWT_EXPIRES_IN=1h

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM=your_sender_email

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

Do not commit real `.env` or secret files to GitHub.

### 4. Install frontend dependencies

```bash
cd ../client
npm install
```

### 5. Configure frontend environment variables

Create a `.env` file inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 6. Run the backend

```bash
cd ../server
npm run dev
```

The backend health check should be available at:

```text
http://localhost:5000/api/health
```

### 7. Run the frontend

```bash
cd ../client
npm run dev
```

The frontend should run locally at:

```text
http://localhost:5173
```

## Project Report

The full academic project report is available here:

[PureSkin Clinic Project Report](PureSkin_Clinic_Project_Report.pdf)

## Team

Academic Team Project — 2 developers

* Mohammad Abu Ismail
* Othman Othman

## My Contributions

* Contributed to full-stack implementation and frontend/backend integration.
* Worked on authentication and role-based access control workflows.
* Contributed to appointment booking logic and duplicate slot prevention.
* Participated in testing, deployment verification, and project documentation.
