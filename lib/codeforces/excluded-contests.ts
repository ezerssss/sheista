// Same exclusion list as the reference Training-Tracker:
// Kotlin / Microsoft Q# rounds and April Fools Day Contests, which have non-standard
// problemsets that do not fit the ThemeCP rating model.
export const EXCLUDED_CONTEST_IDS = new Set<number>([
  171, 290, 409, 784, 952, 1145, 1171, 1170, 1212, 1211, 1298, 1297, 1331,
  1347, 1346, 1489, 1488, 1505, 1532, 1533, 1570, 1571, 1663, 1812, 1911,
  1910, 1952, 1959, 1958, 2012, 2011, 1001, 1002, 1115, 1116, 1356, 1357,
]);

export const MIN_CONTEST_ID = 700;
