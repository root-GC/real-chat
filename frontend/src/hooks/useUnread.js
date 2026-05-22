import { useState, useEffect, useCallback, useRef } from 'react';

const UNREAD_KEY = 'chat_unread';

function readGlobalUnread() {
  try {
    return JSON.parse(localStorage.getItem(UNREAD_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeGlobalUnread(map) {
  localStorage.setItem(UNREAD_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('unread-update', { detail: map }));
}

export default function useUnread() {
  const [unread, setUnread] = useState(readGlobalUnread);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const handler = (e) => setUnread(e.detail);
    window.addEventListener('unread-update', handler);
    return () => window.removeEventListener('unread-update', handler);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const current = readGlobalUnread();
      if (JSON.stringify(current) !== JSON.stringify(unread)) {
        setUnread(current);
      }
    }
  }, []);

  const incrementUnread = useCallback((username) => {
    const current = readGlobalUnread();
    const newCount = (current[username] || 0) + 1;
    if (current[username] !== newCount) {
      current[username] = newCount;
      writeGlobalUnread(current);
    }
  }, []);

  const resetUnread = useCallback((username) => {
    const current = readGlobalUnread();
    if (current[username] !== undefined && current[username] !== 0) {
      current[username] = 0;
      writeGlobalUnread(current);
    }
  }, []);

  return { unread, incrementUnread, resetUnread };
}