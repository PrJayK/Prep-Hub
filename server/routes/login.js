const { Router } = require("express");
const googleRouter = require('./google');

const router = Router();

router.use('/google', googleRouter);

router.get('/', (req, res) => {
    res.send("<h1>Sign in</h1><a class=\"button google\" href=\"/login/google\">Sign in with Google</a>");
});

module.exports = router;