const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+convertChunk(n%100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const integer = Math.floor(Math.abs(num));
  const paise   = Math.round((Math.abs(num) - integer) * 100);
  let words = '';
  if (integer >= 10000000) words += convertChunk(Math.floor(integer/10000000)) + ' Crore ';
  const r1 = integer % 10000000;
  if (r1 >= 100000) words += convertChunk(Math.floor(r1/100000)) + ' Lakh ';
  const r2 = r1 % 100000;
  if (r2 >= 1000)   words += convertChunk(Math.floor(r2/1000))   + ' Thousand ';
  const r3 = r2 % 1000;
  if (r3 > 0) words += convertChunk(r3);
  words = words.trim() + ' Rupees';
  if (paise > 0) words += ' and ' + convertChunk(paise) + ' Paise';
  words += ' Only';
  return words;
}
