import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/ui/authCard/AuthCard';
import { AuthFooterLink } from '@/features/auth/ui/authFooterLink/AuthFooterLink';
import { SignUpForm } from '@/features/auth/ui/signUpForm/SignUpForm';

export const metadata: Metadata = {
  title: 'Create account · NuMo',
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create account"
      tagline="Create your account with an email and a password."
      footer={
        <AuthFooterLink
          question="Already have an account?"
          linkText="Sign in"
          href="/login"
        />
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
