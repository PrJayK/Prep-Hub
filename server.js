import env from './server/config/env.js';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import homeRouter from './server/routes/home.js';
import { ingestionWorker } from './server/workers/sqs.worker.js';

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(session({
	secret: env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: env.MONGO_URL,
        collection: 'sessions'
    }),
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}));

app.use('/', homeRouter);

app.use((req, res) => res.sendStatus(404));

app.listen(3000, () => {
    ingestionWorker();
    
    console.log('Server started successfully...');
});
