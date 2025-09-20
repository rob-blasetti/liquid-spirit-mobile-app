// Badi calendar constants
const BADI_EPOCH = new Date(Date.UTC(1844, 2, 21)); // March 21, 1844
// English-transliterated Badi month names (ASCII, no diacritics)
// English translations of the 20 Badi month names (in calendar order)
const BADI_MONTHS = [
  'Splendor',       // Bahá
  'Glory',          // Jalál
  'Beauty',         // Jamál
  'Grandeur',       // ‘Aẓamat
  'Light',          // Núr
  'Mercy',          // Raḥmat
  'Words',          // Kalimát
  'Perfection',     // Kamál
  'Names',          // Asmá’
  'Might',          // ‘Izzat
  'Will',           // Mashíyyat
  'Knowledge',      // ‘Ilm
  'Power',          // Qudrat
  'Speech',         // Qawl
  'Questions',      // Masá’il
  'Honour',         // S͟haraf
  'Sovereignty',    // Sulṭán
  'Dominion',       // Mulk
  'The Days of Há', // Ayyám-i-Há
  'Loftiness',      // ‘Alá’
];

// Helper: check if Gregorian year is a leap year
function isGregorianLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Get Naw-Rúz (March 21) of the given Gregorian year
function getNawRuzDate(gregorianYear) {
  return new Date(Date.UTC(gregorianYear, 2, 21)); // March 21
}

// Exported function: pass in a JS Date object, get Badi date
function getBadiDate(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  //not the most acurate, this could be fixed.
  let badiYear = date.getFullYear() - 1843;
  let nawRuzThisYear = getNawRuzDate(date.getFullYear());

  if (utcDate < nawRuzThisYear) {
    badiYear -= 1;
    nawRuzThisYear = getNawRuzDate(date.getFullYear() - 1);
  }

  const daysSinceNawRuz = Math.floor((utcDate - nawRuzThisYear) / (1000 * 60 * 60 * 24));
  let dayOfYear = daysSinceNawRuz + 1;

  let badiMonth, badiDay;

  const isLeap = isGregorianLeapYear(date.getFullYear());

  if (dayOfYear <= 18 * 19) {
    badiMonth = Math.ceil(dayOfYear / 19);
    badiDay = ((dayOfYear - 1) % 19) + 1;
  } else if (dayOfYear <= 18 * 19 + (isLeap ? 5 : 4)) {
    badiMonth = 20; // Ayyám-i-Há
    badiDay = dayOfYear - (18 * 19);
  } else {
    badiMonth = 19; // ‘Alá’
    badiDay = dayOfYear - (18 * 19 + (isLeap ? 5 : 4));
  }

  return {
    badiDay,
    badiMonthName: BADI_MONTHS[badiMonth - 1],
    badiYear,
    formatted: `${badiDay} ${BADI_MONTHS[badiMonth - 1]} ${badiYear} BE`,
  };
}

module.exports = { getBadiDate };
