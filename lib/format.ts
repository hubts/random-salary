export const fmt = (n: number) => n.toLocaleString("ko-KR");

export const fmtWon = (n: number) => {
  if (n >= 10000) {
    const eok = Math.floor(n / 10000);
    const man = n % 10000;
    return man > 0 ? `${eok}억 ${fmt(man)}만원` : `${eok}억원`;
  }
  return `${fmt(n)}만원`;
};

export const fmtShort = (n: number) => {
  if (n >= 10000) {
    const eok = n / 10000;
    const rounded = Number.isInteger(eok) ? eok.toString() : eok.toFixed(1);
    return `${rounded}억`;
  }
  return `${fmt(n)}만`;
};
