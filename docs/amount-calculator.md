# Transaction amount calculator

Personal add forms (desktop/mobile) and group entry forms include an expandable calculator. The personal trigger sits beside the merchant text field; its keyboard opens below. Both Cozy and Vibrant use their semantic surface/accent tokens.

The expression field accepts decimal addition, subtraction, multiplication and division, with normal operator precedence. Users can type or use the buttons, clear, delete, then explicitly **Use amount** (or Enter). Only that action updates the draft amount; incomplete expressions never reach the saved amount. Negative results, division by zero, invalid syntax and unsafe integer results are rejected. A new digit starts a fresh calculation after opening/applying; an operator continues the current amount.

`src/lib/calculator.ts` parses a restricted grammar without eval or dynamic code. Rational BigInt arithmetic preserves exact decimal calculations and rounds once to integer cents at the result boundary. The original expense/income mode is retained. Opening/closing does not save a transaction.
