import { Router } from "express";
import googleRouter from './google.js';

const router = Router();

router.use('/google', googleRouter);

router.get('/', (req, res) => {
    res.redirect('/login/google');
});

export default router;
