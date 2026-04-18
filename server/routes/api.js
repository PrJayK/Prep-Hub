import { Router } from 'express';
import { awsRouter } from './aws.js';
import adminRouter from './admin.js';
import contributionsRouter from './contributions.js';
import coursesRouter from './courses.js';
import searchRouter from './search.js';
import { chatRouter } from './chat.routes.js';
import { isLoggedIn } from '../middleware/auth.js';
import { getUserInfo } from '../services/courses/courses.service.js';

const router = Router();

router.use('/aws', awsRouter);

router.use('/admin', adminRouter);

router.use('/chat', chatRouter);

router.use('/contributions', contributionsRouter);

router.use('/search', searchRouter);

router.use(coursesRouter);

router.get('/me', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    try {
        const userInfo = await getUserInfo(profileId);
        res.json(userInfo);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

export default router;
