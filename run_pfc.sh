cd /opt/APPS/PFC/backend
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload &
cd /opt/APPS/PFC/frontend
pnpm run dev -p 3001 &
