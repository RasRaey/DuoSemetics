/**
 * The learning path: Sections → Units → Lesson nodes.
 *
 * A node only declares *what* it covers. The exercise generator in
 * `engine/generator.ts` decides which exercise types to build from that, so
 * the same lesson replayed later looks different.
 */

export type NodeKind = 'lesson' | 'fidel' | 'review' | 'chest';

export interface LessonNode {
  id: string;
  kind: NodeKind;
  title: string;
  /** Lexicon ids introduced here. */
  teach?: string[];
  /** Lexicon ids recycled from earlier nodes. */
  review?: string[];
  /** Sentence ids drilled here. */
  sentences?: string[];
  /** Fidel row ids drilled here (kind: 'fidel'). */
  fidelRows?: string[];
  /** Gems awarded by a chest node. */
  gems?: number;
}

export interface Unit {
  id: string;
  /** Unit number as shown on the header banner. */
  number: number;
  title: string;
  /** Short "what you'll learn" line on the banner. */
  blurb: string;
  /** Theme colour token name, see index.css. */
  color: 'green' | 'blue' | 'gold' | 'purple' | 'red' | 'teal';
  icon: string;
  nodes: LessonNode[];
}

export interface Section {
  id: string;
  number: number;
  title: string;
  tiTitle: string;
  blurb: string;
  units: Unit[];
}

