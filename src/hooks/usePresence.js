import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function usePresence(userId, userMetadata = {}) {
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!userId) return;

    // Criar um canal global de presença
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId, // Garante deduplicação caso o utilizador tenha múltiplas abas abertas
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Estado completo sincronizado
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => ({ ...prev, [key]: newPresences }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track do estado inicial
          await channel.track({
            online_at: new Date().toISOString(),
            status: 'online',
            ...userMetadata,
          });
        }
      });

    // Tratar mudanças de visibilidade da página (Aba em background/foco)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        await channel.track({
          online_at: new Date().toISOString(),
          status: 'away', // Opcional: marca como ausente em vez de desconectar
          ...userMetadata,
        });
      } else {
        await channel.track({
          online_at: new Date().toISOString(),
          status: 'online',
          ...userMetadata,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel.unsubscribe();
    };
  }, [userId]);

  /**
   * Helper para verificar se um determinado ID está online
   */
  const isUserOnline = (targetUserId) => {
    return Boolean(onlineUsers[targetUserId]);
  };

  /**
   * Helper para obter metadados (status, visto por último)
   */
  const getUserPresence = (targetUserId) => {
    const userPresenceArr = onlineUsers[targetUserId];
    return userPresenceArr ? userPresenceArr[0] : null;
  };

  return { onlineUsers, isUserOnline, getUserPresence };
}
