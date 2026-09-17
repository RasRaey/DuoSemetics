/**
 * ፊደል — the Ge'ez abugida used to write Tigrinya.
 *
 * Each consonant has seven "orders" (ደረጃታት). The base shape carries the
 * consonant; the order is marked by small strokes, loops and leg changes.
 * Order 6 (ሳድስ) is the bare consonant with no vowel, which is why it shows up
 * everywhere inside words.
 */

export interface FidelOrder {
  /** Traditional Ge'ez name of the order. */
  name: string;
  /** The vowel the order adds, in transliteration. */
  vowel: string;
  hint: string;
}

export const ORDERS: FidelOrder[] = [
  { name: 'ግዕዝ', vowel: 'ä', hint: 'the base shape — a short "uh" as in about' },
  { name: 'ካዕብ', vowel: 'u', hint: 'usually a stroke on the right side' },
  { name: 'ሳልስ', vowel: 'i', hint: 'usually a low stroke on the right' },
  { name: 'ራብዕ', vowel: 'a', hint: 'often a shortened or bent left leg' },
  { name: 'ሓምስ', vowel: 'e', hint: 'usually a small loop at the foot' },
  { name: 'ሳድስ', vowel: 'ə', hint: 'no vowel — the bare consonant' },
  { name: 'ሳብዕ', vowel: 'o', hint: 'usually a stroke or loop on the left' },
];

export interface FidelRow {
  /** Row id, e.g. "he". */
  id: string;
  /** Latin name of the consonant. */
  consonant: string;
  /** The seven characters, order 1 → 7. */
  chars: string[];
  /** Transliteration of each character, order 1 → 7. */
  reads: string[];
  /** Learner note about the sound. */
  note?: string;
}

const R = (
  id: string,
  consonant: string,
  chars: string,
  reads: string[],
  note?: string,
): FidelRow => ({ id, consonant, chars: [...chars], reads, note });

/**
 * Rows are ordered as they are taught in Eritrean and Tigrayan schools, which
 * is also the order used on keyboards and in dictionaries.
 */
