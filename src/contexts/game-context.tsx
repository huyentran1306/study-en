"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// ─── Pet System ────────────────────────────────────────────
export type PetType = "cat" | "dog" | "bunny" | "dragon";
export type PetMood = "happy" | "hungry" | "sleepy" | "excited";

export interface PetState {
  type: PetType;
  name: string;
  level: number;
  xp: number;
  mood: PetMood;
  hunger: number;
  energy: number;
  lastFed: string | null;
  accessories: string[];
}

// ─── Avatar System ─────────────────────────────────────────
export interface AvatarState {
  skinColor: number;
  hairStyle: number;
  outfit: string;
  unlockedOutfits: string[];
  unlockedAccessories: string[];
}

// ─── World Progression ─────────────────────────────────────
export type WorldId = "forest" | "beach" | "space";

export interface WorldState {
  currentWorld: WorldId;
  unlockedWorlds: WorldId[];
  worldProgress: Record<WorldId, number>;
}

// ─── Mystery Box ───────────────────────────────────────────
export interface MysteryBoxState {
  lastOpened: string | null;
  stickers: string[];
  totalOpened: number;
}

// ─── Main Game State ───────────────────────────────────────
export type AppMode = "kid" | "adult";

interface GameState {
  username: string;
  language: "en" | "vi";
  mode: AppMode;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  lastVisit: string | null;
  completedLessons: string[];
  achievements: string[];
  onboardingComplete: boolean;
  pet: PetState;
  avatar: AvatarState;
  world: WorldState;
  mysteryBox: MysteryBoxState;
}