export const SECTIONS: Section[] = [
  {
    id: 'sec1',
    number: 1,
    title: 'First Words',
    tiTitle: 'ቀዳማይ ቃላት',
    blurb: 'Greet people, say who you are, and meet the Ge’ez script.',
    units: [
      {
        id: 'u1',
        number: 1,
        title: 'Greetings',
        blurb: 'Say hello, ask how someone is, and say thank you',
        color: 'green',
        icon: '👋',
        nodes: [
          { id: 'u1l1', kind: 'lesson', title: 'Hello', teach: ['selam', 'yeqenyeley', 'ewe', 'ayfal'] },
          { id: 'u1l2', kind: 'lesson', title: 'How are you?', teach: ['kemey_aleka', 'kemey_aleki', 'tsbuq', 'tsbuq_aleku'], review: ['selam', 'yeqenyeley'], sentences: ['s_hello_how', 's_fine_thanks'] },
          { id: 'u1l3', kind: 'lesson', title: 'Please & sorry', teach: ['bejaka', 'yqreta', 'btami', 'dehan'], review: ['ewe', 'ayfal', 'yeqenyeley'], sentences: ['s_thanks_much', 's_yes_well', 's_no_thanks'] },
          { id: 'u1l4', kind: 'lesson', title: 'Goodbye', teach: ['dehan_kun', 'dehan_kuni', 'enqwa'], review: ['selam', 'dehan', 'kemey_aleka'], sentences: ['s_bye', 's_hello_how_f'] },
          { id: 'u1c1', kind: 'chest', title: 'Chest', gems: 15 },
          { id: 'u1r1', kind: 'review', title: 'Unit 1 review', review: ['selam', 'yeqenyeley', 'ewe', 'ayfal', 'kemey_aleka', 'tsbuq', 'tsbuq_aleku', 'bejaka', 'yqreta', 'dehan_kun', 'btami'], sentences: ['s_hello_how', 's_fine_thanks', 's_bye', 's_thanks_much'] },
        ],
      },
      {
        id: 'u2',
        number: 2,
        title: 'The Fidel I',
        blurb: 'Read your first Ge’ez letters: ሀ ለ ሐ መ ረ ሰ',
        color: 'purple',
        icon: 'ፊ',
        nodes: [
          { id: 'u2l1', kind: 'fidel', title: 'ሀ · ለ', fidelRows: ['he', 'le'] },
          { id: 'u2l2', kind: 'fidel', title: 'ሐ · መ', fidelRows: ['hhe', 'me'] },
          { id: 'u2l3', kind: 'fidel', title: 'ረ · ሰ', fidelRows: ['re', 'se'] },
          { id: 'u2r1', kind: 'review', title: 'Fidel review', fidelRows: ['he', 'le', 'hhe', 'me', 're', 'se'] },
        ],
      },
      {
        id: 'u3',
        number: 3,
        title: 'People',
        blurb: 'I, you, he, she — and what people do for a living',
        color: 'blue',
        icon: '🧑',
        nodes: [
          { id: 'u3l1', kind: 'lesson', title: 'I and you', teach: ['ane', 'nska', 'nski', 'eye', 'ika'], review: ['selam'] },
          { id: 'u3l2', kind: 'lesson', title: 'He and she', teach: ['nsu', 'nsa', 'eyu', 'eya'], review: ['ane', 'eye'], sentences: ['s_who_ishe'] },
          { id: 'u3l3', kind: 'lesson', title: 'Jobs', teach: ['memhr', 'temharay', 'hakim', 'seb'], review: ['nsu', 'nsa', 'eyu', 'eya', 'ane', 'eye'], sentences: ['s_i_student', 's_he_teacher', 's_she_doctor', 's_you_teacher'] },
          { id: 'u3l4', kind: 'lesson', title: 'Names', teach: ['smey', 'smka', 'men', 'arki'], review: ['eyu', 'eya', 'nsu'], sentences: ['s_myname', 's_yourname', 's_he_friend'] },
          { id: 'u3l5', kind: 'lesson', title: 'Where from', teach: ['kab', 'ertra', 'tgray', 'nhna', 'ina', 'abey'], review: ['ika', 'ane'], sentences: ['s_where_from', 's_we_from_eritrea'] },
          { id: 'u3c1', kind: 'chest', title: 'Chest', gems: 20 },
          { id: 'u3r1', kind: 'review', title: 'Unit 3 review', review: ['ane', 'nska', 'nsu', 'nsa', 'nhna', 'eye', 'eyu', 'eya', 'memhr', 'temharay', 'hakim', 'smey', 'men', 'kab', 'ertra'], sentences: ['s_i_student', 's_he_teacher', 's_she_doctor', 's_yourname', 's_where_from'] },
        ],
      },
    ],
  },
  {
    id: 'sec2',
    number: 2,
    title: 'Everyday Life',
    tiTitle: 'መዓልታዊ ህይወት',
    blurb: 'Count, name your family, and order coffee like you mean it.',
    units: [
      {
        id: 'u4',
        number: 4,
        title: 'Numbers',
        blurb: 'Count from ሓደ to ዓሰርተ',
        color: 'gold',
        icon: '🔢',
        nodes: [
          { id: 'u4l1', kind: 'lesson', title: 'One to five', teach: ['n1', 'n2', 'n3', 'n4', 'n5'] },
          { id: 'u4l2', kind: 'lesson', title: 'Six to ten', teach: ['n6', 'n7', 'n8', 'n9', 'n10'], review: ['n1', 'n3', 'n5'] },
          { id: 'u4l3', kind: 'lesson', title: 'How much?', teach: ['kndey'], review: ['n1', 'n2', 'n5', 'bejaka'], sentences: ['s_how_much', 's_two_coffees', 's_one_water'] },
          { id: 'u4r1', kind: 'review', title: 'Unit 4 review', review: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'kndey'], sentences: ['s_how_much', 's_two_coffees'] },
        ],
      },
      {
        id: 'u5',
        number: 5,
        title: 'Family',
        blurb: 'Mother, father, brother, sister — and how to say "my"',
        color: 'red',
        icon: '👨‍👩‍👧',
        nodes: [
          { id: 'u5l1', kind: 'lesson', title: 'Parents', teach: ['abo', 'ade', 'sdra', 'ezi'], review: ['eyu', 'eya', 'hakim', 'memhr'], sentences: ['s_my_father', 's_my_mother', 's_this_family'] },
          { id: 'u5l2', kind: 'lesson', title: 'Brother & sister', teach: ['haw', 'hafti', 'ahwat', 'aleni'], review: ['n1', 'n2'], sentences: ['s_have_brother'] },
          { id: 'u5l3', kind: 'lesson', title: 'Boys & girls', teach: ['wedi', 'gwal', 'qwela', 'sebay', 'sebeyti'], review: ['abo', 'ade'] },
          { id: 'u5l4', kind: 'lesson', title: 'Grandparents', teach: ['abohago', 'abay', 'ab', 'adi'], review: ['haw', 'hafti', 'sdra', 'ynebr'], sentences: ['s_grandpa_village', 's_sister_school'] },
          { id: 'u5c1', kind: 'chest', title: 'Chest', gems: 20 },
          { id: 'u5r1', kind: 'review', title: 'Unit 5 review', review: ['abo', 'ade', 'haw', 'hafti', 'sdra', 'wedi', 'gwal', 'qwela', 'abohago', 'abay', 'aleni'], sentences: ['s_my_father', 's_my_mother', 's_have_brother', 's_this_family'] },
        ],
      },
      {
        id: 'u6',
        number: 6,
        title: 'Food & Drink',
        blurb: 'Injera, coffee, and everything on the table',
        color: 'teal',
        icon: '☕',
        nodes: [
          { id: 'u6l1', kind: 'lesson', title: 'Drinks', teach: ['may', 'bun', 'shahi', 'tseba'], review: ['n1', 'n2', 'bejaka'], sentences: ['s_one_water', 's_i_drink_tea'] },
          { id: 'u6l2', kind: 'lesson', title: 'On the table', teach: ['enjera', 'bani', 'sga', 'asa', 'megbi'], review: ['may', 'bun'], sentences: ['s_food_good'] },
          { id: 'u6l3', kind: 'lesson', title: 'Eating & drinking', teach: ['ybele', 'yseti', 'alo', 'ydeli'], review: ['enjera', 'bun', 'may', 'shahi'], sentences: ['s_eat_injera', 's_drink_coffee', 's_want_water'] },
          { id: 'u6l4', kind: 'lesson', title: 'Hot & cold', teach: ['mwuq', 'zhul', 'eti', 'eta', 'yelen'], review: ['may', 'bun', 'megbi', 'tsbuq', 'chew'], sentences: ['s_water_cold', 's_coffee_hot', 's_no_salt'] },
          { id: 'u6l5', kind: 'lesson', title: 'More food', teach: ['enqwaqwho', 'shkor', 'chew', 'muz', 'komidere', 'berbere'], review: ['ybele', 'ms', 'bani', 'tseba'], sentences: ['s_bread_milk'] },
          { id: 'u6c1', kind: 'chest', title: 'Chest', gems: 25 },
          { id: 'u6r1', kind: 'review', title: 'Unit 6 review', review: ['may', 'bun', 'shahi', 'enjera', 'bani', 'sga', 'ybele', 'yseti', 'mwuq', 'zhul', 'megbi'], sentences: ['s_eat_injera', 's_drink_coffee', 's_water_cold', 's_food_good'] },
        ],
      },
      {
        id: 'u7',
        number: 7,
        title: 'The Fidel II',
        blurb: 'ቀ በ ተ ነ ከ ወ — the letters behind the words you know',
        color: 'purple',
        icon: 'ፊ',
        nodes: [
          { id: 'u7l1', kind: 'fidel', title: 'ቀ · በ', fidelRows: ['qe', 'be'] },
          { id: 'u7l2', kind: 'fidel', title: 'ተ · ነ', fidelRows: ['te', 'ne'] },
          { id: 'u7l3', kind: 'fidel', title: 'ከ · ወ', fidelRows: ['ke', 'we'] },
          { id: 'u7l4', kind: 'fidel', title: 'አ · ዓ', fidelRows: ['ae', 'aye'] },
          { id: 'u7r1', kind: 'review', title: 'Fidel review', fidelRows: ['qe', 'be', 'te', 'ne', 'ke', 'we', 'ae', 'aye'] },
        ],
      },
    ],
  },
  {
    id: 'sec3',
    number: 3,
    title: 'My World',
    tiTitle: 'ዓለመይ',
    blurb: 'Colours, your home, the things you do, and asking questions.',
    units: [
      {
        id: 'u8',
        number: 8,
        title: 'Colours',
        blurb: 'ቀይሕ, ጸሊም, ቀጠልያ and friends',
        color: 'red',
        icon: '🎨',
        nodes: [
          { id: 'u8l1', kind: 'lesson', title: 'Red & black', teach: ['qeyh', 'tselim', 'tsada'], review: ['eti', 'eyu'] },
          { id: 'u8l2', kind: 'lesson', title: 'Green & blue', teach: ['qetelya', 'semayawi', 'bcha', 'bunawi'], review: ['qeyh', 'tselim'] },
          { id: 'u8l3', kind: 'lesson', title: 'Describing things', teach: ['metshaf', 'hadsh', 'aregit'], review: ['qeyh', 'eti', 'eyu', 'geza', 'tsada'], sentences: ['s_book_red', 's_book_new', 's_house_white'] },
          { id: 'u8r1', kind: 'review', title: 'Unit 8 review', review: ['qeyh', 'tselim', 'tsada', 'qetelya', 'semayawi', 'bcha', 'hadsh', 'aregit'], sentences: ['s_book_red', 's_house_white'] },
        ],
      },
      {
        id: 'u9',
        number: 9,
        title: 'At Home',
        blurb: 'Your house, the market, the city',
        color: 'blue',
        icon: '🏠',
        nodes: [
          { id: 'u9l1', kind: 'lesson', title: 'Rooms & doors', teach: ['geza', 'matso', 'meskot', 'abi', 'neshto'], review: ['eti', 'eyu', 'ezi'], sentences: ['s_this_house', 's_house_big'] },
          { id: 'u9l2', kind: 'lesson', title: 'Furniture', teach: ['tawla', 'wenber', 'arat', 'bri', 'seat'], review: ['metshaf', 'ab', 'alo'], sentences: ['s_book_on_table'] },
          { id: 'u9l3', kind: 'lesson', title: 'Around town', teach: ['ketema', 'daga', 'bet_tmhrti', 'hospital', 'mekina'], review: ['ab', 'adi', 'asmera'], sentences: ['s_sister_school'] },
          { id: 'u9c1', kind: 'chest', title: 'Chest', gems: 25 },
          { id: 'u9r1', kind: 'review', title: 'Unit 9 review', review: ['geza', 'matso', 'meskot', 'tawla', 'wenber', 'arat', 'ketema', 'daga', 'bet_tmhrti', 'abi', 'neshto'], sentences: ['s_this_house', 's_house_big', 's_book_on_table'] },
        ],
      },
      {
        id: 'u10',
        number: 10,
        title: 'Doing Things',
        blurb: 'Go, come, work, read, speak',
        color: 'green',
        icon: '🏃',
        nodes: [
          { id: 'u10l1', kind: 'lesson', title: 'Come & go', teach: ['ykheyd', 'ymetse', 'nab'], review: ['daga', 'bet_tmhrti', 'alo'], sentences: ['s_go_market'] },
          { id: 'u10l2', kind: 'lesson', title: 'Work & live', teach: ['yserh', 'ynebr'], review: ['ab', 'hospital', 'asmera', 'adi'], sentences: ['s_works_hospital', 's_live_asmara', 's_grandpa_village'] },
          { id: 'u10l3', kind: 'lesson', title: 'Read & write', teach: ['yanbb', 'ytshf', 'yri', 'ydqs'], review: ['metshaf', 'alo'], sentences: ['s_reads_book'] },
          { id: 'u10l4', kind: 'lesson', title: 'Speaking Tigrinya', teach: ['yzareb', 'tigrigna', 'dika', 'yfelt'], review: ['ane', 'nska'], sentences: ['s_i_speak_tig', 's_do_you_speak'] },
          { id: 'u10c1', kind: 'chest', title: 'Chest', gems: 30 },
          { id: 'u10r1', kind: 'review', title: 'Unit 10 review', review: ['ykheyd', 'ymetse', 'yserh', 'ynebr', 'yanbb', 'ytshf', 'yzareb', 'tigrigna', 'yri'], sentences: ['s_go_market', 's_works_hospital', 's_i_speak_tig', 's_reads_book'] },
        ],
      },
      {
        id: 'u11',
        number: 11,
        title: 'Questions & Time',
        blurb: 'What, where, when — plus days and parts of the day',
        color: 'gold',
        icon: '❓',
        nodes: [
          { id: 'u11l1', kind: 'lesson', title: 'What & where', teach: ['entay', 'kemey', 'slemntay'], review: ['abey', 'men', 'eyu', 'alo'], sentences: ['s_what_isit', 's_where_book', 's_where_live', 's_where_isshe'] },
          { id: 'u11l2', kind: 'lesson', title: 'Parts of the day', teach: ['ngho', 'mshet', 'leyti', 'mealti'], review: ['ykheyd', 'nab', 'bet_tmhrti'], sentences: ['s_good_morning_walk'] },
          { id: 'u11l3', kind: 'lesson', title: 'Today & tomorrow', teach: ['lomi', 'tsbah', 'tmali', 'meas', 'semun', 'amet'], review: ['ymetse'], sentences: ['s_come_tomorrow'] },
          { id: 'u11l4', kind: 'lesson', title: 'Days of the week', teach: ['senuy', 'selus', 'rebu', 'hamus', 'arbi', 'qedam', 'senbet'], review: ['lomi', 'eyu'], sentences: ['s_today_monday', 's_five_days'] },
          { id: 'u11c1', kind: 'chest', title: 'Chest', gems: 30 },
          { id: 'u11r1', kind: 'review', title: 'Unit 11 review', review: ['entay', 'abey', 'meas', 'men', 'kndey', 'kemey', 'lomi', 'tsbah', 'senuy', 'ngho', 'mshet'], sentences: ['s_what_isit', 's_where_live', 's_come_tomorrow', 's_today_monday'] },
        ],
      },
    ],
  },
];

