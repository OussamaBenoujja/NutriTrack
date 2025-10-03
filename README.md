<div align="center">
  <h1>NutriTrack</h1>
  <p><strong>Nutrition & Meal Tracking Platform</strong><br/>A pragmatic Node.js / Express application for meal logging, user health profiling, macro-based planning, and automated weekly reporting.</p>
  <img src="./src/ui/public/images/logo.svg" alt="NutriTrack" height="80" />
</div>

---

## 1. Overview
NutriTrack provides authenticated users with tooling to record meals, track nutritional intake, review automatically generated weekly summaries, and maintain a health profile that can drive personalized targets. The codebase favors clarity over abstraction and is suitable as a foundation for further clinical, coaching, or personal analytics extensions.

## 2. Core Features
| Domain | Capabilities |
|--------|--------------|
| Authentication | Session-based login / registration (bcrypt hashing) |
| Profile | Personal + health metrics, safe partial updates |
| Meals | Create and list meals with macro + micronutrient data placeholders |
| Weekly Reports | Automatic recomputation on each report page visit |
| Nutrition Plan | Auto-create baseline targets (calories/macros) |
| Recommendations | Persistence layer prepared (extensible) |
| Error Handling | Centralized middleware + dedicated error views |
| UI | EJS templating with shared partials and Tailwind CDN |

## 3. Technology Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js / Express | HTTP + routing |
| View Engine | EJS | Server-side templates |
| Styling | Tailwind CSS (CDN) | Utility-first styling |
| Database | MySQL (mysql2/promise) | Relational persistence |
| Auth | express-session + bcrypt | Cookie session management |
| Charts | Chart.js | Visual weekly metrics |
| Env Mgmt | dotenv | Loads `.env` at boot |

## 4. Directory Structure
```
src/
  app.js                # Application bootstrap
  persistence/          # DB pool & CRUD helpers
  services/             # Business logic (auth, plans, reports, etc.)
  ui/routes/            # Express route modules
  ui/views/             # EJS templates (layouts, partials, pages)
  ui/public/            # Static assets (css, js, images)
  uploads/              # Meal image uploads (hashed folders)
  utils/errorHandler.js # Central error middleware
```

## 5. Data Model (Operational Entities)
### Users
```
user_id, email, password_hash,
first_name, last_name, birth_date,
weight, height, activity_level,
health_conditions, profile_type,
description, created_at, updated_at
```
### Meals
```
meal_id, user_id, eaten_at, source,
calories, protein, carbs, fats,
sodium, sugar, gi_estimate,
photo_path, analysis_json
```
### Weekly Reports
```
report_id, user_id, week_start_date, week_end_date,
nutritional_summary(JSON), weight_evolution, performance_notes
```
### Nutrition Plans
```
plan_id, user_id, target_calories, target_proteins,
target_carbs, target_fats, max_sodium, max_sugar,
start_date, is_active
```

> The canonical schema should be applied from `persistence/queries/db.sql` (ensure migrations or schema setup is executed before running in production).

## 6. Environment Configuration
Create a `.env` file at repository root (or inject via deployment platform):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 9000 | HTTP listen port |
| DB_HOST | Yes | - | MySQL host name/IP |
| DB_USER | Yes | - | MySQL user with DML rights |
| DB_PASSWORD | Yes | - | MySQL user password |
| DB_NAME | Yes | - | Target database name |
| SESSION_SECRET | Yes | - | Session signing secret (high entropy) |
| NODE_ENV | No | development | Set to `production` for hardened behavior |

Example:
```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=nutri_user
DB_PASSWORD=strong_password_here
DB_NAME=nutritrack
SESSION_SECRET=change_this_to_a_long_random_string
NODE_ENV=production
```

## 7. Installation & Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (see above).
3. Apply schema:
   ```bash
   # Run the SQL content found in persistence/queries/db.sql using your MySQL client
   ```
4. Start server:
   ```bash
   npm start
   ```
5. Open: http://localhost:3000

## 8. Deployment (Production)
| Step | Action |
|------|--------|
| Build | (No build step – server rendered) |
| Install | `npm ci` for deterministic installs |
| Env | Provide all required variables securely |
| DB Migration | Execute schema before first deploy |
| Start | `NODE_ENV=production node src/app.js` (or process manager) |
| Process Mgmt | Use PM2 / systemd / container orchestrator |
| Logging | Pipe stdout/stderr to centralized logs |
| Backups | Schedule MySQL logical dumps (mysqldump) |

