const { Router } = require('express');
const passport = require('passport');
const { UserGoogle } = require('../db/db.js');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const router = Router();

router.use(passport.initialize());
router.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `/login/google/callback`,
    passReqToCallback: true
	},
	async (req, accessToken, refreshToken, profile, done) => {
        const existingUser = await UserGoogle.findOne({profile_id: profile.id});
        if(!existingUser) {
            await UserGoogle.create({
                profile_id: profile.id,
                name: profile.displayName,
                enrolledCourses: []
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