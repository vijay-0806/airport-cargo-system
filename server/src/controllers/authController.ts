import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.ts';
import { LoginSchema } from '../validators/schemas.ts';
import { ENV } from '../config/env.ts';

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.issues.map((e: any) => e.message).join(', '),
    });
    return;
  }

  const { email, password } = parseResult.data;
  const user = dbStore.getUserByEmail(email);

  if (!user || !user.active) {
    res.status(401).json({
      success: false,
      error: 'Invalid email address or inactive account.',
    });
    return;
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({
      success: false,
      error: 'Incorrect password. Please verify credentials.',
    });
    return;
  }

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    ENV.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const user = dbStore.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User profile not found' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    },
  });
}
