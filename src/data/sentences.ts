/**
 * Sentence bank for translation and word-bank exercises.
 *
 * Sentences are kept short and to patterns a beginner can generalise from:
 *   [subject] [complement] COPULA        ኣነ ተምሃራይ እየ።
 *   እቲ/እታ [noun] [adjective] COPULA      እቲ ማይ ዝሑል እዩ።
 *   [object] [verb]                      ማይ እሰቲ።
 *   [object] [verb] ኣሎ/ኣላ                 እንጀራ ይበልዕ ኣሎ።
 *
 * `ti` and `en` are tokenised on spaces to build word banks, so every token
 * must be a unit a learner would tap as one tile.
 */

export interface Sentence {
  id: string;
  /** Ge'ez, space separated into tappable tokens. */
  ti: string;
  /** Transliteration, shown under the answer in feedback. */
  tr: string;
  /** English, space separated into tappable tokens. */
  en: string;
  /** Other English renderings accepted when grading typed answers. */
  altEn?: string[];
  /** Lexicon ids this sentence exercises — drives unlocking and the SRS. */
  uses: string[];
  /** A short grammar aside shown after a correct answer, occasionally. */
  tip?: string;
}

const S = (s: Sentence) => s;

export const SENTENCES: Sentence[] = [
  // ─── Greetings ─────────────────────────────────────────────────────────
  S({ id: 's_hello_how', ti: 'ሰላም፡ ከመይ ኣለኻ?', tr: 'selam, kemey aleḵa?', en: 'Hello, how are you?', uses: ['selam', 'kemey_aleka'], tip: 'ኣለኻ ends in ‑ኻ because you are speaking to a man.' }),
  S({ id: 's_hello_how_f', ti: 'ሰላም፡ ከመይ ኣለኺ?', tr: 'selam, kemey aleḵi?', en: 'Hello, how are you?', uses: ['selam', 'kemey_aleki'] }),
  S({ id: 's_fine_thanks', ti: 'ጽቡቕ ኣለኹ፡ የቐንየለይ።', tr: "ts'buq aleḵu, yeqenyeley.", en: 'I am fine, thank you.', altEn: ["I'm fine, thank you", 'I am well, thank you'], uses: ['tsbuq_aleku', 'yeqenyeley'] }),
  S({ id: 's_thanks_much', ti: 'ብጣዕሚ የቐንየለይ።', tr: "bt'aʕmi yeqenyeley.", en: 'Thank you very much.', uses: ['btami', 'yeqenyeley'] }),
  S({ id: 's_bye', ti: 'ደሓን ኩን።', tr: 'deḥan kun.', en: 'Goodbye.', altEn: ['bye', 'stay well'], uses: ['dehan_kun'] }),
  S({ id: 's_yes_well', ti: 'እወ፡ ደሓን እየ።', tr: 'ewe, deḥan eye.', en: 'Yes, I am well.', uses: ['ewe', 'dehan', 'eye'] }),
  S({ id: 's_no_thanks', ti: 'ኣይፋል፡ የቐንየለይ።', tr: 'ayfal, yeqenyeley.', en: 'No, thank you.', uses: ['ayfal', 'yeqenyeley'] }),
  S({ id: 's_myname', ti: 'ስመይ ዳዊት እዩ።', tr: 'smey Dawit eyu.', en: 'My name is Dawit.', uses: ['smey', 'eyu'], tip: 'The copula እዩ comes last. Swap in your own name for ዳዊት.' }),
  S({ id: 's_yourname', ti: 'ስምካ መን እዩ?', tr: 'smka men eyu?', en: 'What is your name?', altEn: ["what's your name"], uses: ['smka', 'men', 'eyu'], tip: 'Literally "your name who is?" — Tigrinya asks with መን, not እንታይ.' }),

  // ─── Pronouns, people, being something ─────────────────────────────────
  S({ id: 's_i_student', ti: 'ኣነ ተምሃራይ እየ።', tr: 'ane temharay eye.', en: 'I am a student.', altEn: ["I'm a student"], uses: ['ane', 'temharay', 'eye'] }),
  S({ id: 's_he_teacher', ti: 'ንሱ መምህር እዩ።', tr: 'nsu memhr eyu.', en: 'He is a teacher.', uses: ['nsu', 'memhr', 'eyu'] }),
  S({ id: 's_she_doctor', ti: 'ንሳ ሓኪም እያ።', tr: 'nsa ḥakim eya.', en: 'She is a doctor.', uses: ['nsa', 'hakim', 'eya'], tip: 'እያ is the "she" copula; እዩ is the "he" one.' }),
  S({ id: 's_you_teacher', ti: 'ንስኻ መምህር ኢኻ።', tr: 'nsḵa memhr iḵa.', en: 'You are a teacher.', uses: ['nska', 'memhr', 'ika'] }),
  S({ id: 's_we_from_eritrea', ti: 'ንሕና ካብ ኤርትራ ኢና።', tr: 'nḥna kab Ertra ina.', en: 'We are from Eritrea.', uses: ['nhna', 'kab', 'ertra', 'ina'] }),
  S({ id: 's_who_ishe', ti: 'ንሱ መን እዩ?', tr: 'nsu men eyu?', en: 'Who is he?', uses: ['nsu', 'men', 'eyu'] }),
  S({ id: 's_where_from', ti: 'ካበይ ኢኻ?', tr: 'kabey iḵa?', en: 'Where are you from?', uses: ['kab', 'abey', 'ika'], tip: 'ካብ + ኣበይ contract to ካበይ.' }),
  S({ id: 's_he_friend', ti: 'ንሱ ዓርከይ እዩ።', tr: "nsu ʕarkey eyu.", en: 'He is my friend.', uses: ['nsu', 'arki', 'eyu'], tip: 'Adding ‑ይ / ‑ey to a noun makes it "my": ዓርኪ → ዓርከይ.' }),

  // ─── Family ────────────────────────────────────────────────────────────
  S({ id: 's_my_father', ti: 'ኣቦይ ሓኪም እዩ።', tr: 'aboy ḥakim eyu.', en: 'My father is a doctor.', uses: ['abo', 'hakim', 'eyu'] }),
  S({ id: 's_my_mother', ti: 'ኣደይ መምህር እያ።', tr: 'adey memhr eya.', en: 'My mother is a teacher.', uses: ['ade', 'memhr', 'eya'] }),
  S({ id: 's_have_brother', ti: 'ሓደ ሓው ኣለኒ።', tr: 'ḥade ḥaw aleni.', en: 'I have one brother.', uses: ['n1', 'haw', 'aleni'] }),
  S({ id: 's_this_family', ti: 'እዚ ስድራይ እዩ።', tr: 'ezi sdray eyu.', en: 'This is my family.', uses: ['ezi', 'sdra', 'eyu'] }),
  S({ id: 's_sister_school', ti: 'ሓፍተይ ኣብ ቤት ትምህርቲ ኣላ።', tr: 'ḥaftey ab bet tmhrti ala.', en: 'My sister is at school.', uses: ['hafti', 'ab', 'bet_tmhrti'], tip: 'ኣላ is "is present" for a female subject; ኣሎ for a male one.' }),
  S({ id: 's_grandpa_village', ti: 'ኣቦሓጎይ ኣብ ዓዲ ይነብር።', tr: "aboḥagoy ab ʕadi ynebr.", en: 'My grandfather lives in the village.', uses: ['abohago', 'ab', 'adi', 'ynebr'] }),

  // ─── Numbers ───────────────────────────────────────────────────────────
  S({ id: 's_two_coffees', ti: 'ክልተ ቡን በጃኻ።', tr: 'klte bun bejaḵa.', en: 'Two coffees, please.', uses: ['n2', 'bun', 'bejaka'] }),
  S({ id: 's_one_water', ti: 'ሓደ ማይ በጃኻ።', tr: 'ḥade may bejaḵa.', en: 'One water, please.', uses: ['n1', 'may', 'bejaka'] }),
  S({ id: 's_how_much', ti: 'ክንደይ እዩ?', tr: 'kndey eyu?', en: 'How much is it?', uses: ['kndey', 'eyu'] }),
  S({ id: 's_five_days', ti: 'ሓሙሽተ መዓልቲ።', tr: "ḥamushte meʕalti.", en: 'Five days.', uses: ['n5', 'mealti'] }),

  // ─── Food & drink ──────────────────────────────────────────────────────
  S({ id: 's_want_water', ti: 'ማይ እደሊ።', tr: 'may edeli.', en: 'I want water.', uses: ['may', 'ydeli'], tip: 'Verbs change their first letter by person: ይደሊ he wants → እደሊ I want.' }),
  S({ id: 's_eat_injera', ti: 'እንጀራ ይበልዕ ኣሎ።', tr: "enjera ybelʕ alo.", en: 'He is eating injera.', uses: ['enjera', 'ybele', 'alo'], tip: 'Add ኣሎ after the verb to say it is happening right now.' }),
  S({ id: 's_drink_coffee', ti: 'ቡን ትሰቲ ኣላ።', tr: 'bun tseti ala.', en: 'She is drinking coffee.', uses: ['bun', 'yseti', 'alo'] }),
  S({ id: 's_i_drink_tea', ti: 'ሻሂ እሰቲ።', tr: 'shahi eseti.', en: 'I drink tea.', uses: ['shahi', 'yseti'] }),
  S({ id: 's_food_good', ti: 'እቲ መግቢ ጽቡቕ እዩ።', tr: "eti megbi ts'buq eyu.", en: 'The food is good.', uses: ['eti', 'megbi', 'tsbuq', 'eyu'] }),
  S({ id: 's_water_cold', ti: 'እቲ ማይ ዝሑል እዩ።', tr: 'eti may zḥul eyu.', en: 'The water is cold.', uses: ['eti', 'may', 'zhul', 'eyu'] }),
  S({ id: 's_coffee_hot', ti: 'እቲ ቡን ምዉቕ እዩ።', tr: 'eti bun mwuq eyu.', en: 'The coffee is hot.', uses: ['eti', 'bun', 'mwuq', 'eyu'] }),
  S({ id: 's_bread_milk', ti: 'ባኒ ምስ ጸባ።', tr: "bani ms ts'eba.", en: 'Bread with milk.', uses: ['bani', 'ms', 'tseba'] }),
  S({ id: 's_no_salt', ti: 'ጨው የለን።', tr: "ch'ew yelen.", en: 'There is no salt.', uses: ['chew', 'yelen'] }),

  // ─── Home, places, colours ─────────────────────────────────────────────
  S({ id: 's_this_house', ti: 'እዚ ገዛይ እዩ።', tr: 'ezi gezay eyu.', en: 'This is my house.', uses: ['ezi', 'geza', 'eyu'] }),
  S({ id: 's_house_big', ti: 'እቲ ገዛ ዓቢ እዩ።', tr: "eti geza ʕabi eyu.", en: 'The house is big.', uses: ['eti', 'geza', 'abi', 'eyu'] }),
  S({ id: 's_house_white', ti: 'እቲ ገዛ ጻዕዳ እዩ።', tr: "eti geza ts'aʕda eyu.", en: 'The house is white.', uses: ['eti', 'geza', 'tsada', 'eyu'] }),
  S({ id: 's_book_new', ti: 'እቲ መጽሓፍ ሓድሽ እዩ።', tr: "eti mets'ḥaf ḥadsh eyu.", en: 'The book is new.', uses: ['eti', 'metshaf', 'hadsh', 'eyu'] }),
  S({ id: 's_book_red', ti: 'እቲ መጽሓፍ ቀይሕ እዩ።', tr: "eti mets'ḥaf qeyḥ eyu.", en: 'The book is red.', uses: ['eti', 'metshaf', 'qeyh', 'eyu'] }),
  S({ id: 's_book_on_table', ti: 'እቲ መጽሓፍ ኣብ ጣውላ ኣሎ።', tr: "eti mets'ḥaf ab t'awla alo.", en: 'The book is on the table.', uses: ['eti', 'metshaf', 'ab', 'tawla', 'alo'] }),
  S({ id: 's_where_book', ti: 'እቲ መጽሓፍ ኣበይ ኣሎ?', tr: "eti mets'ḥaf abey alo?", en: 'Where is the book?', uses: ['eti', 'metshaf', 'abey', 'alo'] }),
  S({ id: 's_where_live', ti: 'ኣበይ ትነብር?', tr: 'abey tnebr?', en: 'Where do you live?', uses: ['abey', 'ynebr'] }),
  S({ id: 's_live_asmara', ti: 'ኣብ ኣስመራ እነብር።', tr: 'ab Asmera enebr.', en: 'I live in Asmara.', uses: ['ab', 'asmera', 'ynebr'] }),
  S({ id: 's_go_market', ti: 'ናብ ዕዳጋ ይኸይድ ኣሎ።', tr: "nab ʕdaga yḵeyd alo.", en: 'He is going to the market.', uses: ['nab', 'daga', 'ykheyd', 'alo'] }),
  S({ id: 's_works_hospital', ti: 'ኣብ ሆስፒታል ይሰርሕ።', tr: 'ab hospital yserḥ.', en: 'He works at the hospital.', uses: ['ab', 'hospital', 'yserh'] }),

  // ─── Questions, time, the language ─────────────────────────────────────
  S({ id: 's_what_isit', ti: 'እንታይ እዩ?', tr: 'entay eyu?', en: 'What is it?', altEn: ["what's this", 'what is this'], uses: ['entay', 'eyu'] }),
  S({ id: 's_i_speak_tig', ti: 'ትግርኛ እዛረብ።', tr: "tgrñña ezareb.", en: 'I speak Tigrinya.', uses: ['tigrigna', 'yzareb'] }),
  S({ id: 's_do_you_speak', ti: 'ትግርኛ ትዛረብ ዲኻ?', tr: "tgrñña tzareb diḵa?", en: 'Do you speak Tigrinya?', uses: ['tigrigna', 'yzareb', 'dika'], tip: 'ዲኻ on the end turns any statement into a yes/no question.' }),
  S({ id: 's_today_monday', ti: 'ሎሚ ሰኑይ እዩ።', tr: 'lomi senuy eyu.', en: 'Today is Monday.', uses: ['lomi', 'senuy', 'eyu'] }),
  S({ id: 's_come_tomorrow', ti: 'ጽባሕ ይመጽእ።', tr: "ts'baḥ ymets'ʔ.", en: 'He comes tomorrow.', altEn: ['he will come tomorrow'], uses: ['tsbah', 'ymetse'] }),
  S({ id: 's_reads_book', ti: 'መጽሓፍ የንብብ ኣሎ።', tr: "mets'ḥaf yenbb alo.", en: 'He is reading a book.', uses: ['metshaf', 'yanbb', 'alo'] }),
  S({ id: 's_good_morning_walk', ti: 'ንግሆ ናብ ቤት ትምህርቲ ይኸይድ።', tr: 'ngho nab bet tmhrti yḵeyd.', en: 'He goes to school in the morning.', uses: ['ngho', 'nab', 'bet_tmhrti', 'ykheyd'] }),
  S({ id: 's_where_isshe', ti: 'ንሳ ኣበይ ኣላ?', tr: 'nsa abey ala?', en: 'Where is she?', uses: ['nsa', 'abey', 'alo'] }),
];

export const SENTENCE_BY_ID: Record<string, Sentence> = Object.fromEntries(
  SENTENCES.map((s) => [s.id, s]),
);

export const tiTokens = (s: Sentence) => s.ti.split(' ');
export const enTokens = (s: Sentence) => s.en.split(' ');
