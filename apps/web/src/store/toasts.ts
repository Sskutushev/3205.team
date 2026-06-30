import { create } from 'zustand';
import type { TranslationKey } from '../i18n/types.js';

export type ToastVariant = 'error' | 'success';

export type Toast = {
  id: string;
  variant: ToastVariant;
  messageKey: TranslationKey;
};

const AUTO_DISMISS_MS = 5000;

type ToastsState = {
  toasts: Toast[];
  push: (variant: ToastVariant, messageKey: TranslationKey) => void;
  pushError: (messageKey: TranslationKey) => void;
  pushSuccess: (messageKey: TranslationKey) => void;
  dismiss: (id: string) => void;
};

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export const useToastStore = create<ToastsState>((set, get) => ({
  toasts: [],

  push(variant, messageKey) {
    const id = createId();

    set((state) => ({
      toasts: [...state.toasts, { id, variant, messageKey }],
    }));

    globalThis.setTimeout(() => {
      get().dismiss(id);
    }, AUTO_DISMISS_MS);
  },

  pushError(messageKey) {
    get().push('error', messageKey);
  },

  pushSuccess(messageKey) {
    get().push('success', messageKey);
  },

  dismiss(id) {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
