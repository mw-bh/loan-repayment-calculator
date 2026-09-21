import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "./App";

// A trivial smoke test to confirm the test runner is wired up correctly.
// Replace or expand this — the brief asks for at least one meaningful test.
test("renders the app heading", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /loan repayment calculator/i }),
  ).toBeInTheDocument();
});
