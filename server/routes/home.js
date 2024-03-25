const router = require('express').Router();
const { isLoggedIn } = require('../middleware/auth');
const loginRouter = require('./login');
const apiRouter = require('./api');
const path = require('path');

router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

router.use('/login', loginRouter);

router.use('/dashboard', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, '../../', 'client', 'dist', 'index.html'));
});

router.use('/api', apiRouter);

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        return res.redirect('/login/google');
    });
});


module.exports = router;