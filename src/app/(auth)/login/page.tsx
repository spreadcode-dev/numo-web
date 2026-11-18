import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/ui/authCard/AuthCard';
import { SignInForm } from '@/features/auth/ui/signInForm/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in · NuMo',
};

export default function SignInPage() {
  return (
    <AuthCard
      title="Sign in"
      tagline="Track every expense, on your own machine."
    >
      <SignInForm />
    </AuthCard>
  );
}
