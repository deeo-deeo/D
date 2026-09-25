import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { playTibiaSound } from '../utils/audio';
import { sendNativeNotification } from '../utils/notifications';

export function useSupabaseChat(currentUser, session, activeTab, activeDMUser, soundEnabled) {
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadDMs, setUnreadDMs] = useState({});

  const activeTabRef = useRef(activeTab);
  const activeDMUserRef = useRef(activeDMUser);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { activeDMUserRef.current = activeDMUser; }, [activeDMUser]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  const fetchDirectMessages = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender.eq.${currentUser},receiver.eq.${currentUser}`)
      .order('created_at', { ascending: true });
    if (data) setDirectMessages(data);
  }, [currentUser]);

  const fetchFriendRequests = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`sender.eq.${currentUser},receiver.eq.${currentUser}`);

    if (data) {
      setFriendRequests(data);
      const accepted = data
        .filter((req) => req.status === 'accepted')
        .map((req) => (req.sender === currentUser ? req.receiver : req.sender));
      setFriends([...new Set(accepted)]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !session?.user?.id) return;

    fetchMessages();
    fetchFriendRequests();
    fetchDirectMessages();

    const channelId = `${session.user.id}_${Date.now()}`;

    const msgChannel = supabase
      .channel(`msg_channel_${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        const isMyMsg = payload.new.user_id ? payload.new.user_id === session?.user?.id : payload.new.author === currentUser;
        if (!isMyMsg) {
          playTibiaSound(soundEnabled);
          if (document.hidden || activeTabRef.current !== 'chat') {
            setUnreadGlobal((prev) => prev + 1);
            sendNativeNotification('Nova mensagem em #geral', `${payload.new.author}: ${payload.new.content}`);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();

    const dmChannel = supabase
      .channel(`dm_channel_${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const newMsg = payload.new;
        const isMyDMSender = newMsg.user_id ? newMsg.user_id === session?.user?.id : newMsg.sender === currentUser;

        if (isMyDMSender || newMsg.receiver === currentUser) {
          setDirectMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          if (!isMyDMSender) {
            playTibiaSound(soundEnabled);
            if (document.hidden || activeTabRef.current !== 'dm' || activeDMUserRef.current !== newMsg.sender) {
              setUnreadDMs((prev) => ({ ...prev, [newMsg.sender]: (prev[newMsg.sender] || 0) + 1 }));
              sendNativeNotification(`Mensagem de @${newMsg.sender}`, newMsg.content);
            }
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        setDirectMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages' }, (payload) => {
        setDirectMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();

    const reqChannel = supabase
      .channel(`req_channel_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchFriendRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(reqChannel);
    };
  }, [currentUser, session?.user?.id, fetchMessages, fetchDirectMessages, fetchFriendRequests, soundEnabled]);

  return {
    messages,
    setMessages,
    directMessages,
    setDirectMessages,
    friends,
    friendRequests,
    fetchFriendRequests,
    unreadGlobal,
    setUnreadGlobal,
    unreadDMs,
    setUnreadDMs
  };
}
