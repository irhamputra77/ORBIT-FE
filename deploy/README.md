# ORBIT production deployment

The production topology is:

```text
Browser -> HTTPS/Tailscale -> Nginx :8080 -> Next.js :3030 -> Backend :3001
```

All routes other than `/api-docs/`, including `/api/*`, must be sent to
Next.js. The application uses Next.js Route Handlers for authentication
cookies, request validation, multipart uploads, and forwarding requests to the
backend configured by `API_BASE_URL`.

## 1. Prepare the application

From `/home/irham/orbit/frontend/ORBIT-FE`:

```bash
npm ci
npm run build
```

Create the production environment file without committing it:

```bash
cp .env.example .env
```

At minimum, `.env` should contain:

```dotenv
API_BASE_URL=http://127.0.0.1:3001
```

## 2. Install the systemd service

If `command -v npm` does not return `/usr/bin/npm`, update `ExecStart` in
`deploy/systemd/orbit-frontend.service` before installing it.

```bash
sudo cp deploy/systemd/orbit-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now orbit-frontend
sudo systemctl status orbit-frontend
```

Follow its logs with:

```bash
journalctl -u orbit-frontend -f
```

## 3. Install the Nginx site

```bash
sudo cp deploy/nginx/orbit.conf /etc/nginx/sites-available/orbit
sudo ln -sfn /etc/nginx/sites-available/orbit /etc/nginx/sites-enabled/orbit
sudo nginx -t
sudo systemctl reload nginx
```

Disable another Nginx site only when it listens on the same address and port.

## 4. Verify

```bash
curl -I http://127.0.0.1:3030/login
curl -I http://127.0.0.1:8080/login
curl -I http://127.0.0.1:8080/api-docs/
```

After updating application code, rebuild and restart it:

```bash
npm ci
npm run build
sudo systemctl restart orbit-frontend
```
