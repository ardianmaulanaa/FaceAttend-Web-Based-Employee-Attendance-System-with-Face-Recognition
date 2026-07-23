export const IDENTITY_VALIDATION = {
  phone: {
    label: "Nomor telepon",
    min: 10,
    max: 13,
  },
  nik: {
    label: "NIK",
    min: 16,
    max: 16,
  },
  bankAccount: {
    label: "No rekening",
    min: 10,
    max: 16,
  },
} as const;

type DigitRule = {
  label: string;
  min: number;
  max: number;
};

export function normalizeDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");

  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

export function getDigitRangeMessage(rule: DigitRule) {
  if (rule.min === rule.max) {
    return `${rule.label} harus berupa angka dan berjumlah tepat ${rule.min} digit.`;
  }

  return `${rule.label} harus berupa angka dengan panjang ${rule.min} sampai ${rule.max} digit.`;
}

export function validateDigitRange(value: string | null | undefined, rule: DigitRule) {
  if (!value) return null;

  if (!/^\d+$/.test(value)) {
    return `${rule.label} hanya dapat diisi angka.`;
  }

  if (value.length < rule.min || value.length > rule.max) {
    return getDigitRangeMessage(rule);
  }

  return null;
}

export function assertDigitRange(
  value: string | null | undefined,
  rule: DigitRule,
) {
  const errorMessage = validateDigitRange(value, rule);

  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

export function isValidPhoneNumber(value: string) {
  return validateDigitRange(value, IDENTITY_VALIDATION.phone) === null;
}

export function isValidNik(value: string) {
  return validateDigitRange(value, IDENTITY_VALIDATION.nik) === null;
}

export function isValidBankAccountNumber(value: string) {
  return validateDigitRange(value, IDENTITY_VALIDATION.bankAccount) === null;
}