export const UNITS: Unit[] = SECTIONS.flatMap((s) => s.units);
export const NODES: LessonNode[] = UNITS.flatMap((u) => u.nodes);

/** Flat ordering of every node, which is what "locked until the one before" uses. */
export const NODE_ORDER: string[] = NODES.map((n) => n.id);

export const NODE_BY_ID: Record<string, LessonNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);

export const unitOfNode: Record<string, Unit> = Object.fromEntries(
  UNITS.flatMap((u) => u.nodes.map((n) => [n.id, u])),
);

export const sectionOfUnit: Record<string, Section> = Object.fromEntries(
  SECTIONS.flatMap((s) => s.units.map((u) => [u.id, s])),
);

/** Every lexicon id a node touches. */
export function nodeWordIds(node: LessonNode): string[] {
  return [...new Set([...(node.teach ?? []), ...(node.review ?? [])])];
}

/** Words unlocked once the learner has finished everything up to `nodeId`. */
export function wordsKnownAfter(nodeId: string): string[] {
  const stop = NODE_ORDER.indexOf(nodeId);
  const seen = new Set<string>();
  NODE_ORDER.slice(0, stop + 1).forEach((id) => {
    nodeWordIds(NODE_BY_ID[id]).forEach((w) => seen.add(w));
  });
  return [...seen];
}
