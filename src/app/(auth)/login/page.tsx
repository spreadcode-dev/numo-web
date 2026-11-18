import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/ui/authCard/AuthCard';
import { AuthFooterLink } from '@/features/auth/ui/authFooterLink/AuthFooterLink';
import { SignInForm } from '@/features/auth/ui/signInForm/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in · NuMo',
};

export default async function SignInPage({
  searchParams,
}: PageProps<'/login'>) {
  const { registered } = await searchParams;

  return (
    <AuthCard
      title="Sign in"
      tagline="Track every expense, on your own machine."
      footer={
        <AuthFooterLink
          question="New to NuMo?"
          linkText="Create an account"
          href="/register"
        />
      }
    >
      <SignInForm isAfterSignUp={registered === '1'} />
    </AuthCard>
  );
}
