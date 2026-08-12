import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { generate } from './backend/chatbot.js';

const app = express();
const port = process.env.PORT || 3001;
const indexHtml = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const clientScript = readFileSync(new URL('./public/script.js', import.meta.url), 'utf8');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.type('html').send(indexHtml);
});

app.get('/script.js', (req, res) => {
    res.type('js').send(clientScript);
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log(message);
    try {
        const result = await generate(message);
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
