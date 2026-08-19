export const formatPhoneInternational = (value: string): string => {
  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) return hasPlus ? "+" : "";
  const parts: string[] = [];
  parts.push(digits.slice(0, 3));
  const rest = digits.slice(3);
  for (let i = 0; i < rest.length; i += 4) {
    parts.push(rest.slice(i, i + 4));
  }
  return "+" + parts.join(" ");
};
