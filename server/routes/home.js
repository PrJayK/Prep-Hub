import { Router } from 'express';
import loginRouter from './login.js';
import apiRouter from './api.js';

const router = Router();

// router.get('/', (req, res) => {
//     res.redirect('/dashboard');
// });

router.use('/login', loginRouter);

router.use('/api', apiRouter);

// router.use('/dashboard', isLoggedIn, (req, res) => {
//     res.sendFile(path.join(__dirname, '../../', 'client', 'dist', 'index.html'));
// });

// router.get('/upload', isLoggedIn, (req, res) => {
//     res.sendFile(path.join(__dirname, '../../', 'client', 'app', 'pages', 'upload.html'));
// });

router.get('/logout', (req, res) => {
    if (typeof req.logout === 'function') {
        req.logout();
    }

    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }

        return res.sendStatus(200);
    });
});


export default router;