export const FIDEL: FidelRow[] = [
  R('he', 'h', 'ሀሁሂሃሄህሆ', ['hä', 'hu', 'hi', 'ha', 'he', 'hə', 'ho']),
  R('le', 'l', 'ለሉሊላሌልሎ', ['lä', 'lu', 'li', 'la', 'le', 'lə', 'lo']),
  R('hhe', 'ḥ', 'ሐሑሒሓሔሕሖ', ['ḥä', 'ḥu', 'ḥi', 'ḥa', 'ḥe', 'ḥə', 'ḥo'], 'A breathy h from the throat — deeper than ሀ.'),
  R('me', 'm', 'መሙሚማሜምሞ', ['mä', 'mu', 'mi', 'ma', 'me', 'mə', 'mo']),
  R('se2', 'ś', 'ሠሡሢሣሤሥሦ', ['śä', 'śu', 'śi', 'śa', 'śe', 'śə', 'śo'], 'Pronounced the same as ሰ today; kept for older spellings.'),
  R('re', 'r', 'ረሩሪራሬርሮ', ['rä', 'ru', 'ri', 'ra', 're', 'rə', 'ro']),
  R('se', 's', 'ሰሱሲሳሴስሶ', ['sä', 'su', 'si', 'sa', 'se', 'sə', 'so']),
  R('she', 'sh', 'ሸሹሺሻሼሽሾ', ['shä', 'shu', 'shi', 'sha', 'she', 'shə', 'sho']),
  R('qe', 'q', 'ቀቁቂቃቄቅቆ', ['qä', 'qu', 'qi', 'qa', 'qe', 'qə', 'qo'], 'An ejective k — snap it at the back of the mouth.'),
  R('be', 'b', 'በቡቢባቤብቦ', ['bä', 'bu', 'bi', 'ba', 'be', 'bə', 'bo']),
  R('ve', 'v', 'ቨቩቪቫቬቭቮ', ['vä', 'vu', 'vi', 'va', 've', 'və', 'vo'], 'Mostly for loanwords.'),
  R('te', 't', 'ተቱቲታቴትቶ', ['tä', 'tu', 'ti', 'ta', 'te', 'tə', 'to']),
  R('che', 'ch', 'ቸቹቺቻቼችቾ', ['chä', 'chu', 'chi', 'cha', 'che', 'chə', 'cho']),
  R('ne', 'n', 'ነኑኒናኔንኖ', ['nä', 'nu', 'ni', 'na', 'ne', 'nə', 'no']),
  R('nye', 'ñ', 'ኘኙኚኛኜኝኞ', ['ñä', 'ñu', 'ñi', 'ña', 'ñe', 'ñə', 'ño'], 'Like the ny in canyon.'),
  R('ae', 'ʔ', 'አኡኢኣኤእኦ', ['ʔä', 'ʔu', 'ʔi', 'ʔa', 'ʔe', 'ʔə', 'ʔo'], 'The vowel carriers — a glottal stop plus the vowel.'),
  R('ke', 'k', 'ከኩኪካኬክኮ', ['kä', 'ku', 'ki', 'ka', 'ke', 'kə', 'ko']),
  R('khe', 'ḵ', 'ኸኹኺኻኼኽኾ', ['ḵä', 'ḵu', 'ḵi', 'ḵa', 'ḵe', 'ḵə', 'ḵo'], 'A soft, breathy k — like ch in Scottish loch.'),
  R('we', 'w', 'ወዉዊዋዌውዎ', ['wä', 'wu', 'wi', 'wa', 'we', 'wə', 'wo']),
  R('aye', 'ʕ', 'ዐዑዒዓዔዕዖ', ['ʕä', 'ʕu', 'ʕi', 'ʕa', 'ʕe', 'ʕə', 'ʕo'], 'A tight squeeze in the throat before the vowel.'),
  R('ze', 'z', 'ዘዙዚዛዜዝዞ', ['zä', 'zu', 'zi', 'za', 'ze', 'zə', 'zo']),
  R('zhe', 'zh', 'ዠዡዢዣዤዥዦ', ['zhä', 'zhu', 'zhi', 'zha', 'zhe', 'zhə', 'zho']),
  R('ye', 'y', 'የዩዪያዬይዮ', ['yä', 'yu', 'yi', 'ya', 'ye', 'yə', 'yo']),
  R('de', 'd', 'ደዱዲዳዴድዶ', ['dä', 'du', 'di', 'da', 'de', 'də', 'do']),
  R('je', 'j', 'ጀጁጂጃጄጅጆ', ['jä', 'ju', 'ji', 'ja', 'je', 'jə', 'jo']),
  R('ge', 'g', 'ገጉጊጋጌግጎ', ['gä', 'gu', 'gi', 'ga', 'ge', 'gə', 'go']),
  R('tte', "t'", 'ጠጡጢጣጤጥጦ', ["t'ä", "t'u", "t'i", "t'a", "t'e", "t'ə", "t'o"], 'An ejective t — sharp and popped.'),
  R('chhe', "ch'", 'ጨጩጪጫጬጭጮ', ["ch'ä", "ch'u", "ch'i", "ch'a", "ch'e", "ch'ə", "ch'o"], 'An ejective ch.'),
  R('phe', "p'", 'ጰጱጲጳጴጵጶ', ["p'ä", "p'u", "p'i", "p'a", "p'e", "p'ə", "p'o"], 'An ejective p — rare.'),
  R('tse', "ts'", 'ጸጹጺጻጼጽጾ', ["ts'ä", "ts'u", "ts'i", "ts'a", "ts'e", "ts'ə", "ts'o"], 'An ejective ts.'),
  R('tse2', "ts'", 'ፀፁፂፃፄፅፆ', ["ts'ä", "ts'u", "ts'i", "ts'a", "ts'e", "ts'ə", "ts'o"], 'Same sound as ጸ today; kept for older spellings.'),
  R('fe', 'f', 'ፈፉፊፋፌፍፎ', ['fä', 'fu', 'fi', 'fa', 'fe', 'fə', 'fo']),
  R('pe', 'p', 'ፐፑፒፓፔፕፖ', ['pä', 'pu', 'pi', 'pa', 'pe', 'pə', 'po']),
];

export const FIDEL_BY_ID: Record<string, FidelRow> = Object.fromEntries(
  FIDEL.map((r) => [r.id, r]),
);

/** Ge'ez numerals ፩–፲, shown alongside the number lesson. */
export const GEEZ_NUMERALS: { glyph: string; value: number }[] = [
  { glyph: '፩', value: 1 },
  { glyph: '፪', value: 2 },
  { glyph: '፫', value: 3 },
  { glyph: '፬', value: 4 },
  { glyph: '፭', value: 5 },
  { glyph: '፮', value: 6 },
  { glyph: '፯', value: 7 },
  { glyph: '፰', value: 8 },
  { glyph: '፱', value: 9 },
  { glyph: '፲', value: 10 },
];

/** Punctuation learners meet immediately. */
export const PUNCTUATION = [
  { glyph: '፡', name: 'ሰረዝ', use: 'word separator (older texts; a space is normal today)' },
  { glyph: '።', name: 'ኣርባዕተ ነጥቢ', use: 'full stop' },
  { glyph: '፣', name: 'ነጠላ ሰረዝ', use: 'comma' },
  { glyph: '፤', name: 'ድርብ ሰረዝ', use: 'semicolon' },
  { glyph: '፧', name: 'ትእምርተ ሕቶ', use: 'question mark' },
];

/** Every single character, flattened — used to build script drills. */
export interface FidelChar {
  char: string;
  read: string;
  rowId: string;
  order: number;
}

export const ALL_CHARS: FidelChar[] = FIDEL.flatMap((row) =>
  row.chars.map((char, i) => ({ char, read: row.reads[i], rowId: row.id, order: i })),
);
