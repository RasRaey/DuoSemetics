/**
 * Tigrinya lexicon (ትግርኛ).
 *
 * Every entry carries the Ge'ez spelling, a Latin transliteration, the English
 * gloss and — where one exists — an emoji used by the "pick the picture"
 * exercise. `gender` is only set where a word's grammatical gender changes the
 * copula or adjective agreement used in generated sentences.
 *
 * Transliteration follows a light, learner-friendly scheme rather than strict
 * academic romanisation:
 *   ḥ = ሓ-family   ḵ = ኸ-family   ʕ = ዓ-family
 *   t' ch' ts' p' q = ejectives (ጠ ጨ ጸ ጰ ቀ)
 */

export type PartOfSpeech =
  | 'greeting'
  | 'pronoun'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'number'
  | 'question'
  | 'particle'
  | 'phrase';

export interface Word {
  /** Stable id used by the curriculum and the SRS store. */
  id: string;
  /** Ge'ez script. */
  ti: string;
  /** Latin transliteration. */
  tr: string;
  /** English gloss. */
  en: string;
  /** Extra accepted English answers when typing / grading. */
  alt?: string[];
  pos: PartOfSpeech;
  /** Emoji used for picture-choice exercises. Absent = not picturable. */
  emoji?: string;
  gender?: 'm' | 'f';
  /** Short learner note surfaced on the word detail sheet. */
  note?: string;
}

const W = (w: Word) => w;

