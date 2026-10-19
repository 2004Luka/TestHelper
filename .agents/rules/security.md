# Security & Privacy Rules

## Environment and Secret Protection
- **Strict Prohibition on Secret Files:** NEVER read, view, search, edit, or create `.env`, `.env.local`, `.env.production`, or any file containing private credentials, API keys, or production secrets.
- **Use Template Files Exclusively:** ONLY inspect, reference, or modify `.env.example` or documentation template files.
- **Instruct the User for Secrets:** If a new environment variable or configuration key is needed, document it in `.env.example` and explicitly instruct the user to configure it in their own `.env` file manually.
