const express = require('express');
const session = require('express-session');
const loginRouter = require('./routes/login');
const googleRouter = require('./routes/google');

require('dotenv').config();

const app = express();


// Configure session middleware
app.use(session({
	secret: 'your_secret_key', // A secure, unique string
    resave: false, // Don't resave sessions that weren't modified
    saveUninitialized: true, // Create sessions even if no data is stored
    // Optional: Specify storage mechanism (e.g., database, cache)
}));

app.use('/login', loginRouter);

// // Access session data in routes
// app.get('/login', (req, res) => {
//     console.log(req.session);
//     if (req.session.user) {
//         res.send('Welcome back, ' + req.session.user);
//     } else {
//         // Handle login logic and set session data
//         req.session.user = 'username';
//         res.send('Login successful!');
//     }
// });

// app.get('/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//           console.error(err);
//         } else {
//           res.clearCookie('session_id');
//           res.send('Session deleted');
//         }
// 	});
// 	//redirect to successfully signed out
// });

app.listen(3000, () => console.log('Server listening on port 3000'));
