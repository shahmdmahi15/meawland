/**
 * Converts a numeric monetary amount into standard capitalized words in Bangladeshi Taka.
 * Example: 619 -> "SIX HUNDRED NINETEEN TAKA ONLY"
 * Example: 1450.50 -> "ONE THOUSAND FOUR HUNDRED FIFTY TAKA AND FIFTY POISHA ONLY"
 */

const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];

const TENS = [
  "",
  "",
  "TWENTY",
  "THIRTY",
  "FORTY",
  "FIFTY",
  "SIXTY",
  "SEVENTY",
  "EIGHTY",
  "NINETY",
];

function convertLessThanThousand(num: number): string {
  let result = "";

  if (num >= 100) {
    result += `${ONES[Math.floor(num / 100)]} HUNDRED `;
    num %= 100;
  }

  if (num >= 20) {
    result += `${TENS[Math.floor(num / 10)]} `;
    num %= 10;
  }

  if (num > 0) {
    result += `${ONES[num]} `;
  }

  return result.trim();
}

export function convertAmountToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return "ZERO TAKA ONLY";
  }

  const rounded = Math.round(amount * 100) / 100;
  const takaPart = Math.floor(rounded);
  const poishaPart = Math.round((rounded - takaPart) * 100);

  let words = "";

  // Bangladeshi currency denominations (Crore, Lakh, Thousand, Hundred)
  let remaining = takaPart;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore > 0) {
    words += `${convertLessThanThousand(crore)} CRORE `;
  }

  if (lakh > 0) {
    words += `${convertLessThanThousand(lakh)} LAKH `;
  }

  if (thousand > 0) {
    words += `${convertLessThanThousand(thousand)} THOUSAND `;
  }

  if (remaining > 0) {
    words += `${convertLessThanThousand(remaining)} `;
  }

  words = words.trim();

  let finalString = words ? `${words} TAKA` : "";

  if (poishaPart > 0) {
    const poishaWords = convertLessThanThousand(poishaPart);
    if (finalString) {
      finalString += ` AND ${poishaWords} POISHA`;
    } else {
      finalString = `${poishaWords} POISHA`;
    }
  }

  return `${finalString} ONLY`.trim();
}
