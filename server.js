require('dotenv').config();

const express = require('express');
const session = require('express-session');
const homeRouter = require('./server/routes/home');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const MongoStore = require('connect-mongo');
const { mongoUrl } = require('./server/db/db');

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
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

app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.use('/', homeRouter);

app.listen(3000, () => console.log('Server listening on port 3000'));
