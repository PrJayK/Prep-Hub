const { Router } = require("express");
const googleRouter = require('./google');

const router = Router();

router.use('/google', googleRouter);

router.get('/', (req, res) => {
    res.redirect('/login/google');
});

module.exports = router;