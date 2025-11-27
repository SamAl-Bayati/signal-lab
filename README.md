# AWS Project Template (React + Lambda)

This repo is a starter template for small portfolio projects
(eg. Signal Lab – EMG/EEG playground).

## Structure

- `frontend/` – React + Vite app (Amplify-ready)
- `backend/` – Express app wrapped with serverless-http (Lambda-ready)

## Local dev

1. Backend

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```
