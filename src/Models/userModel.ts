// src/models/userModel.ts

import pool from "./db";
import { Resend } from "resend";
import config from "../configs/config";

const resend = new Resend(String(config.api_resend));

export async function findUserByUsername(username: string) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0]; 
}

export async function createUser(username: string, password: string, email: string) {
  const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, password,]
  );
  return result.rows[0];
}

export async function CreateISVerifiedUser(email: string, otp: string) {
 try {
      const emailResponse = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'OTP Verification',
        html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
      });

      const result = await pool.query(
        'INSERT INTO user_verification (email,otp) VALUES ($1, $2) RETURNING *',
        [email, otp]
    );

    console.log('Resend email response:', emailResponse);
      if (emailResponse.error) {
        console.error('Resend email error:', emailResponse.error);
      }
    } catch (err) {
      console.error('Error sending email:', err);
    }
}
