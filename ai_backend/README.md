# Punjab Test Generator AI Backend

Environment variables:
- GEMINI_API_KEY
- GEMINI_MODEL (default: gemini-3.8-flash)

Endpoints:
- GET /health
- GET /stats
- GET /questions
- POST /generate
- POST /jobs/plan

The API stores only validated, deduplicated, source-grounded original practice questions. The Gemini key stays server-side.
