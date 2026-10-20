import type { Timestamp } from "firebase/firestore";

export type TransactionType = "EXPENSE" | "INCOME" | "expense" | "income";

export interface StonksTransaction {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  location?: string;
  isRecurring?: boolean;
  date?: string;
  month?: string;
  timestamp?: Timestamp | any;
  receiptImage?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface UserProfile {
  uid: string;
  userId?: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  photoUrl?: string | null;
  budgetLimit?: number;
  themeMode?: "SYSTEM" | "LIGHT" | "DARK";
  appLanguage?: "IT" | "EN" | "ES" | "DE" | "FR";
  isEmailVerified?: boolean;
  emailVerified?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "EXPENSE" | "INCOME";
}
