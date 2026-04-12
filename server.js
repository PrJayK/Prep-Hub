import './server/config/env.js';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import homeRouter from './server/routes/home.js';
import { mongoUrl } from './server/db/db.js';

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(session({
	secret: process.env.sessionSecret, 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUrl,
        collection: 'sessions'
    }),
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}));

app.use('/', homeRouter);

app.use((req, res) => res.sendStatus(404));

app.listen(3000, () => console.log('Server listening on port 3000'));
