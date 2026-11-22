'use server';

import type { RegisterResult } from '@/features/auth/domain/registration';
import type { Credentials } from '@/features/auth/domain/signIn';
import { register } from './authServerClient';

export async function registerAction(
  credentials: Credentials,
): Promise<RegisterResult> {
  return register(credentials);
}
