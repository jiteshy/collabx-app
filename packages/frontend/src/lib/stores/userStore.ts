import { create } from 'zustand';
import { User, UserCursor, UserSelection } from '@/types';

interface UserState {
  users: User[];
  cursors: UserCursor[];
  selections: UserSelection[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateCursor: (cursor: UserCursor) => void;
  removeCursor: (userId: string) => void;
  updateSelection: (selection: UserSelection) => void;
  removeSelection: (userId: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  cursors: [],
  selections: [],

  addUser: (user) => {
    set((state) => {
      // Check if user already exists
      if (state.users.some((u) => u.id === user.id)) {
        return state;
      }
      return { users: [...state.users, user] };
    });
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      cursors: state.cursors.filter((c) => c.userId !== userId),
      selections: state.selections.filter((s) => s.userId !== userId),
    }));
  },

  updateCursor: (cursor) => {
    set((state) => ({
      cursors: [...state.cursors.filter((c) => c.userId !== cursor.userId), cursor],
    }));
  },

  removeCursor: (userId) => {
    set((state) => ({
      cursors: state.cursors.filter((c) => c.userId !== userId),
    }));
  },

  updateSelection: (selection) => {
    set((state) => ({
      selections: [...state.selections.filter((s) => s.userId !== selection.userId), selection],
    }));
  },

  removeSelection: (userId) => {
    set((state) => ({
      selections: state.selections.filter((s) => s.userId !== userId),
    }));
  },

  reset: () =>
    set({
      users: [],
      cursors: [],
      selections: [],
    }),
}));
