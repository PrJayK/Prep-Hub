const passport = require('passport');
const { Router } = require('express');

const router = Router();

const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/login/google/callback"
	},
	(accessToken, refreshToken, profile, cb) => {
		// User.findOrCreate({ googleId: profile.id }, function (err, user) {
		// });
		return cb(null, user);
  }
));

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

router.get('/google', () => {
    passport.authenticate('google', { scope : [ 'email', 'profile']});
});

router.get('/google/callback',
    passport.authenticate('google',
    {
        failureRedirect: '/login/auth/google/failure',
        successRedirect: '/'
    })
);

module.exports = router;