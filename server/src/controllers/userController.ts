import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore, UserDoc } from '../services/dbStore.ts';

export async function getUsers(req: Request, res: Response): Promise<void> {
  const users = dbStore.getAllUsers();
  res.status(200).json({
    success: true,
    data: users,
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    return;
  }

  if (dbStore.getUserByEmail(email)) {
    res.status(409).json({ success: false, error: 'User with this email already exists.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 8);
  const now = new Date().toISOString();
  const newUser: UserDoc = {
    _id: `usr-${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: role === 'ADMIN' ? 'ADMIN' : 'WAREHOUSE_STAFF',
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.users.set(newUser._id, newUser);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: newUser.active,
    },
  });
}

export async function resetSeed(req: Request, res: Response): Promise<void> {
  await dbStore.initSeed(true);
  res.status(200).json({
    success: true,
    message: 'Demo database re-seeded successfully with fresh airport records.',
  });
}
