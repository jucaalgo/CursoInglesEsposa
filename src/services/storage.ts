import { UserProfile, Course } from '../types';

const DB_KEY = 'profesoria_users_v2';

export interface UserRecord {
  userProfile: UserProfile;
  course: Course | null;
  lastUpdated: number;
}

export const StorageService = {
  // Read the entire database
  getDB: (): Record<string, UserRecord> => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Database corruption error:", e);
      return {};
    }
  },

  // Get all users as a list
  getAllUsers: (): UserRecord[] => {
    const db = StorageService.getDB();
    return Object.values(db).sort((a, b) => b.lastUpdated - a.lastUpdated);
  },

  // Save or Update a user
  saveUser: (user: UserProfile, course: Course | null): boolean => {
    if (!user.username) return false;
    try {
      // 1. Read fresh DB (Critical for concurrency)
      const db = StorageService.getDB();
      
      // 2. Update record
      db[user.username] = {
        userProfile: user,
        course: course,
        lastUpdated: Date.now()
      };

      // 3. Write back safely
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      console.log(`[Database] Saved progress for ${user.username}`);
      return true;
    } catch (e) {
      console.error("[Database] Save failed (Quota?)", e);
      return false;
    }
  },

  // Delete a user
  deleteUser: (username: string): void => {
    const db = StorageService.getDB();
    if (db[username]) {
      delete db[username];
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  },

  // Get specific user
  getUser: (username: string): UserRecord | null => {
    const db = StorageService.getDB();
    return db[username] || null;
  }
};
