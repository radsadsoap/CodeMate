import { Router } from 'express';
import {
    createSession,
    createSessionSchema,
    deleteSession,
    endSession,
    getSession,
    joinSession,
    listSessions,
    roomParamsSchema,
} from '../controllers/sessionController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();
const withRoom = validate(roomParamsSchema, 'params');

router.use(requireAuth);

router.get('/', listSessions);
router.post('/', validate(createSessionSchema), createSession);
router.get('/:roomId', withRoom, getSession);
router.post('/:roomId/join', withRoom, joinSession);
router.post('/:roomId/end', withRoom, endSession);
router.delete('/:roomId', withRoom, deleteSession);

export default router;
