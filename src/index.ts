import express from 'express';
import config from './configs/config';
import { createTables } from './Models/CreateTable';
import {errorHandler} from './middlewares/error.middleware';
import authRoutes from './api/auth/auth.routes';
import Adminrouter  from './api/admin/admin.router';
import session from 'express-session';
import passport from 'passport'; 
import dotenv from 'dotenv';
import UserRouter from './api/user/user.route';
import './configs/passport-config';  

dotenv.config();  // Load environment variables from .env file
const app = express();

app.use(express.json());
app.use(errorHandler);

//app.use('/api/user', userRoutes);
console.log(config.Session_secret)
app.use(session({
  secret: config.Session_secret,  // Set a secret key for session encryption
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());  // Initialize Passport.js
app.use(passport.session()); 
 
app.use('/auth', authRoutes);
app.use('/api/admin', Adminrouter);
app.use('/api/user', UserRouter);

 createTables();

app.listen(config.port, () => {
    console.log('Server started at:', config.port);
  });

export default app;
 