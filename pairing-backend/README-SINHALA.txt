METHU MD BOTS — Pairing Backend Setup

1. Deploy this folder as a Node.js web service (Render or another Node host).
2. Build command: npm install
3. Start command: npm start
4. Set environment variable ALLOWED_ORIGINS to your exact GitHub Pages URL, e.g. https://methumdbot.github.io
5. After deployment, copy the service URL and paste it into website/app.js as PAIRING_API_URL.
6. Upload the updated website folder contents to your GitHub Pages repository.

IMPORTANT
- This is an unofficial WhatsApp Web integration using Baileys, not affiliated with WhatsApp.
- Pair only a WhatsApp number you own or have permission to link.
- Keep the sessions/ folder private. Never upload it to GitHub or share it.
- Free hosting may sleep or lose local session files. Use persistent storage for sessions in production.
- Add stronger abuse protection and persistent storage before opening this endpoint to the public. CORS is not authentication.
- Never expose private API keys or WhatsApp session credentials in the website frontend.
