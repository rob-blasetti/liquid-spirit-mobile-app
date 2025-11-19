import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchChats, fetchChatMessages } from '../services/ChatService';
import { UserContext } from './UserContext';

const MAX_PREFETCHED_CONVERSATIONS = 5;

const normalizeChats = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.chats)) return payload.chats;
  if (Array.isArray(payload.items)) return payload.items;

  if (payload.data?.chats && Array.isArray(payload.data.chats)) {
    return payload.data.chats;
  }

  return [];
};

const normalizeMessages = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.messages)) return payload.messages;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload?.data?.messages && Array.isArray(payload.data.messages)) {
    return payload.data.messages;
  }
  return [];
};

export const ChatContext = createContext({
  chats: [],
  loading: false,
  error: '',
  hydrated: false,
  lastFetchedAt: null,
  refreshChats: () => Promise.resolve([]),
  getChatById: () => null,
  getChatMessages: () => null,
  prefetchChatMessages: () => Promise.resolve([]),
});

export const ChatProvider = ({ children }) => {
  const { token, isLoggedIn, syncChatBadgeFromChats } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [conversationStore, setConversationStore] = useState({});
  const conversationStoreRef = useRef(conversationStore);
  const conversationInflightRef = useRef(new Map());

  const loadChats = useCallback(
    async ({ silent = false } = {}) => {
      if (!token || !isLoggedIn) {
        setChats([]);
        setError('');
        setLastFetchedAt(null);
        setHydrated(false);
        return [];
      }

      if (!silent) {
        setLoading(true);
      }

      setError('');
      try {
        const response = await fetchChats({ token });
        const normalized = normalizeChats(response);
        setChats(normalized);
        syncChatBadgeFromChats?.(normalized);
        setLastFetchedAt(Date.now());
        return normalized;
      } catch (err) {
        const message = err?.message || 'Unable to load chats.';
        setError(message);
        throw err;
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setHydrated(true);
      }
    },
    [token, isLoggedIn, syncChatBadgeFromChats],
  );

  useEffect(() => {
    if (!token || !isLoggedIn) {
      setChats([]);
      setError('');
      setHydrated(false);
      setLastFetchedAt(null);
      setConversationStore({});
      conversationStoreRef.current = {};
      conversationInflightRef.current.clear();
      return;
    }

    loadChats().catch(() => {});
  }, [token, isLoggedIn, loadChats]);

  const setConversationEntry = useCallback((chatId, partial) => {
    if (!chatId) return;
    setConversationStore((prev) => {
      const key = String(chatId);
      const existing = prev[key] || {};
      const nextEntry = {
        ...existing,
        ...partial,
      };
      const nextStore = {
        ...prev,
        [key]: nextEntry,
      };
      conversationStoreRef.current = nextStore;
      return nextStore;
    });
  }, []);

  const getConversationEntry = useCallback(
    (chatId) => {
      if (!chatId) return null;
      const key = String(chatId);
      return conversationStore[key] || null;
    },
    [conversationStore],
  );

  const prefetchChatMessages = useCallback(
    async (chatId, { silent = false, force = false } = {}) => {
      if (!chatId || !token || !isLoggedIn) return [];
      const key = String(chatId);
      const existing = conversationStoreRef.current[key];
      if (!force && existing?.messages?.length) {
        if (!existing.loading) return existing.messages;
      }

      if (conversationInflightRef.current.has(key)) {
        return conversationInflightRef.current.get(key);
      }

      if (!silent) {
        setConversationEntry(key, { loading: true, error: '' });
      }

      const promise = (async () => {
        try {
          const response = await fetchChatMessages(key, { limit: 200 }, { token });
          const normalized = normalizeMessages(response);
          setConversationEntry(key, {
            messages: normalized,
            payload: response,
            loading: false,
            error: '',
            lastFetchedAt: Date.now(),
          });
          return { messages: normalized, payload: response };
        } catch (err) {
          const message = err?.message || 'Unable to load messages.';
          setConversationEntry(key, {
            loading: false,
            error: message,
            lastFetchedAt: Date.now(),
          });
          throw err;
        } finally {
          conversationInflightRef.current.delete(key);
        }
      })();

      conversationInflightRef.current.set(key, promise);
      return promise;
    },
    [token, isLoggedIn, setConversationEntry],
  );

  useEffect(() => {
    if (!token || !isLoggedIn || !chats.length) return;
    const chatIds = chats
      .map((chat) => chat?._id || chat?.id)
      .filter(Boolean)
      .slice(0, MAX_PREFETCHED_CONVERSATIONS);
    const storeSnapshot = conversationStoreRef.current || {};
    const pending = chatIds.filter((chatId) => {
      const key = String(chatId);
      return !(storeSnapshot[key]?.messages?.length);
    });
    if (!pending.length) return;
    let cancelled = false;
    const run = async () => {
      for (const chatId of pending) {
        if (cancelled) break;
        await prefetchChatMessages(chatId, { silent: true }).catch(() => {});
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, isLoggedIn, chats, prefetchChatMessages]);

  const chatsById = useMemo(() => {
    const map = new Map();
    chats.forEach((chat) => {
      const chatId = chat?._id || chat?.id;
      if (!chatId) return;
      map.set(String(chatId), chat);
    });
    return map;
  }, [chats]);

  const getChatById = useCallback(
    (id) => {
      if (!id) return null;
      const lookupId = String(id);
      return chatsById.get(lookupId) || null;
    },
    [chatsById],
  );

  const value = useMemo(
    () => ({
      chats,
      loading,
      error,
      hydrated,
      lastFetchedAt,
      refreshChats: loadChats,
      getChatById,
      getChatMessages: getConversationEntry,
      prefetchChatMessages,
    }),
    [
      chats,
      loading,
      error,
      hydrated,
      lastFetchedAt,
      loadChats,
      getChatById,
      getConversationEntry,
      prefetchChatMessages,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
