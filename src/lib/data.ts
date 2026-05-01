export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  example: string;
  phonetic?: string;
  emoji?: string;
  category?: string;
  learned: boolean;
  createdAt: string;
}

export interface DailyChallenge {
  id: string;
  type: "fill-blank" | "translate" | "rearrange";
  question: string;
  answer: string;
  options?: string[];
  hint?: string;
  xpReward?: number;
  language?: string;
}

export const SAMPLE_VOCABULARY: VocabWord[] = [
  {
    id: "1",
    word: "Eloquent",
    meaning: "Fluent or persuasive in speaking or writing",
    example: "She gave an eloquent speech at the conference.",
    phonetic: "/ˈeləkwənt/",
    emoji: "🗣️",
    category: "Communication",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    word: "Perseverance",
    meaning: "Persistence in doing something despite difficulty",
    example: "His perseverance paid off when he finally passed the exam.",
    phonetic: "/ˌpɜːrsəˈvɪrəns/",
    emoji: "💪",
    category: "Character",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    word: "Ubiquitous",
    meaning: "Present, appearing, or found everywhere",
    example: "Smartphones have become ubiquitous in modern society.",
    phonetic: "/juːˈbɪkwɪtəs/",
    emoji: "🌍",
    category: "Adjective",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    word: "Pragmatic",
    meaning: "Dealing with things sensibly and realistically",
    example: "We need a pragmatic approach to solve this problem.",
    phonetic: "/præɡˈmætɪk/",
    emoji: "🧠",
    category: "Character",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    word: "Ambiguous",
    meaning: "Open to more than one interpretation; not clear",
    example: "The contract was ambiguous and led to confusion.",
    phonetic: "/æmˈbɪɡjuəs/",
    emoji: "🤔",
    category: "Adjective",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    word: "Resilient",
    meaning: "Able to recover quickly from difficulties",
    example: "Children are often more resilient than adults think.",
    phonetic: "/rɪˈzɪliənt/",
    emoji: "🌱",
    category: "Character",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    word: "Inevitable",
    meaning: "Certain to happen; unavoidable",
    example: "Change is inevitable in any growing organization.",
    phonetic: "/ɪˈnevɪtəbl/",
    emoji: "⏳",
    category: "Adjective",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    word: "Comprehensive",
    meaning: "Including all or nearly all elements or aspects",
    example: "The report provides a comprehensive overview of the market.",
    phonetic: "/ˌkɒmprɪˈhensɪv/",
    emoji: "📋",
    category: "Adjective",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "9",
    word: "Enthusiasm",
    meaning: "Intense and eager enjoyment, interest, or approval",
    example: "She approached every task with great enthusiasm.",
    phonetic: "/ɪnˈθjuːziæzəm/",
    emoji: "🔥",
    category: "Emotion",
    learned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "10",
    word: "Gratitude",
    meaning: "The quality of being thankful; readiness to show appreciation",
    example: "He expressed his gratitude for all the help he received.",
    phonetic: "/ˈɡrætɪtjuːd/",
    emoji: "🙏",
    category: "Emotion",
    learned: false,
    createdAt: new Date().toISOString(),
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Communication: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Character: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Adjective: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Emotion: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Noun: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "1",
    type: "fill-blank",
    question: "She was so ___ that everyone listened to her speech carefully.",
    answer: "eloquent",
    options: ["eloquent", "ambiguous", "reluctant", "pragmatic"],
    hint: "It means fluent or persuasive in speaking 🗣️",
    xpReward: 15,
    language: "en",
  },
  {
    id: "2",
    type: "translate",
    question: 'What does "perseverance" mean? 💪',
    answer: "Persistence in doing something despite difficulty",
    options: [
      "Persistence in doing something despite difficulty",
      "The act of giving up easily",
      "Being very talented at something",
      "Speaking multiple languages",
    ],
    hint: "Think about not giving up",
    xpReward: 20,
    language: "en",
  },
  {
    id: "3",
    type: "fill-blank",
    question: "The instructions were ___, so nobody understood what to do.",
    answer: "ambiguous",
    options: ["comprehensive", "ambiguous", "resilient", "ubiquitous"],
    hint: "It means unclear or open to interpretation 🤔",
    xpReward: 15,
    language: "en",
  },
  {
    id: "4",
    type: "translate",
    question: 'What does "gratitude" mean?',
    answer: "A feeling of thankfulness and appreciation",
    options: ["A feeling of thankfulness and appreciation", "Extreme sadness", "Overconfidence in one\'s abilities", "Strong dislike"],
    hint: "Think about saying \'thank you\' from the heart",
    xpReward: 20,
    language: "en",
  },
  {
    id: "5",
    type: "fill-blank",
    question: "His ___ attitude helped him overcome many challenges in life.",
    answer: "resilient",
    options: ["resilient", "complacent", "melancholy", "verbose"],
    hint: "It means able to recover quickly from difficulties 💪",
    xpReward: 15,
    language: "en",
  },
];

export const DAILY_CHALLENGES_ZH: DailyChallenge[] = [
  {
    id: "zh1",
    type: "translate",
    question: '"谢谢" 是什么意思？',
    answer: "Thank you (cảm ơn)",
    options: ["Thank you (cảm ơn)", "Sorry (xin lỗi)", "Hello (xin chào)", "Goodbye (tạm biệt)"],
    hint: "是一个感谢的词语 🙏",
    xpReward: 15,
    language: "zh",
  },
  {
    id: "zh2",
    type: "fill-blank",
    question: "我___去商店买东西。（I ___ go to the store to buy things.）",
    answer: "想",
    options: ["想", "是", "有", "在"],
    hint: "表示想要做某件事的词 💭",
    xpReward: 15,
    language: "zh",
  },
  {
    id: "zh3",
    type: "translate",
    question: '"朋友" 是什么意思？',
    answer: "Friend (bạn bè)",
    options: ["Friend (bạn bè)", "Family (gia đình)", "Teacher (giáo viên)", "Work (công việc)"],
    hint: "一起玩耍、学习的人 🤝",
    xpReward: 15,
    language: "zh",
  },
  {
    id: "zh4",
    type: "fill-blank",
    question: "今天天气___好！（Today the weather is ___ good!）",
    answer: "非常",
    options: ["非常", "不是", "没有", "一下"],
    hint: "表示程度的副词，意思是'very' ☀️",
    xpReward: 15,
    language: "zh",
  },
  {
    id: "zh5",
    type: "translate",
    question: '"学习" 是什么意思？',
    answer: "To study / learn (học tập)",
    options: ["To study / learn (học tập)", "To eat (ăn)", "To sleep (ngủ)", "To play (chơi)"],
    hint: "在学校做的主要事情 📚",
    xpReward: 20,
    language: "zh",
  },
];
