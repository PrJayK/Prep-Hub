require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');   
const homeRouter = require('./server/routes/home');

const app = express();

// app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.use(session({
	secret: 'your_secret_key', // A secure, unique string
    resave: false, // Don't resave sessions that weren't modified
    saveUninitialized: false, // Create sessions even if no data is stored
    // Optional: Specify storage mechanism (e.g., database, cache)
}));

app.use('/', homeRouter);

app.listen(3000, () => console.log('Server listening on port 3000'));
