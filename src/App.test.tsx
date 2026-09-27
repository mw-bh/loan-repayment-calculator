import { render, screen, within } from '@testing-library/react';
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

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('£1,228.17')).toBeInTheDocument();
  expect(within(summary).getByText('£368,454.14')).toBeInTheDocument();
  expect(within(summary).getByText('£168,454.14')).toBeInTheDocument();
});

test('shows a full schedule that ends at £0.00', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText(/loan amount/i), '200000');
  await user.type(screen.getByLabelText(/annual interest rate/i), '5.5');
  await user.type(screen.getByLabelText(/loan term/i), '25');

  const table = screen.getByRole('table', {
    name: 'Repayment schedule over 300 months',
  });
  const [, ...bodyRows] = within(table).getAllByRole('row');
  expect(bodyRows).toHaveLength(300);
  expect(within(bodyRows[299]).getAllByRole('cell').at(-1)).toHaveTextContent(
    '£0.00',
  );
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
