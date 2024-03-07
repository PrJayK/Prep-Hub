const { Router } = require("express");
const { User } = require('../db/db');

const router = Router();

router.get('/', (req, res) => {
    res.send("<h1>Sign in</h1><a class=\"button google\" href=\"/login/google\">Sign in with Google</a>");
});

router.get('auth/google/failure', (req, res) => {
    res.send("Something went wrong");
});

router.post('/', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    await User.create({
        email : email,    
        password : password
    });

    res.json({
        message: 'Admin created successfully'
    });
});

module.exports = router;