interface GameContextType extends GameState {
  setUsername: (name: string) => void;
  setLanguage: (lang: "en" | "vi") => void;
  setMode: (mode: AppMode) => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  completeLesson: (lessonId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  completeOnboarding: () => void;
  resetProgress: () => void;
  xpToNextLevel: number;
  xpProgress: number;
  feedPet: () => void;
  setPetName: (name: string) => void;
  setPetType: (type: PetType) => void;
  addPetXP: (amount: number) => void;
  updateAvatar: (updates: Partial<AvatarState>) => void;
  unlockOutfit: (outfit: string) => boolean;
  setCurrentWorld: (world: WorldId) => void;
  addWorldProgress: (world: WorldId, amount: number) => void;
  openMysteryBox: () => string | null;
  canOpenMysteryBox: boolean;
}

const defaultPet: PetState = {
  type: "cat",
  name: "Mochi",
  level: 1,
  xp: 0,
  mood: "happy",
  hunger: 80,
  energy: 100,
  lastFed: null,
  accessories: [],
};

const defaultAvatar: AvatarState = {
  skinColor: 0,
  hairStyle: 0,
  outfit: "default",
  unlockedOutfits: ["default"],
  unlockedAccessories: [],
};

const defaultWorld: WorldState = {
  currentWorld: "forest",
  unlockedWorlds: ["forest"],
  worldProgress: { forest: 0, beach: 0, space: 0 },
};

const defaultMysteryBox: MysteryBoxState = {
  lastOpened: null,
  stickers: [],
  totalOpened: 0,
};

const defaultState: GameState = {
  username: "",
  language: "en",
  mode: "kid",
  xp: 0,
  level: 1,
  streak: 1,
  coins: 100,
  lastVisit: null,
  completedLessons: [],
  achievements: [],
  onboardingComplete: false,
  pet: defaultPet,
  avatar: defaultAvatar,
  world: defaultWorld,
  mysteryBox: defaultMysteryBox,
};

const getXPForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
const getPetXPForLevel = (level: number) => Math.floor(50 * Math.pow(1.3, level - 1));

const MYSTERY_STICKERS = [
  "🦄", "🐉", "🌈", "🎸", "🏆", "💎", "🎭", "🦋",
  "🌺", "🍭", "🎪", "🦊", "🐼", "🦁", "🌻", "🎨",
  "🎵", "🍕", "⚡", "🔮", "🎯", "🧩", "🎲", "🪐",
  "🦩", "🐙", "🍩", "🌮", "🎬", "🧸", "🎠", "🏰",
];

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<GameState>("studyen-game-state", defaultState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toDateString();
    setState((currentState) => {
      let s = { ...currentState };
      if (!s.pet) s.pet = defaultPet;
      if (!s.avatar) s.avatar = defaultAvatar;
      if (!s.world) s.world = defaultWorld;
      if (!s.mysteryBox) s.mysteryBox = defaultMysteryBox;
      if (!s.mode) s.mode = "kid";

      if (s.lastVisit) {
        const lastDate = new Date(s.lastVisit);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate.toDateString() === yesterday.toDateString()) {
          s = { ...s, streak: s.streak + 1, lastVisit: today };
        } else if (lastDate.toDateString() !== today) {
          s = { ...s, streak: 1, lastVisit: today };
        }
      } else {
        s = { ...s, lastVisit: today };
      }

      if (s.pet && s.pet.lastFed) {
        const hoursSinceFed = (Date.now() - new Date(s.pet.lastFed).getTime()) / (1000 * 60 * 60);
        const hungerDrop = Math.floor(hoursSinceFed * 3);
        const newHunger = Math.max(0, s.pet.hunger - hungerDrop);
        const newMood: PetMood = newHunger < 30 ? "hungry" : newHunger < 60 ? "sleepy" : "happy";
        s = { ...s, pet: { ...s.pet, hunger: newHunger, mood: newMood } };
      }

      return s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xpToNextLevel = getXPForLevel(state.level);
  const xpProgress = (state.xp / xpToNextLevel) * 100;

  const addXP = (amount: number) => {
    let newXP = state.xp + amount;
    let newLevel = state.level;
    let xpNeeded = getXPForLevel(newLevel);
    let bonusCoins = 0;
    const startLevel = state.level;

    while (newXP >= xpNeeded) {
      newXP -= xpNeeded;
      newLevel++;
      bonusCoins += 50;
      xpNeeded = getXPForLevel(newLevel);
    }

    // 🎉 Celebrate level-ups with confetti
    if (newLevel > startLevel && typeof window !== "undefined") {
      import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
    }

    const newWorld = { ...state.world };
    if (newLevel >= 5 && !newWorld.unlockedWorlds.includes("beach")) {
      newWorld.unlockedWorlds = [...newWorld.unlockedWorlds, "beach"];
    }
    if (newLevel >= 10 && !newWorld.unlockedWorlds.includes("space")) {
      newWorld.unlockedWorlds = [...newWorld.unlockedWorlds, "space"];
    }

    const newPet = { ...state.pet };
    newPet.xp += Math.floor(amount / 2);
    const petXPNeeded = getPetXPForLevel(newPet.level);
    if (newPet.xp >= petXPNeeded) {
      newPet.xp -= petXPNeeded;
      newPet.level++;
    }

    setState({
      ...state,
      xp: newXP,
      level: newLevel,
      coins: state.coins + bonusCoins,
      world: newWorld,
      pet: newPet,
    });
  };

  const addCoins = (amount: number) => setState({ ...state, coins: state.coins + amount });

  const spendCoins = (amount: number) => {
    if (state.coins >= amount) {
      setState({ ...state, coins: state.coins - amount });
      return true;
    }
    return false;
  };

  const setUsername = (name: string) => setState({ ...state, username: name });
  const setLanguage = (lang: "en" | "vi") => setState({ ...state, language: lang });
  const setMode = (mode: AppMode) => setState({ ...state, mode });

  const completeLesson = (lessonId: string) => {
    if (!state.completedLessons.includes(lessonId)) {
      setState({ ...state, completedLessons: [...state.completedLessons, lessonId] });
      addXP(25);
      addCoins(10);
    }
  };

  const unlockAchievement = (achievementId: string) => {
    if (!state.achievements.includes(achievementId)) {
      setState({ ...state, achievements: [...state.achievements, achievementId] });
    }
  };

  const completeOnboarding = () => setState({ ...state, onboardingComplete: true });
  const resetProgress = () => setState(defaultState);

  const feedPet = () => {
    if (state.coins >= 5) {
      setState({
        ...state,
        coins: state.coins - 5,
        pet: {
          ...state.pet,
          hunger: Math.min(100, state.pet.hunger + 30),
          mood: "happy",
          lastFed: new Date().toISOString(),
          energy: Math.min(100, state.pet.energy + 20),
        },
      });
    }
  };

  const setPetName = (name: string) => setState({ ...state, pet: { ...state.pet, name } });
  const setPetType = (type: PetType) => setState({ ...state, pet: { ...state.pet, type } });
  const addPetXP = (amount: number) => {
    const newPet = { ...state.pet };
    newPet.xp += amount;
    const needed = getPetXPForLevel(newPet.level);
    if (newPet.xp >= needed) {
      newPet.xp -= needed;
      newPet.level++;
      newPet.mood = "excited";
    }
    setState({ ...state, pet: newPet });
  };

  const updateAvatar = (updates: Partial<AvatarState>) => {
    setState({ ...state, avatar: { ...state.avatar, ...updates } });
  };

  const unlockOutfit = (outfit: string) => {
    if (state.avatar.unlockedOutfits.includes(outfit)) return true;
    if (state.coins >= 30) {
      setState({
        ...state,
        coins: state.coins - 30,
        avatar: {
          ...state.avatar,
          unlockedOutfits: [...state.avatar.unlockedOutfits, outfit],
        },
      });
      return true;
    }
    return false;
  };

  const setCurrentWorld = (world: WorldId) => {
    if (state.world.unlockedWorlds.includes(world)) {
      setState({ ...state, world: { ...state.world, currentWorld: world } });
    }
  };

  const addWorldProgress = (world: WorldId, amount: number) => {
    const newProgress = { ...state.world.worldProgress };
    newProgress[world] = Math.min(100, (newProgress[world] || 0) + amount);
    setState({ ...state, world: { ...state.world, worldProgress: newProgress } });
  };

  const today = new Date().toDateString();
  const canOpenMysteryBox = state.mysteryBox.lastOpened !== today;

  const openMysteryBox = () => {
    if (!canOpenMysteryBox) return null;
    const available = MYSTERY_STICKERS.filter((s) => !state.mysteryBox.stickers.includes(s));
    if (available.length === 0) return null;
    const won = available[Math.floor(Math.random() * available.length)];
    const coinsWon = Math.floor(Math.random() * 20) + 5;
    setState({
      ...state,
      coins: state.coins + coinsWon,
      mysteryBox: {
        lastOpened: today,
        stickers: [...state.mysteryBox.stickers, won],
        totalOpened: state.mysteryBox.totalOpened + 1,
      },
    });
    return won;
  };

  if (!mounted) return null;

  return (
    <GameContext.Provider
      value={{
        ...state,
        setUsername,
        setLanguage,
        setMode,
        addXP,
        addCoins,
        spendCoins,
        completeLesson,
        unlockAchievement,
        completeOnboarding,
        resetProgress,
        xpToNextLevel,
        xpProgress,
        feedPet,
        setPetName,
        setPetType,
        addPetXP,
        updateAvatar,
        unlockOutfit,
        setCurrentWorld,
        addWorldProgress,
        openMysteryBox,
        canOpenMysteryBox,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}

export const translations = {
  en: {
    welcome: "Welcome",
    hello: "Hello",
    selectLanguage: "Select your language",
    enterName: "What's your name, adventurer?",
    startAdventure: "Start Adventure",
    home: "Home",
    chat: "Chat",
    vocab: "Vocabulary",
    speaking: "Speaking",
    games: "Games",
    story: "Story",
    roleplay: "Role Play",
    level: "Level",
    streak: "Day Streak",
    coins: "Coins",
    xp: "XP",
    dailyChallenge: "Daily Challenge",
    practiceNow: "Practice Now",
    continueJourney: "Continue Your Journey",
    learnNewWords: "Learn New Words",
    practiceConversation: "Practice Conversation",
    improveSkills: "Improve your speaking",
    kidMode: "Kid Mode",
    adultMode: "Adult Mode",
    pet: "Pet",
    avatar: "Avatar",
    worldMap: "World Map",
    mysteryBox: "Mystery Box",
    forest: "Enchanted Forest",
    beach: "Sunny Beach",
    space: "Cosmic Space",
    feed: "Feed",
    play: "Play",
    stickers: "Stickers",
    openBox: "Open Box",
    comeTomorrow: "Come back tomorrow!",
    unlockAt: "Unlocks at Level",
    pictureGuess: "Picture Guess",
  },
  vi: {
    welcome: "Chào mừng",
    hello: "Xin chào",
    selectLanguage: "Chọn ngôn ngữ của bạn",
    enterName: "Tên của bạn là gì, nhà thám hiểm?",
    startAdventure: "Bắt đầu cuộc phiêu lưu",
    home: "Trang chủ",
    chat: "Trò chuyện",
    vocab: "Từ vựng",
    speaking: "Nói",
    games: "Trò chơi",
    story: "Câu chuyện",
    roleplay: "Nhập vai",
    level: "Cấp độ",
    streak: "Ngày liên tiếp",
    coins: "Xu",
    xp: "Điểm KN",
    dailyChallenge: "Thử thách hàng ngày",
    practiceNow: "Luyện tập ngay",
    continueJourney: "Tiếp tục hành trình",
    learnNewWords: "Học từ mới",
    practiceConversation: "Luyện hội thoại",
    improveSkills: "Cải thiện kỹ năng nói",
    kidMode: "Chế độ trẻ em",
    adultMode: "Chế độ người lớn",
    pet: "Thú cưng",
    avatar: "Nhân vật",
    worldMap: "Bản đồ",
    mysteryBox: "Hộp bí ẩn",
    forest: "Khu rừng phép thuật",
    beach: "Bãi biển nắng",
    space: "Không gian vũ trụ",
    feed: "Cho ăn",
    play: "Chơi",
    stickers: "Nhãn dán",
    openBox: "Mở hộp",
    comeTomorrow: "Quay lại ngày mai!",
    unlockAt: "Mở khóa ở Cấp",
    pictureGuess: "Đoán Hình",
  },
};

export function useTranslation() {
  const { language } = useGame();
  return translations[language];
}