export const WORDS: Word[] = [
  // ─── Greetings & courtesy ──────────────────────────────────────────────
  W({ id: 'selam', ti: 'ሰላም', tr: 'selam', en: 'hello', alt: ['peace', 'hi'], pos: 'greeting', emoji: '👋', note: 'Literally "peace". Works as hello, goodbye and as a wish for peace.' }),
  W({ id: 'kemey_aleka', ti: 'ከመይ ኣለኻ', tr: 'kemey aleḵa', en: 'how are you', pos: 'phrase', emoji: '🙋‍♂️', note: 'Said to a man. To a woman: ከመይ ኣለኺ (kemey aleḵi).' }),
  W({ id: 'kemey_aleki', ti: 'ከመይ ኣለኺ', tr: 'kemey aleḵi', en: 'how are you', pos: 'phrase', emoji: '🙋‍♀️', note: 'Said to a woman.' }),
  W({ id: 'kemey_alekum', ti: 'ከመይ ኣለኹም', tr: 'kemey aleḵum', en: 'how are you all', pos: 'phrase', note: 'Plural, also used as the polite form for one person.' }),
  W({ id: 'tsbuq', ti: 'ጽቡቕ', tr: "ts'buq", en: 'good', alt: ['fine', 'nice'], pos: 'adjective', emoji: '👍' }),
  W({ id: 'tsbuq_aleku', ti: 'ጽቡቕ ኣለኹ', tr: "ts'buq aleḵu", en: 'I am fine', pos: 'phrase', emoji: '😊' }),
  W({ id: 'yeqenyeley', ti: 'የቐንየለይ', tr: 'yeqenyeley', en: 'thank you', alt: ['thanks'], pos: 'phrase', emoji: '🙏' }),
  W({ id: 'btami', ti: 'ብጣዕሚ', tr: "bt'aʕmi", en: 'very', alt: ['very much'], pos: 'particle' }),
  W({ id: 'dehan_kun', ti: 'ደሓን ኩን', tr: 'deḥan kun', en: 'goodbye', alt: ['bye', 'farewell'], pos: 'phrase', emoji: '👋', note: 'Literally "stay well", said to a man. To a woman: ደሓን ኩኒ (deḥan kuni).' }),
  W({ id: 'dehan_kuni', ti: 'ደሓን ኩኒ', tr: 'deḥan kuni', en: 'goodbye', alt: ['bye'], pos: 'phrase', note: 'Said to a woman.' }),
  W({ id: 'dehan', ti: 'ደሓን', tr: 'deḥan', en: 'well', alt: ['fine', 'okay', 'ok'], pos: 'adjective' }),
  W({ id: 'ewe', ti: 'እወ', tr: 'ewe', en: 'yes', pos: 'particle', emoji: '✅' }),
  W({ id: 'ayfal', ti: 'ኣይፋል', tr: 'ayfal', en: 'no', pos: 'particle', emoji: '❌' }),
  W({ id: 'yqreta', ti: 'ይቕረታ', tr: 'yqreta', en: 'sorry', alt: ['excuse me', 'pardon'], pos: 'phrase', emoji: '😔' }),
  W({ id: 'enqwa', ti: 'እንቋዕ ብደሓን መጻእካ', tr: "enqwaʕ bdeḥan mets'aʔka", en: 'welcome', pos: 'phrase', emoji: '🤗', note: 'Said to a man arriving. To a woman: …መጻእኪ (mets\'aʔki).' }),
  W({ id: 'bejaka', ti: 'በጃኻ', tr: 'bejaḵa', en: 'please', pos: 'phrase', note: 'Said to a man. To a woman: በጃኺ (bejaḵi).' }),

  // ─── Pronouns & copula ─────────────────────────────────────────────────
  W({ id: 'ane', ti: 'ኣነ', tr: 'ane', en: 'I', alt: ['me'], pos: 'pronoun', emoji: '🙋' }),
  W({ id: 'nska', ti: 'ንስኻ', tr: 'nsḵa', en: 'you', pos: 'pronoun', gender: 'm', note: 'Speaking to one man.' }),
  W({ id: 'nski', ti: 'ንስኺ', tr: 'nsḵi', en: 'you', pos: 'pronoun', gender: 'f', note: 'Speaking to one woman.' }),
  W({ id: 'nsu', ti: 'ንሱ', tr: 'nsu', en: 'he', pos: 'pronoun', emoji: '👨' }),
  W({ id: 'nsa', ti: 'ንሳ', tr: 'nsa', en: 'she', pos: 'pronoun', emoji: '👩' }),
  W({ id: 'nhna', ti: 'ንሕና', tr: 'nḥna', en: 'we', alt: ['us'], pos: 'pronoun', emoji: '👨‍👩‍👧' }),
  W({ id: 'nskatkum', ti: 'ንስኻትኩም', tr: 'nsḵatkum', en: 'you all', pos: 'pronoun' }),
  W({ id: 'nsatom', ti: 'ንሳቶም', tr: 'nsatom', en: 'they', pos: 'pronoun', emoji: '👥' }),
  W({ id: 'eye', ti: 'እየ', tr: 'eye', en: 'I am', pos: 'particle', note: 'The copula goes at the end: ኣነ ተምሃራይ እየ። = I am a student.' }),
  W({ id: 'ika', ti: 'ኢኻ', tr: 'iḵa', en: 'you are', pos: 'particle', gender: 'm' }),
  W({ id: 'iki', ti: 'ኢኺ', tr: 'iḵi', en: 'you are', pos: 'particle', gender: 'f' }),
  W({ id: 'eyu', ti: 'እዩ', tr: 'eyu', en: 'he is', alt: ['it is', 'is'], pos: 'particle' }),
  W({ id: 'eya', ti: 'እያ', tr: 'eya', en: 'she is', alt: ['it is', 'is'], pos: 'particle' }),
  W({ id: 'ina', ti: 'ኢና', tr: 'ina', en: 'we are', pos: 'particle' }),
  W({ id: 'eyom', ti: 'እዮም', tr: 'eyom', en: 'they are', pos: 'particle' }),

  // ─── People ────────────────────────────────────────────────────────────
  W({ id: 'sebay', ti: 'ሰብኣይ', tr: "sebʔay", en: 'man', pos: 'noun', emoji: '👨', gender: 'm' }),
  W({ id: 'sebeyti', ti: 'ሰበይቲ', tr: 'sebeyti', en: 'woman', pos: 'noun', emoji: '👩', gender: 'f' }),
  W({ id: 'qwela', ti: 'ቈልዓ', tr: "qwelʕa", en: 'child', pos: 'noun', emoji: '🧒' }),
  W({ id: 'wedi', ti: 'ወዲ', tr: 'wedi', en: 'boy', alt: ['son'], pos: 'noun', emoji: '👦', gender: 'm' }),
  W({ id: 'gwal', ti: 'ጓል', tr: 'gwal', en: 'girl', alt: ['daughter'], pos: 'noun', emoji: '👧', gender: 'f' }),
  W({ id: 'seb', ti: 'ሰብ', tr: 'seb', en: 'person', pos: 'noun', emoji: '🧍' }),
  W({ id: 'arki', ti: 'ዓርኪ', tr: "ʕarki", en: 'friend', pos: 'noun', emoji: '🤝' }),
  W({ id: 'memhr', ti: 'መምህር', tr: 'memhr', en: 'teacher', pos: 'noun', emoji: '👨‍🏫' }),
  W({ id: 'temharay', ti: 'ተምሃራይ', tr: 'temharay', en: 'student', pos: 'noun', emoji: '🧑‍🎓', gender: 'm' }),
  W({ id: 'hakim', ti: 'ሓኪም', tr: 'ḥakim', en: 'doctor', pos: 'noun', emoji: '🧑‍⚕️' }),
  W({ id: 'smey', ti: 'ስመይ', tr: 'smey', en: 'my name', pos: 'noun', emoji: '🏷️', note: 'ስም (sm) = name. ‑ey is the "my" ending.' }),
  W({ id: 'smka', ti: 'ስምካ', tr: 'smka', en: 'your name', pos: 'noun', note: 'Said to a man. To a woman: ስምኪ (smki).' }),

  // ─── Family ────────────────────────────────────────────────────────────
  W({ id: 'abo', ti: 'ኣቦ', tr: 'abo', en: 'father', alt: ['dad'], pos: 'noun', emoji: '👨‍🦰', gender: 'm' }),
  W({ id: 'ade', ti: 'ኣደ', tr: 'ade', en: 'mother', alt: ['mom', 'mum'], pos: 'noun', emoji: '👩‍🦰', gender: 'f' }),
  W({ id: 'haw', ti: 'ሓው', tr: 'ḥaw', en: 'brother', pos: 'noun', emoji: '👬', gender: 'm' }),
  W({ id: 'hafti', ti: 'ሓፍቲ', tr: 'ḥafti', en: 'sister', pos: 'noun', emoji: '👭', gender: 'f' }),
  W({ id: 'sdra', ti: 'ስድራ', tr: 'sdra', en: 'family', pos: 'noun', emoji: '👨‍👩‍👧‍👦' }),
  W({ id: 'abohago', ti: 'ኣቦሓጎ', tr: 'aboḥago', en: 'grandfather', pos: 'noun', emoji: '👴', gender: 'm' }),
  W({ id: 'abay', ti: 'ዓባይ', tr: "ʕabay", en: 'grandmother', pos: 'noun', emoji: '👵', gender: 'f' }),
  W({ id: 'ahwat', ti: 'ኣሕዋት', tr: 'aḥwat', en: 'siblings', alt: ['brothers'], pos: 'noun', emoji: '👨‍👩‍👦' }),

  // ─── Numbers ───────────────────────────────────────────────────────────
  W({ id: 'n1', ti: 'ሓደ', tr: 'ḥade', en: 'one', alt: ['1'], pos: 'number', emoji: '1️⃣' }),
  W({ id: 'n2', ti: 'ክልተ', tr: 'klte', en: 'two', alt: ['2'], pos: 'number', emoji: '2️⃣' }),
  W({ id: 'n3', ti: 'ሰለስተ', tr: 'seleste', en: 'three', alt: ['3'], pos: 'number', emoji: '3️⃣' }),
  W({ id: 'n4', ti: 'ኣርባዕተ', tr: "arbaʕte", en: 'four', alt: ['4'], pos: 'number', emoji: '4️⃣' }),
  W({ id: 'n5', ti: 'ሓሙሽተ', tr: 'ḥamushte', en: 'five', alt: ['5'], pos: 'number', emoji: '5️⃣' }),
  W({ id: 'n6', ti: 'ሽዱሽተ', tr: 'shdushte', en: 'six', alt: ['6'], pos: 'number', emoji: '6️⃣' }),
  W({ id: 'n7', ti: 'ሸውዓተ', tr: "shewʕate", en: 'seven', alt: ['7'], pos: 'number', emoji: '7️⃣' }),
  W({ id: 'n8', ti: 'ሸሞንተ', tr: 'shemonte', en: 'eight', alt: ['8'], pos: 'number', emoji: '8️⃣' }),
  W({ id: 'n9', ti: 'ትሽዓተ', tr: "tishʕate", en: 'nine', alt: ['9'], pos: 'number', emoji: '9️⃣' }),
  W({ id: 'n10', ti: 'ዓሰርተ', tr: "ʕaserte", en: 'ten', alt: ['10'], pos: 'number', emoji: '🔟' }),

  // ─── Food & drink ──────────────────────────────────────────────────────
  W({ id: 'may', ti: 'ማይ', tr: 'may', en: 'water', pos: 'noun', emoji: '💧' }),
  W({ id: 'enjera', ti: 'እንጀራ', tr: 'enjera', en: 'injera', pos: 'noun', emoji: '🫓', note: 'The sourdough flatbread at the centre of most meals.' }),
  W({ id: 'bani', ti: 'ባኒ', tr: 'bani', en: 'bread', pos: 'noun', emoji: '🍞' }),
  W({ id: 'sga', ti: 'ስጋ', tr: 'sga', en: 'meat', pos: 'noun', emoji: '🥩' }),
  W({ id: 'asa', ti: 'ዓሳ', tr: "ʕasa", en: 'fish', pos: 'noun', emoji: '🐟' }),
  W({ id: 'enqwaqwho', ti: 'እንቋቑሖ', tr: "enqwaqwḥo", en: 'egg', pos: 'noun', emoji: '🥚' }),
  W({ id: 'tseba', ti: 'ጸባ', tr: "ts'eba", en: 'milk', pos: 'noun', emoji: '🥛' }),
  W({ id: 'bun', ti: 'ቡን', tr: 'bun', en: 'coffee', pos: 'noun', emoji: '☕', note: 'ቡን also names the coffee ceremony, a daily social ritual.' }),
  W({ id: 'shahi', ti: 'ሻሂ', tr: 'shahi', en: 'tea', pos: 'noun', emoji: '🍵' }),
  W({ id: 'shkor', ti: 'ሽኮር', tr: 'shkor', en: 'sugar', pos: 'noun', emoji: '🍬' }),
  W({ id: 'chew', ti: 'ጨው', tr: "ch'ew", en: 'salt', pos: 'noun', emoji: '🧂' }),
  W({ id: 'megbi', ti: 'መግቢ', tr: 'megbi', en: 'food', pos: 'noun', emoji: '🍽️' }),
  W({ id: 'muz', ti: 'ሙዝ', tr: 'muz', en: 'banana', pos: 'noun', emoji: '🍌' }),
  W({ id: 'aranshi', ti: 'ኣራንሺ', tr: 'aranshi', en: 'orange', pos: 'noun', emoji: '🍊' }),
  W({ id: 'komidere', ti: 'ኮሚደረ', tr: 'komidere', en: 'tomato', pos: 'noun', emoji: '🍅' }),
  W({ id: 'dnsh', ti: 'ድንሽ', tr: 'dnsh', en: 'potato', pos: 'noun', emoji: '🥔' }),
  W({ id: 'berbere', ti: 'በርበረ', tr: 'berbere', en: 'chili spice', alt: ['berbere', 'chili'], pos: 'noun', emoji: '🌶️' }),

  // ─── Colours ───────────────────────────────────────────────────────────
  W({ id: 'qeyh', ti: 'ቀይሕ', tr: 'qeyḥ', en: 'red', pos: 'adjective', emoji: '🔴' }),
  W({ id: 'tselim', ti: 'ጸሊም', tr: "ts'elim", en: 'black', pos: 'adjective', emoji: '⚫' }),
  W({ id: 'tsada', ti: 'ጻዕዳ', tr: "ts'aʕda", en: 'white', pos: 'adjective', emoji: '⚪' }),
  W({ id: 'qetelya', ti: 'ቀጠልያ', tr: "qet'elya", en: 'green', pos: 'adjective', emoji: '🟢' }),
  W({ id: 'semayawi', ti: 'ሰማያዊ', tr: 'semayawi', en: 'blue', pos: 'adjective', emoji: '🔵' }),
  W({ id: 'bcha', ti: 'ብጫ', tr: "bch'a", en: 'yellow', pos: 'adjective', emoji: '🟡' }),
  W({ id: 'bunawi', ti: 'ቡናዊ', tr: 'bunawi', en: 'brown', pos: 'adjective', emoji: '🟤' }),

  // ─── Home & things ─────────────────────────────────────────────────────
  W({ id: 'geza', ti: 'ገዛ', tr: 'geza', en: 'house', alt: ['home'], pos: 'noun', emoji: '🏠', gender: 'm' }),
  W({ id: 'matso', ti: 'ማዕጾ', tr: "maʕts'o", en: 'door', pos: 'noun', emoji: '🚪' }),
  W({ id: 'meskot', ti: 'መስኮት', tr: 'meskot', en: 'window', pos: 'noun', emoji: '🪟' }),
  W({ id: 'tawla', ti: 'ጣውላ', tr: "t'awla", en: 'table', pos: 'noun', emoji: '🪑' }),
  W({ id: 'wenber', ti: 'ወንበር', tr: 'wenber', en: 'chair', pos: 'noun', emoji: '💺' }),
  W({ id: 'arat', ti: 'ዓራት', tr: "ʕarat", en: 'bed', pos: 'noun', emoji: '🛏️' }),
  W({ id: 'metshaf', ti: 'መጽሓፍ', tr: "mets'ḥaf", en: 'book', pos: 'noun', emoji: '📖', gender: 'm' }),
  W({ id: 'bri', ti: 'ብርዒ', tr: "brʕi", en: 'pen', pos: 'noun', emoji: '🖊️' }),
  W({ id: 'seat', ti: 'ሰዓት', tr: "seʕat", en: 'clock', alt: ['watch', 'hour', 'time'], pos: 'noun', emoji: '🕐' }),
  W({ id: 'mekina', ti: 'መኪና', tr: 'mekina', en: 'car', pos: 'noun', emoji: '🚗', gender: 'f' }),
  W({ id: 'ketema', ti: 'ከተማ', tr: 'ketema', en: 'city', alt: ['town'], pos: 'noun', emoji: '🏙️' }),
  W({ id: 'adi', ti: 'ዓዲ', tr: "ʕadi", en: 'village', alt: ['hometown', 'country'], pos: 'noun', emoji: '🏘️' }),
  W({ id: 'bet_tmhrti', ti: 'ቤት ትምህርቲ', tr: 'bet tmhrti', en: 'school', pos: 'noun', emoji: '🏫', note: 'ቤት (bet) = house of — it starts many compound words.' }),
  W({ id: 'daga', ti: 'ዕዳጋ', tr: "ʕdaga", en: 'market', pos: 'noun', emoji: '🛒' }),
  W({ id: 'hospital', ti: 'ሆስፒታል', tr: 'hospital', en: 'hospital', pos: 'noun', emoji: '🏥' }),

  // ─── Verbs (3rd person masculine, present) ─────────────────────────────
  W({ id: 'ybele', ti: 'ይበልዕ', tr: "ybelʕ", en: 'he eats', alt: ['eats', 'he is eating'], pos: 'verb', emoji: '🍴' }),
  W({ id: 'yseti', ti: 'ይሰቲ', tr: 'yseti', en: 'he drinks', alt: ['drinks', 'he is drinking'], pos: 'verb', emoji: '🥤' }),
  W({ id: 'ykheyd', ti: 'ይኸይድ', tr: 'yḵeyd', en: 'he goes', alt: ['goes', 'he is going'], pos: 'verb', emoji: '🚶' }),
  W({ id: 'ymetse', ti: 'ይመጽእ', tr: "ymets'ʔ", en: 'he comes', alt: ['comes'], pos: 'verb', emoji: '🔜' }),
  W({ id: 'yri', ti: 'ይርኢ', tr: "yrʔi", en: 'he sees', alt: ['sees'], pos: 'verb', emoji: '👀' }),
  W({ id: 'yfelt', ti: 'ይፈልጥ', tr: "yfelt'", en: 'he knows', alt: ['knows'], pos: 'verb', emoji: '💡' }),
  W({ id: 'ydeli', ti: 'ይደሊ', tr: 'ydeli', en: 'he wants', alt: ['wants'], pos: 'verb', emoji: '🙌' }),
  W({ id: 'yserh', ti: 'ይሰርሕ', tr: 'yserḥ', en: 'he works', alt: ['works'], pos: 'verb', emoji: '🔨' }),
  W({ id: 'yzareb', ti: 'ይዛረብ', tr: 'yzareb', en: 'he speaks', alt: ['speaks', 'he talks'], pos: 'verb', emoji: '💬' }),
  W({ id: 'ynebr', ti: 'ይነብር', tr: 'ynebr', en: 'he lives', alt: ['lives'], pos: 'verb', emoji: '🏡' }),
  W({ id: 'ytshf', ti: 'ይጽሕፍ', tr: "yts'ḥf", en: 'he writes', alt: ['writes'], pos: 'verb', emoji: '✍️' }),
  W({ id: 'yanbb', ti: 'የንብብ', tr: 'yenbb', en: 'he reads', alt: ['reads'], pos: 'verb', emoji: '📚' }),
  W({ id: 'ydqs', ti: 'ይድቅስ', tr: 'ydqs', en: 'he sleeps', alt: ['sleeps'], pos: 'verb', emoji: '😴' }),

  // ─── Question words ────────────────────────────────────────────────────
  W({ id: 'entay', ti: 'እንታይ', tr: 'entay', en: 'what', pos: 'question', emoji: '❓' }),
  W({ id: 'men', ti: 'መን', tr: 'men', en: 'who', pos: 'question', emoji: '🕵️' }),
  W({ id: 'abey', ti: 'ኣበይ', tr: 'abey', en: 'where', pos: 'question', emoji: '📍' }),
  W({ id: 'meas', ti: 'መዓስ', tr: "meʕas", en: 'when', pos: 'question', emoji: '📅' }),
  W({ id: 'slemntay', ti: 'ስለምንታይ', tr: 'slemntay', en: 'why', pos: 'question', emoji: '🤔' }),
  W({ id: 'kemey', ti: 'ከመይ', tr: 'kemey', en: 'how', pos: 'question', emoji: '🔧' }),
  W({ id: 'kndey', ti: 'ክንደይ', tr: 'kndey', en: 'how much', alt: ['how many'], pos: 'question', emoji: '🔢' }),

  // ─── Time ──────────────────────────────────────────────────────────────
  W({ id: 'lomi', ti: 'ሎሚ', tr: 'lomi', en: 'today', pos: 'noun', emoji: '📆' }),
  W({ id: 'tsbah', ti: 'ጽባሕ', tr: "ts'baḥ", en: 'tomorrow', pos: 'noun', emoji: '⏭️' }),
  W({ id: 'tmali', ti: 'ትማሊ', tr: 'tmali', en: 'yesterday', pos: 'noun', emoji: '⏮️' }),
  W({ id: 'mealti', ti: 'መዓልቲ', tr: "meʕalti", en: 'day', pos: 'noun', emoji: '☀️' }),
  W({ id: 'leyti', ti: 'ለይቲ', tr: 'leyti', en: 'night', pos: 'noun', emoji: '🌙' }),
  W({ id: 'ngho', ti: 'ንግሆ', tr: 'ngho', en: 'morning', pos: 'noun', emoji: '🌅' }),
  W({ id: 'mshet', ti: 'ምሸት', tr: 'mshet', en: 'evening', pos: 'noun', emoji: '🌆' }),
  W({ id: 'semun', ti: 'ሰሙን', tr: 'semun', en: 'week', pos: 'noun', emoji: '🗓️' }),
  W({ id: 'werhi', ti: 'ወርሒ', tr: 'werḥi', en: 'month', alt: ['moon'], pos: 'noun', emoji: '🌕' }),
  W({ id: 'amet', ti: 'ዓመት', tr: "ʕamet", en: 'year', pos: 'noun', emoji: '🎆' }),
  W({ id: 'senuy', ti: 'ሰኑይ', tr: 'senuy', en: 'Monday', pos: 'noun' }),
  W({ id: 'selus', ti: 'ሰሉስ', tr: 'selus', en: 'Tuesday', pos: 'noun' }),
  W({ id: 'rebu', ti: 'ረቡዕ', tr: "rebuʕ", en: 'Wednesday', pos: 'noun' }),
  W({ id: 'hamus', ti: 'ሓሙስ', tr: 'ḥamus', en: 'Thursday', pos: 'noun' }),
  W({ id: 'arbi', ti: 'ዓርቢ', tr: "ʕarbi", en: 'Friday', pos: 'noun' }),
  W({ id: 'qedam', ti: 'ቀዳም', tr: 'qedam', en: 'Saturday', pos: 'noun' }),
  W({ id: 'senbet', ti: 'ሰንበት', tr: 'senbet', en: 'Sunday', pos: 'noun' }),

  // ─── Describing things ─────────────────────────────────────────────────
  W({ id: 'abi', ti: 'ዓቢ', tr: "ʕabi", en: 'big', alt: ['large'], pos: 'adjective', emoji: '🐘' }),
  W({ id: 'neshto', ti: 'ንእሽቶ', tr: "nʔeshto", en: 'small', alt: ['little'], pos: 'adjective', emoji: '🐜' }),
  W({ id: 'hmaq', ti: 'ሕማቕ', tr: 'ḥmaq', en: 'bad', pos: 'adjective', emoji: '👎' }),
  W({ id: 'hadsh', ti: 'ሓድሽ', tr: 'ḥadsh', en: 'new', pos: 'adjective', emoji: '✨' }),
  W({ id: 'aregit', ti: 'ኣረጊት', tr: 'aregit', en: 'old', pos: 'adjective', emoji: '🪨' }),
  W({ id: 'mwuq', ti: 'ምዉቕ', tr: 'mwuq', en: 'hot', alt: ['warm'], pos: 'adjective', emoji: '🔥' }),
  W({ id: 'zhul', ti: 'ዝሑል', tr: 'zḥul', en: 'cold', alt: ['cool'], pos: 'adjective', emoji: '❄️' }),
  W({ id: 'bzuh', ti: 'ብዙሕ', tr: 'bzuḥ', en: 'many', alt: ['much', 'a lot'], pos: 'adjective', emoji: '➕' }),
  W({ id: 'qurub', ti: 'ቁሩብ', tr: 'qurub', en: 'a little', alt: ['a few', 'little'], pos: 'adjective', emoji: '➖' }),

  // ─── Little words ──────────────────────────────────────────────────────
  W({ id: 'ab', ti: 'ኣብ', tr: 'ab', en: 'in', alt: ['at', 'on'], pos: 'particle' }),
  W({ id: 'ms', ti: 'ምስ', tr: 'ms', en: 'with', pos: 'particle' }),
  W({ id: 'nab', ti: 'ናብ', tr: 'nab', en: 'to', alt: ['towards'], pos: 'particle' }),
  W({ id: 'kab', ti: 'ካብ', tr: 'kab', en: 'from', pos: 'particle' }),
  W({ id: 'ezi', ti: 'እዚ', tr: 'ezi', en: 'this', pos: 'particle', gender: 'm' }),
  W({ id: 'eti', ti: 'እቲ', tr: 'eti', en: 'the', pos: 'particle', gender: 'm', note: 'እቲ before masculine nouns, እታ (eta) before feminine ones.' }),
  W({ id: 'eta', ti: 'እታ', tr: 'eta', en: 'the', pos: 'particle', gender: 'f' }),
  W({ id: 'alo', ti: 'ኣሎ', tr: 'alo', en: 'there is', alt: ['he is there', 'exists'], pos: 'verb' }),
  W({ id: 'yelen', ti: 'የለን', tr: 'yelen', en: 'there is not', alt: ['none'], pos: 'verb' }),
  W({ id: 'natey', ti: 'ናተይ', tr: 'natey', en: 'mine', alt: ['my'], pos: 'particle' }),
  // ─── Places & the language itself ──────────────────────────────────────
  W({ id: 'tigrigna', ti: 'ትግርኛ', tr: "tgrñña", en: 'Tigrinya', pos: 'noun', emoji: '🗣️', note: 'The language you are learning, spoken in Eritrea and Tigray.' }),
  W({ id: 'ertra', ti: 'ኤርትራ', tr: 'Ertra', en: 'Eritrea', pos: 'noun', emoji: '🇪🇷' }),
  W({ id: 'tgray', ti: 'ትግራይ', tr: 'Tgray', en: 'Tigray', pos: 'noun', emoji: '⛰️' }),
  W({ id: 'asmera', ti: 'ኣስመራ', tr: 'Asmera', en: 'Asmara', pos: 'noun', emoji: '🏙️' }),
  W({ id: 'meqele', ti: 'መቐለ', tr: 'Meqele', en: 'Mekelle', pos: 'noun', emoji: '🏙️' }),
  W({ id: 'dika', ti: 'ዲኻ', tr: 'diḵa', en: 'are you', pos: 'particle', note: 'Turns a statement into a yes/no question, to a man. To a woman: ዲኺ (diḵi).' }),
  W({ id: 'aleni', ti: 'ኣለኒ', tr: 'aleni', en: 'I have', pos: 'verb', emoji: '🤲' }),
];

export const WORD_BY_ID: Record<string, Word> = Object.fromEntries(
  WORDS.map((w) => [w.id, w]),
);

export function word(id: string): Word {
  const w = WORD_BY_ID[id];
  if (!w) throw new Error(`Unknown word id: ${id}`);
  return w;
}
