import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserGoogle } from '../db/db.js';
import env from '../config/env.js';

const router = Router();

router.use(passport.initialize());
router.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `/login/google/callback`,
    passReqToCallback: true
	},
	async (req, accessToken, refreshToken, profile, done) => {
        const profileId = String(profile.id);
        const email = profile.emails?.[0]?.value?.toLowerCase() || null;
        const existingUser = await UserGoogle.findOne({ profileId: profileId });

        if (!existingUser) {
            await UserGoogle.create({
                profileId: profileId,
                email,
                name: profile.displayName,
                role: "user",
                enrolledCourses: []
            });
        } else {
            const updates = {};

            if (existingUser.name !== profile.displayName) {
                updates.name = profile.displayName;
            }

            if (email && existingUser.email !== email) {
                updates.email = email;
            }

            if (Object.keys(updates).length > 0) {
                await UserGoogle.updateOne({ _id: existingUser._id }, { $set: updates });
            }
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
    res.redirect(`${env.FRONTEND_URL}/dashboard`);
});

export default router;
