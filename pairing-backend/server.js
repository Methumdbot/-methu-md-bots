import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import makeWASocket from '@whiskeysockets/baileys';
import pino from 'pino';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
app.use(cors({ origin(origin, cb) { if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true); cb(new Error('Origin not allowed')); }}));
app.use(express.json({limit:'10kb'}));
app.use('/api/', rateLimit({windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message:{error:'Too many attempts. Wait 15 minutes and try again.'}}));
app.get('/health', (_req,res) => res.json({ok:true, service:'METHU MD Pairing API'}));
const pending = new Map();
const logger = pino({level:'silent'});

app.post('/api/pair', async (req,res) => {
  const number = String(req.body?.number || '').trim();
  if (!/^\d{8,15}$/.test(number) || number.startsWith('0')) return res.status(400).json({error:'Enter a valid international number: country code + number, digits only.'});
  if (pending.has(number)) return res.status(429).json({error:'A pairing request is already active for this number. Wait a little and try again.'});
  pending.set(number, true);
  let sock;
  try {
    const safeFolder = path.join('sessions', number);
    await fs.mkdir(safeFolder, {recursive:true});
    const { state, saveCreds } = await useMultiFileAuthState(safeFolder);
    if (state.creds.registered) return res.status(409).json({error:'This number already has a saved linked session on this server. Remove its session folder before requesting a new code.'});
    sock = makeWASocket({auth:state, logger, browser:['METHU MD BOTS','Chrome','1.0.0'], markOnlineOnConnect:false, syncFullHistory:false});
    sock.ev.on('creds.update', saveCreds);
    const code = await sock.requestPairingCode(number);
    res.json({code, message:'Open WhatsApp → Linked Devices → Link a Device → Link with phone number.'});
    // Keep the socket alive so WhatsApp can complete linking. Credentials persist in sessions/.
    setTimeout(() => { pending.delete(number); }, 3 * 60 * 1000).unref?.();
    sock.ev.on('connection.update', async ({connection}) => {
      if (connection === 'open' || connection === 'close') pending.delete(number);
    });
  } catch (error) {
    pending.delete(number);
    try { sock?.end?.(error); } catch {}
    console.error('Pairing request failed:', error?.message || error);
    if (!res.headersSent) res.status(502).json({error:'WhatsApp could not create a pairing code. Wait a few minutes and try again.'});
  }
});
app.listen(PORT, () => console.log(`METHU MD Pairing API listening on ${PORT}`));
