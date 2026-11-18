import { render, screen } from '@testing-library/react';
import { AuthCard } from './AuthCard';

function renderAuthCard() {
  return render(
    <AuthCard
      title="Sign in"
      tagline="Track every expense, on your own machine."
    >
      <button type="button">Inside the card</button>
    </AuthCard>,
  );
}

describe('AuthCard', () => {
  it('should show the NuMo logo', () => {
    renderAuthCard();

    expect(screen.getByText('NuMo')).toBeVisible();
  });

  it('should show the title as the page heading, with the tagline', () => {
    renderAuthCard();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Track every expense, on your own machine.'),
    ).toBeInTheDocument();
  });

  it('should render its content inside the main landmark', () => {
    renderAuthCard();

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Inside the card' }),
    );
  });
});
