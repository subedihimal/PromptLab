import express from 'express';
import { generate } from './chatbot.js';

const app = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to PromptLab");
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
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})