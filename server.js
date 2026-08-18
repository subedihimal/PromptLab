import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { generate, refreshHimalCVCache } from './backend/chatbot.js';

const app = express();
const port = process.env.PORT || 3001;
const indexHtml = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const clientScript = readFileSync(new URL('./public/script.js', import.meta.url), 'utf8');
const logo = readFileSync(new URL('./public/assets/promptlab-logo.png', import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.type('html').send(indexHtml);
});

app.get('/script.js', (req, res) => {
    res.type('js').send(clientScript);
});

app.get('/assets/promptlab-logo.png', (req, res) => {
    res.type('png').send(logo);
});

app.get('/api/refresh-cv-cache', async (req, res) => {
    if (!process.env.CRON_SECRET) {
        return res.status(503).json({ error: 'The refresh job is not configured.' });
    }

    if (req.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
        const result = await refreshHimalCVCache();
        res.json({ refreshed: true, ...result });
    } catch (err) {
        console.error('CV cache refresh failed:', err.message);
        res.status(502).json({ error: 'The CV cache could not be refreshed.' });
    }
});

app.post('/chat', async (req, res) => {
    const { message, history = [] } = req.body ?? {};
    if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'A message is required.' });
    }

    try {
        const result = await generate(message.trim(), history);
        res.json({ message: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}

export default app;
