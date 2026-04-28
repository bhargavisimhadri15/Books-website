# Bhargavi Author Website - MERN

A full author book website with:
- Public book listing and book details
- Amazon/Flipkart buy buttons
- Contact form saved in MongoDB
- Author login
- Protected admin dashboard
- Add, edit, delete books
- Upload book cover image
- View and delete contact messages

## Setup

### 1. Install dependencies
```bash
npm run install-all
```

### 2. Backend env
Create `server/.env` from `server/.env.example`.

### 3. Start backend
```bash
cd server
npm run dev
```

### 4. Start frontend
Open another terminal:
```bash
cd client
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Deploy (Vercel)

### Frontend (Vercel)
- Push this repo to GitHub.
- In Vercel, import the repo and set **Root Directory** to `client`.
- Set Environment Variable `VITE_API_URL` to your backend API base URL (example: `https://your-backend-domain.com/api`).
- Deploy.

Note: `client/vercel.json` is included to make React Router routes work on refresh.

### Backend
Vercel is great for the frontend, but your backend needs:
- MongoDB env vars (`MONGO_URI`, `JWT_SECRET`)
- A host that supports long-running Node servers (or you must convert to serverless functions)
- **Image uploads**: Vercel serverless filesystem is not persistent, so use a host with persistent storage or switch uploads to Cloudinary/S3.

Recommended: deploy `server` to Render / Railway / a VPS, then point `VITE_API_URL` to that backend.

## Create author account
Use the register endpoint once with Postman/Thunder Client:

POST http://localhost:5000/api/auth/register

```json
{
  "name": "Bhargavi Simhadri",
  "email": "yourmail@gmail.com",
  "password": "yourpassword"
}
```

Then login from website `/login`.