### Reverse Proxy (Example: Nginx)
```
location / {
  proxy_pass http://127.0.0.1:9000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### System Hardening Checklist
- Set `NODE_ENV=production`.
- Use a long, unique `SESSION_SECRET`.
- Enable HTTPS termination at proxy.
- Restrict DB user privileges to necessary tables.
- Fail2ban / WAF (optional depending on exposure).
- Regular dependency audit (`npm audit --production`).

## 9. Authentication & Session Model
1. Registration inserts hashed password (bcrypt).
2. Login normalizes email (lowercase) and compares hashes.
3. Session stored server-side (cookie contains session ID).
4. `res.locals.user` made available to views after authentication.
5. Route-level protection via lightweight `requireAuth` checks.

## 10. Profile & Data Integrity
- Partial update strategy: only provided non-empty fields modify state.
- Numeric validation for weight/height (positive values enforced).
- Future extension: allow explicit clearing with a flag (not implemented yet).

## 11. Weekly Report Computation
- Triggered on each `GET /reports/weekly` request.
- Aggregates historical meals per stored week range.
- Parsed JSON summaries enriched with derived averages if absent.
- Improvement path: incremental recompute (modified weeks only).

### Example nutritional_summary JSON
```json
{
  "totalCalories": 1432,
  "totalProtein": 98,
  "totalCarbs": 160,
  "totalFats": 45,
  "days": 7,
  "averageCalories": 204.6
}
```

## 12. Architecture (Execution Flow)
```
Client -> Express Route -> (Auth Middleware) -> Service Layer -> CRUD -> MySQL
                                 |                             ^
                                 v                             |
                            View Rendering (EJS) <-------------+
```

## 13. Error Handling Strategy
- Central middleware captures thrown errors.
- Specific templates for 403 / 404 / 500 / fallback conditions.
- Uncaught and unhandled promise rejections logged then process exits (fail-fast philosophy).

## 14. Logging & Observability (Current State)
- Console logging only (stdout).
- Add structured logging (e.g. pino / Winston) for production observability.
- Suggested metrics: request latency, meal creation count, report recompute duration.

## 15. Security Considerations
| Aspect | Current | Recommendation |
|--------|---------|----------------|
| Sessions | Memory store | Use Redis store in production |
| Passwords | bcrypt hashing | Tune cost factor per hardware |
| Input Validation | Basic (profile) | Add centralized validator (Joi/Zod) |
| Rate Limiting | None | Add reverse proxy or express-rate-limit |
| CSRF | Not enabled | Add csrf tokens for POST routes |
| Helmet | Not used | Add `helmet` middleware |

## 16. Testing Strategy (Planned)
| Layer | Coverage Intention |
|-------|--------------------|
| Services | Pure function & aggregation correctness |
| Routes | Auth gating + response codes |
| DB | CRUD integration smoke tests |
| Reports | Weekly aggregation edge cases |

## 17. Roadmap
- Meal photo analysis pipeline (nutrition extraction)
- Role-based access (coach/admin)
- Incremental week recomputation
- API layer (REST/GraphQL) for mobile clients
- Notification / reminder system
- Advanced macro goal periodization

## 18. Contribution Guidelines
1. Fork repository & create a branch (`feat/<short-name>`)
2. Ensure code style remains consistent (Prettier/ESLint—add if absent)
3. Include concise commit messages (imperative mood)
4. Provide screenshots / payload samples for UI or API changes
5. Open a Pull Request with a summary + validation notes

## 19. Operational Runbooks (Quick Reference)
| Task | Command / Action |
|------|------------------|
| Install dependencies | `npm ci` |
| Development start | `npm start` |
| Audit dependencies | `npm audit` |
| Update minor deps | `npm update` |
| DB backup (example) | `mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup.sql` |

## 20. License
Specify a license (e.g. MIT) by adding a `LICENSE` file.

## 21. Status
This repository is an actively evolving foundation. Production deployment requires session store hardening, logging improvements, and security middleware enhancements noted above.

---
For architectural or integration questions, open an issue with context, reproduction steps, and expected vs actual behavior.
