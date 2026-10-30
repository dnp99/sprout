/** Input language is independent of UI locale: capture channels have no locale
 * preference, and mixed-language merchant names must remain intact. */
const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};
const UNITS: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000, 萬: 10000 };

function chineseInteger(text: string): number | null {
  // 一百二 / 一万二 omit a place value and are ambiguous in speech. Let the
  // language model clarify rather than silently recording 102 / 10002.
  if (/[百千万萬][一二两兩三四五六七八九]$/.test(text)) return null;
  if (!/[十百千万萬]/.test(text)) {
    return Number([...text].map((character) => CHINESE_DIGITS[character]).join(""));
  }
  let total = 0;
  let section = 0;
  let digit = 0;
  for (const character of text) {
    const unit = UNITS[character];
    if (!unit) digit = CHINESE_DIGITS[character];
    else if (unit === 10000) {
      total += (section + digit || 1) * unit;
      section = 0;
      digit = 0;
    } else {
      section += (digit || 1) * unit;
      digit = 0;
    }
  }
  return total + section + digit;
}

/** Normalize written Chinese money and full-width digits before extraction.
 * Only amounts with currency units are rewritten; merchant names containing
 * numerals (such as 三星) must not become accidental amounts. No FX conversion. */
export function normalizeCaptureText(text: string): string {
  const normalized = text.normalize("NFKC");
  return (
    normalized
      // Decimal commas are unambiguous with one or two trailing digits; a
      // three-digit group stays a thousands separator in every UI language.
      .replace(/(\d+),(\d{1,2})(?![\d,])/g, "$1.$2")
      .replace(/花(?=\s*\d)/g, " ")
      .replace(
        /(\d+)(?:元|块|塊)([一二两兩三四五六七八九\d])(?:角|毛)?(?:([一二三四五六七八九\d])分?)?/g,
        (_match, whole: string, tenths: string, hundredths?: string) =>
          `${whole}.${CHINESE_DIGITS[tenths] ?? tenths}${hundredths ? (CHINESE_DIGITS[hundredths] ?? hundredths) : 0}元`,
      )
      .replace(
        /([零〇一二两兩三四五六七八九十百千万萬]+)(?:[点點]([零〇一二三四五六七八九]{1,2}))?\s*(?:加元|加币|加幣|美元|港元|人民币|人民幣|元|块钱|塊錢|块|塊)(?:([零〇一二两兩三四五六七八九])(?:角|毛)(?:([零〇一二三四五六七八九])分?)?)?/g,
        (_match, whole: string, fraction?: string, tenths?: string, hundredths?: string) => {
          const decimals = fraction
            ? [...fraction]
                .map((character) => CHINESE_DIGITS[character])
                .join("")
                .padEnd(2, "0")
            : `${tenths ? CHINESE_DIGITS[tenths] : 0}${hundredths ? CHINESE_DIGITS[hundredths] : 0}`;
          const integer = chineseInteger(whole);
          return integer === null ? _match : `${integer}.${decimals}元`;
        },
      )
  );
}

export const CAPTURE_EXPENSE = /花了|花费|花費|支出|消费|消費|支付|付了/;
export const CAPTURE_INCOME =
  /收到|收入|工资|工資|薪水|薪资|薪資|奖金|獎金|退款|退还|退還|报销|報銷|入账|入帳|收款/;
const CHINESE_NOISE =
  /(?:收到|收入|工资|工資|薪水|薪资|薪資|奖金|獎金|退款|退还|退還|报销|報銷|入账|入帳|收款)|(?:花了|花费|花費|支出了|支出|消费了|消費了|消费|消費|支付了|支付|付了|买了|買了)|(?:^|\s)(?:我|在|给|給|从|從|了)(?=\s|$)/g;

/** Unicode letters are retained by the caller; these are grammar words rather
 * than merchant text. Chinese has no spaces, so boundary-only stripping fails. */
export function stripCaptureGrammar(text: string): string {
  return text.replace(CHINESE_NOISE, " ").replace(/^[\s我在从從]+|[\s了]+$/g, " ");
}
