# HOTEL Deployment (Render + Vercel)

## 1. Backend on Render (Django)

1. Push project to GitHub.
2. On Render, create service from repo (or use `render.yaml`).
3. Ensure backend service uses:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `gunicorn myproject.wsgi:application`
4. Create Render PostgreSQL database and attach `DATABASE_URL`.
5. Set backend env vars:
   - `DEBUG=False`
   - `SECRET_KEY=<strong-random-secret>`
   - `ALLOWED_HOSTS=<your-backend>.onrender.com`
   - `FRONTEND_ORIGINS=https://<your-frontend>.vercel.app`
   - `DATABASE_URL=<from Render Postgres>`

## 2. Frontend on Vercel (React/Vite)

1. Import same GitHub repo in Vercel.
2. Set:
   - Framework: `Vite`
   - Root Directory: `frontend`
3. Add env var:
   - `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
4. Deploy.

## 3. Connect Both Sides

1. After first Vercel deploy, copy exact Vercel URL.
2. Update Render env `FRONTEND_ORIGINS` with that exact URL.
3. Redeploy backend.
4. Confirm API works:
   - `https://<your-backend>.onrender.com/api/me/` returns JSON.
5. Open frontend and test register/login/create order.

## 4. Important Notes

- Cookies/session tayari zimewekwa kwa cross-site production (`SameSite=None`, `Secure`) kwenye backend settings.
- SPA routes for frontend are handled in `frontend/vercel.json`.
- Frontend now reads API URL from `VITE_API_BASE_URL`.
