import { Router } from 'express';
import {
    login,
    loginSchema,
    logout,
    me,
    register,
    registerSchema,
    socketToken,
} from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', optionalAuth, me);
router.get('/socket-token', requireAuth, socketToken);

export default router;
