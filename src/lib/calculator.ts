/** Parse only decimal arithmetic, never executable code. Rational BigInt values
 * avoid floating-point money drift; round once, to cents, at the boundary. */
export function calculateCents(expression: string): number | null {
  const source = expression
    .replace(/\s/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/,/g, ".");
  if (!source || source.length > 200) return null;
  let pos = 0;
  type Fraction = [bigint, bigint];
  function number(): Fraction {
    const match = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(pos));
    if (!match) throw Error();
    pos += match[0].length;
    const [whole, decimal = ""] = match[0].split(".");
    const sign = whole.startsWith("-") ? -1n : 1n;
    return [sign * BigInt(whole.replace(/[+-]/g, "") + decimal), 10n ** BigInt(decimal.length)];
  }
  function term(): Fraction {
    let [a, b] = number();
    while (source[pos] === "*" || source[pos] === "/") {
      const op = source[pos++];
      const [c, d] = number();
      if (op === "*") {
        a *= c;
        b *= d;
      } else {
        if (!c) throw Error();
        a *= d;
        b *= c;
      }
    }
    return [a, b];
  }
  try {
    let [a, b] = term();
    while (source[pos] === "+" || source[pos] === "-") {
      const op = source[pos++];
      const [c, d] = term();
      a = a * d + (op === "+" ? c : -c) * b;
      b *= d;
    }
    if (pos !== source.length || !b) return null;
    if (b < 0n) {
      a = -a;
      b = -b;
    }
    const cents = (a < 0n ? -1n : 1n) * (((a < 0n ? -a : a) * 100n + b / 2n) / b);
    const result = Number(cents);
    return Number.isSafeInteger(result) ? result : null;
  } catch {
    return null;
  }
}

/** Ungrouped decimal expression text must never reinterpret thousands as decimals. */
export function calculatorInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
