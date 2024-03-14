const router = require('express').Router();
const loginRouter = require('./login');

router.get('/', (req, res) => {
    console.log(req);
    res.send("You've reached the home page!");
});

router.use('/login', loginRouter);

router.use('/dashboard', (req, res) => {
    if(!(req.session && req.session.passport)) {
        res.sendStatus(401);
    }

    const user = req.session.passport.user;
    res.send("Welcome! " + user.displayName);
});


router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

module.exports = router;