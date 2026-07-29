import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());
app.get('/', (req, res) => {
    res.send("Welcome to PromptLab");
});

app.post('/chat',(req,res)=>{
    const {message} = req.body;
    console.log(message);
    res.json({ message: 'OK'})
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})