import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import userRouter from './routes/userRouter.js';

//Connect Database
await mongoose.connect(process.env.MONGO_URL);
console.log('Kasalingogh Database is connected');

const app = express();

app.use(express.json());

app.use(cors());

app.use('/api', userRouter)




const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`KasaLingoGh Server is active on ${port}`);
})