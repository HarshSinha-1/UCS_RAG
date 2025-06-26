import express from 'express';
import config from './configs/config';
import { createTables } from './Models/CreateTable';
import UserRouter from './Routes/UserRoute';
import session from 'express-session';
import passport from 'passport';
import './configs/passport-config';
import dotenv from 'dotenv';
import {verifyGoogleProfileAndLogin} from './configs/verifyGoogleTokenAndLogin'

dotenv.config();

async function startApp() {
  const app = express();

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Login with Google</title>
        <style>
          body {
            display: flex;
            height: 100vh;
            justify-content: center;
            align-items: center;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
          }
  
          .google-btn {
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            background-color: #fff;
            color: #444;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
            text-decoration: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease-in-out;
          }
  
          .google-btn:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            background-color: #f7f7f7;
          }
  
          .google-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <a class="google-btn" href="/auth/google">
          <img class="google-icon" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google icon" />
          Login with Google
        </a>
      </body>
      </html>
    `);
  });
  
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req: any, res) => {
    try {
      const { user, token } = await verifyGoogleProfileAndLogin(req.user);

      // Redirect or send token to frontend
      res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
    } catch (err) {
      res.status(500).send('OAuth failed: ' + (err as Error).message);
    }
  }
);

  
  app.get('/profile', (req, res) => {
    if (!req.user) return res.redirect('/');
    res.send(`<h1>Welcome ${JSON.stringify(req.user)}</h1>`);
  });
  
  app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) return res.send('Error logging out');
      res.redirect('/');
    });
  });
  
  app.use('/docChat/v1', UserRouter);

  await createTables();

  app.listen(config.port, () => {
    console.log('Server started at:', config.port);
  });
}

startApp();
