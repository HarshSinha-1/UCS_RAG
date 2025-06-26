import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
// @ts-ignore
import pool from '../Models/db';
import config from '../configs/config';
import genHashvalue from '../utils';
import { createUser , CreateISVerifiedUser } from '../Models/userModel';
import  JWT_SECRET  from '../configs/config'

const UserRouter = Router();

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;

const SignupSchema = z.object({
  username: z.string().min(3).max(10),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(passwordRegex, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
   email: z.string().email("Invalid email"),
});

const SignINSchema = z.object({
  username: z.string().min(3).max(10),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(passwordRegex, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

// Signup Route
//@ts-ignore
UserRouter.post('/signup', async (req :Request, res:Response) => {
  try {
    const validation = SignupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Incorrect input format",
        error : validation.error
       });
    }

    const { username, password, email } = validation.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const resend = new Resend(String(config.api_resend));
    const otp = await genHashvalue(4);

    const user = await createUser(username, email, hashedPassword);
    const is_verified = await CreateISVerifiedUser(email, otp);
    if (!user) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    return res.status(201).json({
      message: "User created successfully. Please verify your email.",
      email : email
    });
  } catch (error) {
    return res.status(500).json({ 
      message: "Internal Server Error", 
      error: error instanceof Error ? error.message : String(error) });
  }
});

// Email OTP Verification Route
// @ts-ignore
UserRouter.post('/verify', async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const result = await pool.query(
    'SELECT * FROM user_verification WHERE email = $1 AND otp = $2',
    [email, otp]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await pool.query(
    'UPDATE users SET is_verified = $1 WHERE email = $2',
    [true, email]
  );

  return res.status(200).json({ message: "Email verified successfully" });
});

//@ts-ignore
UserRouter.post('/signin', async(req:Request,res:Response) =>{
  const validation = SignINSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      message: "Incorrect input format",
      error  : validation.error});
  }
 
  const { username, password } = validation.data;
  
  const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (user.rows.length === 0) {
    return res.status(400).json({ message: "User not found" });
  }
  const hashedPassword = user.rows[0].password;
  const isMatch = await bcrypt.compare(password, hashedPassword);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }
  if (!user.rows[0].is_verified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }
  
  const token = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username }, String(JWT_SECRET), { expiresIn: '1h' });
  return res.status(200).json({
    message: "Login successful",
    token: token,
    user: {
      email: user.rows[0].email,
      is_verified: user.rows[0].is_verified
    }
  });
  

})

export default UserRouter;
