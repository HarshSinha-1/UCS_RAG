import pool from "../Models/db";
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import config from "./config";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// services/googleOAuthService.ts

export async function verifyGoogleProfileAndLogin(profile: any) {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || "Unknown";
  
      if (!email) throw new Error("No email found in Google profile");
  
      let user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  
      if (user.rows.length === 0) {
        return {
          success: false,
          needsSignup: true,
          email,
          name
        };
      }
  
     const userData = user.rows[0];
  
      const token = jwt.sign(
        { id: userData.id, email: userData.email },
        config.JWT_SECRET!,
        { expiresIn: '0.5h' }
      );
  
      return {
        success: true,
        token,
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
  