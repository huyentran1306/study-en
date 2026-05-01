export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  emoji: string;
  rarity: AchievementRarity;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // XP milestones
  { id: "xp_100", title: "First Steps", titleZh: "起步", description: "Earn 100 XP", descriptionZh: "获得100经验值", emoji: "⭐", rarity: "common", xpReward: 10 },
  { id: "xp_500", title: "Scholar", titleZh: "学者", description: "Earn 500 XP", descriptionZh: "获得500经验值", emoji: "📚", rarity: "common", xpReward: 20 },
  { id: "xp_1000", title: "Knowledge Seeker", titleZh: "求知者", description: "Earn 1,000 XP", descriptionZh: "获得1000经验值", emoji: "🎓", rarity: "rare", xpReward: 30 },
  { id: "xp_5000", title: "Sage", titleZh: "智者", description: "Earn 5,000 XP", descriptionZh: "获得5000经验值", emoji: "🧙", rarity: "epic", xpReward: 50 },
  { id: "xp_10000", title: "Legendary", titleZh: "传奇", description: "Earn 10,000 XP", descriptionZh: "获得10000经验值", emoji: "👑", rarity: "legendary", xpReward: 100 },
  // Level milestones
  { id: "level_5", title: "Rising Star", titleZh: "新星", description: "Reach Level 5", descriptionZh: "达到5级", emoji: "🌟", rarity: "common", xpReward: 25 },
  { id: "level_10", title: "Expert", titleZh: "专家", description: "Reach Level 10", descriptionZh: "达到10级", emoji: "💎", rarity: "rare", xpReward: 50 },
  { id: "level_20", title: "Master", titleZh: "大师", description: "Reach Level 20", descriptionZh: "达到20级", emoji: "🏆", rarity: "epic", xpReward: 100 },
  // Streak milestones
  { id: "streak_3", title: "3-Day Streak", titleZh: "连续3天", description: "Study 3 days in a row", descriptionZh: "连续学习3天", emoji: "🔥", rarity: "common", xpReward: 15 },
  { id: "streak_7", title: "Week Warrior", titleZh: "一周勇士", description: "Study 7 days in a row", descriptionZh: "连续学习7天", emoji: "🔥", rarity: "rare", xpReward: 30 },
  { id: "streak_30", title: "Monthly Master", titleZh: "月度大师", description: "Study 30 days in a row", descriptionZh: "连续学习30天", emoji: "🔥", rarity: "epic", xpReward: 75 },
  // Activity achievements
  { id: "first_story", title: "Bookworm", titleZh: "书虫", description: "Read your first story", descriptionZh: "阅读了第一个故事", emoji: "📖", rarity: "common", xpReward: 10 },
  { id: "story_10", title: "Story Lover", titleZh: "故事迷", description: "Complete 10 stories", descriptionZh: "完成10个故事", emoji: "📗", rarity: "rare", xpReward: 40 },
  { id: "first_roleplay", title: "Actor", titleZh: "演员", description: "Complete your first roleplay", descriptionZh: "完成了第一次角色扮演", emoji: "🎭", rarity: "common", xpReward: 10 },
  { id: "first_speaking", title: "First Words", titleZh: "开口说话", description: "Complete your first speaking practice", descriptionZh: "完成了第一次口语练习", emoji: "🎤", rarity: "common", xpReward: 10 },
  { id: "speed_reader", title: "Speed Reader", titleZh: "速读者", description: "Read a story at 150+ WPM", descriptionZh: "阅读速度超过150WPM", emoji: "⚡", rarity: "rare", xpReward: 30 },
  { id: "perfect_pronunciation", title: "Perfect Voice", titleZh: "完美发音", description: "Score 90%+ on pronunciation", descriptionZh: "发音得分90%以上", emoji: "🎵", rarity: "epic", xpReward: 50 },
  { id: "vocab_50", title: "Word Collector", titleZh: "词语收集者", description: "Learn 50 vocabulary words", descriptionZh: "学习了50个词汇", emoji: "📝", rarity: "rare", xpReward: 30 },
  { id: "bilingual", title: "Bilingual", titleZh: "双语者", description: "Study both English & Chinese", descriptionZh: "学习了英语和中文", emoji: "🌏", rarity: "epic", xpReward: 50 },
  { id: "coins_1000", title: "Rich Kid", titleZh: "小富翁", description: "Accumulate 1,000 coins", descriptionZh: "积累1000金币", emoji: "💰", rarity: "common", xpReward: 20 },
  { id: "boss_first", title: "Boss Slayer", titleZh: "首战告捷", description: "Defeat your first boss", descriptionZh: "击败了第一个关卡Boss", emoji: "⚔️", rarity: "rare", xpReward: 40 },
  { id: "boss_all", title: "Champion", titleZh: "冠军", description: "Defeat all 6 bosses", descriptionZh: "击败全部6个关卡Boss", emoji: "🏅", rarity: "legendary", xpReward: 150 },
  { id: "review_10", title: "Diligent Learner", titleZh: "勤奋学习者", description: "Complete 10 spaced repetition reviews", descriptionZh: "完成10次间隔复习", emoji: "🔄", rarity: "common", xpReward: 15 },
];

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
};

export const RARITY_BORDER: Record<AchievementRarity, string> = {
  common: "border-gray-300",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};
