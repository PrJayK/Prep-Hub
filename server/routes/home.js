const router = require('express').Router();
const { isLoggedIn } = require('../middleware/auth');
const loginRouter = require('./login');
const apiRouter = require('./api');

router.get('/', (req, res) => {
    console.log(req);
    res.send("You've reached the home page!");
});

router.use('/login', loginRouter);

router.use('/dashboard', isLoggedIn, (req, res) => {
    const user = req.session.passport.user;
    res.send("Welcome! " + user.displayName);
});

router.use('/api', apiRouter);

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});


module.exports = router;