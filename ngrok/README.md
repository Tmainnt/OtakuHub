# Expose the local API through ngrok

The frontend calls a same-origin Next.js proxy in production. The proxy keeps ngrok's Basic Auth credentials on the server and forwards the user's OtakuHub Bearer token separately. The Go API still validates the JWT and role for application-level authorization.

## Configure ngrok

1. Install the ngrok agent and authenticate it on the backend machine with `ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>`. Keep this token in the agent's local config; do not put it in this repository or the frontend.
2. In the ngrok dashboard, create a Traffic Policy secret vault named `otakuhub-api` and add `basic-auth-password`. Use a long random password.
3. Use a stable ngrok HTTPS domain for this endpoint. The Vercel upstream URL must match it.

## Run locally

Start PostgreSQL and the backend. The backend binds to loopback by default so it is reachable by the ngrok agent on the same machine without listening on the LAN:

```powershell
cd backend
go run cmd/main.go
```

In another terminal, start the authenticated tunnel. Replace the domain with the HTTPS domain assigned to your ngrok account:

```powershell
ngrok http 8081 --url https://your-ngrok-domain.ngrok.app --traffic-policy-file ngrok/traffic-policy.yml
```

If running the command from the repository root, the policy path above is correct. If running it from `backend/`, use `../ngrok/traffic-policy.yml`.

## Configure Vercel

Add these server environment variables to the Vercel project:

```text
NEXT_PUBLIC_API_URL=/api
OTAKUHUB_API_UPSTREAM_URL=https://your-ngrok-domain.ngrok.app/api
NGROK_BASIC_AUTH_USER=otakuhub
NGROK_BASIC_AUTH_PASSWORD=<the same password stored in the ngrok vault>
```

Redeploy Vercel after changing environment variables. Do not use `NEXT_PUBLIC_` on either Basic Auth variable, and do not point `NEXT_PUBLIC_API_URL` directly at ngrok; that would expose the gateway credential to every browser.

The tunnel and the local backend must both stay running for Vercel to reach the API. If the ngrok URL changes, update `OTAKUHUB_API_UPSTREAM_URL` and redeploy.

## Security layers

- The ngrok Traffic Policy blocks requests without the gateway Basic Auth credentials before they reach the backend.
- The Vercel proxy adds those credentials server-side and strips the browser's `Authorization: Bearer ...` header from the Basic Auth slot. It forwards the app token as `X-Otaku-Authorization`.
- The backend validates the OtakuHub JWT and checks app roles as before.
- The local Go server binds to `127.0.0.1` by default. To run it on a hosting platform that requires a public bind address, set `BIND_ADDRESS=0.0.0.0` there.

ngrok references: [Traffic Policy](https://ngrok.com/docs/traffic-policy/), [Basic Auth](https://ngrok.com/docs/traffic-policy/actions/basic-auth/), [agent authentication](https://ngrok.com/docs/agent/).
