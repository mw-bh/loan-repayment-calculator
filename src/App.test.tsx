import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import App from './App';

test('renders the app heading', () => {
  render(<App />);

  const heading = screen.getByRole('heading', {
    name: /loan repayment calculator/i,
  });

  expect(heading).toBeInTheDocument();
});

test('shows the repayment summary once all fields are valid', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText(/loan amount/i), '200000');
  await user.type(screen.getByLabelText(/annual interest rate/i), '5.5');
  await user.type(screen.getByLabelText(/loan term/i), '25');

  expect(screen.getByText('£1,228.17')).toBeInTheDocument();
  expect(screen.getByText('£368,452.50')).toBeInTheDocument();
  expect(screen.getByText('£168,452.50')).toBeInTheDocument();
});

test('does not show an error while the user is still typing', async () => {
  const user = userEvent.setup();
  render(<App />);
  const rate = screen.getByLabelText(/annual interest rate/i);

  await user.type(rate, '150');

  expect(rate).not.toBeInvalid();
});

test('shows an error after leaving an invalid field', async () => {
  const user = userEvent.setup();
  render(<App />);
  const rate = screen.getByLabelText(/annual interest rate/i);

  await user.type(rate, '150');
  await user.tab();

  expect(rate).toBeInvalid();
  expect(rate).toHaveAccessibleDescription(
    'Interest rate must be between 0 and 100',
  );
});
