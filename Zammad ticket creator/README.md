# Zammad Silent Ticket Creator

A minimal React web frontend for creating silent tickets in Zammad via a simple form. Silent tickets use internal notes only, ensuring no public visibility.

## Features

- Customer Email selection: Internal email, existing users (searchable), or custom input.
- Ticket Name (text) and Initial Note (textarea).
- Validation for email format and required fields.
- Success/error toasts on submission.
- Uses Zammad API for user fetch, current user resolution, and ticket creation.

## Setup

1. Clone or download the project.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Zammad details:
   ```
   ZAMMAD_BASE_URL=https://your-zammad-instance.com
   VITE_ZAMMAD_TOKEN=your_api_token_here
   VITE_DEFAULT_GROUP=Support  # Your default group name
   VITE_DEFAULT_STATE_ID=2     # e.g., 2 for 'open'
   VITE_DEFAULT_TAGS=internal,silent  # Comma-separated tags
   VITE_INTERNAL_EMAIL=internal@example.com  # Your internal email
   ```
4. Run the development server:
   ```
   npm run dev
   ```
   Open http://localhost:5173/ in your browser.

5. Build for production:
   ```
   npm run build
   ```
   Output in `dist/` folder.

## How Silent Tickets Work

- On submit, the app fetches your user ID (`/api/v1/users/me`).
- Creates a ticket with `customer_id: "guess:<email>"` for customer assignment.
- The article is set as `internal: true, type: "note"` to ensure it's internal-only (no public article created).
- Owner assigned to you, with fixed group, state, and tags from env.
- No customer notification sent due to internal nature.

## Testing

- Run e2e tests:
  ```
  npx playwright test
  ```
- Tests cover happy path form submission (mock API if needed).

## Docker

### Build and Run with Docker

1. Build the image:
   ```
   docker build -t zammad-ticket-creator .
   ```

2. Run the container (replace env vars with your Zammad config):
   ```
   docker run -p 80:80 \
     -e VITE_ZAMMAD_BASE_URL=https://your-zammad-instance.com \
     -e VITE_ZAMMAD_TOKEN=your_api_token_here \
     -e VITE_DEFAULT_GROUP=Support \
     -e VITE_DEFAULT_STATE_ID=2 \
     -e VITE_DEFAULT_TAGS=internal,silent \
     -e VITE_INTERNAL_EMAIL=internal@example.com \
     zammad-ticket-creator
   ```
   Access the app at http://localhost.

### Docker Compose

1. Copy `.env.example` to `.env` and fill in your Zammad details (ZAMMAD_BASE_URL and VITE_* vars).

2. Start the stack:
   ```
   docker compose up -d
   ```
   Access at http://localhost.

3. Stop and remove:
   ```
   docker compose down
   ```

### Production Notes

- The Dockerfile uses multi-stage build for a lightweight image (~150MB).
- Env vars are baked in at build time (rebuild for changes); for dynamic runtime env, consider a backend proxy or rebuild process.
- Optional: Mount custom Nginx config with volume `-v ./nginx.conf:/etc/nginx/conf.d/default.conf`.
- For HTTPS, add reverse proxy (e.g., Traefik) in Compose or use cloud hosting.

### Troubleshooting Docker

- If Nginx fails to start with "invalid number of arguments in proxy_set_header", ensure ZAMMAD_BASE_URL is set in .env and entrypoint.sh exports ZAMMAD_HOST correctly (fixed in current version).
- API calls failing to localhost: Verify proxy in generated /etc/nginx/conf.d/default.conf (use docker logs to see preview).
- Env vars not loading: Use `env_file: .env` in docker-compose.yml; rebuild with --build.

### Traefik Integration (For Later Deployment)

To deploy behind Traefik, add Docker labels to the `app` service in `docker-compose.yml` for routing. Traefik will handle proxying `/zammad-api/*` directly to Zammad, bypassing the container's Nginx proxy.

Example labels (add under `app:` service):
```
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.zammad.rule=Host(`yourdomain.com`)"
  - "traefik.http.routers.zammad.entrypoints=websecure"
  - "traefik.http.routers.zammad.tls.certresolver=letsencrypt"
  - "traefik.http.services.zammad.loadbalancer.server.port=80"
  # For API routing: Create a middleware to strip /zammad-api and route to Zammad
  - "traefik.http.routers.zammad-api.rule=Host(`yourdomain.com`) && PathPrefix(`/zammad-api`)"
  - "traefik.http.routers.zammad-api.middlewares=strip-api"
  - "traefik.http.middlewares.strip-api.stripprefix.prefixes=/zammad-api"
  - "traefik.http.middlewares.strip-api.stripprefix.forwardslash=true"
  # Backend for API: Define a service pointing to Zammad
  - "traefik.http.services.zammad-api.loadbalancer.server.url=https://your-zammad-instance.com"
```

- Static assets route: The main router forwards non-API paths to the container.
- API route: Separate router for `/zammad-api/*`, strips prefix, forwards to Zammad URL (set in Traefik dynamic config or env).
- Ensure Traefik dashboard is configured for middleware/services.
- For full setup, add Traefik service to compose (not included here; use official Traefik docs).

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS for styling
- Fetch API for Zammad integration
- react-hot-toast for notifications
- Playwright for e2e testing

## API Endpoints Used

- GET `/api/v1/users` - Fetch user emails for selection
- GET `/api/v1/users/me` - Get current user ID
- POST `/api/v1/tickets` - Create ticket with internal article

Ensure your Zammad API token has permissions for these actions.
