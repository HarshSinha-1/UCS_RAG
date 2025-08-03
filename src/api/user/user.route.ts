import express from 'express';
import { handleUserQuery } from './user.controller';
import { UserAuthenticate } from '../../middlewares/auth.middleware';
import { getdocuments } from './user.services';

const UserRouter = express.Router();
//@ts-ignore
UserRouter.get('/query', [UserAuthenticate], handleUserQuery);
//@ts-ignore
UserRouter.get('/documents', getdocuments);

export default UserRouter;
