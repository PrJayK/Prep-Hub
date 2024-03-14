const { Router } = require('express');
const passport = require('passport');
const { UserGoogle } = require('../db/db.js')

const router = Router();

router.use(passport.initialize());
router.use(passport.session());

const GoogleStrategy = require('passport-google-oauth20').Strategy;

// console.log(process.env.GOOGLE_CLIENT_ID);
// console.log(process.env.GOOGLE_CLIENT_SECRET);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/login/google/callback",
    passReqToCallback: true
	},
	async (req, accessToken, refreshToken, profile, done) => {
        console.log(profile);
        const existingUser = await UserGoogle.findOne({profile_id: profile.id});
        console.log(existingUser);
        if(!existingUser) {
            await UserGoogle.create({
                profile_id: profile.id,
                name: profile.displayName
            });
        }
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

router.get('/', (req, res) => {
    passport.authenticate('google', { scope : [ 'email', 'profile']})(req, res);
});


router.get('/failure', (req, res) => {
    res.send("Something went wrong!");
});

router.get('/callback',
    passport.authenticate('google',
    {
        failureRedirect: '/login/google/failure',
        successRedirect: '/login/google/callbackSuccess'
    })
);

router.get('/callbackSuccess',(req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;