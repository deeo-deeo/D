import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { validateMessage } from './security';
import { useSupabaseChat } from './hooks/useSupabaseChat';
import { ChatPanel } from './components/ChatPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { UserAvatar } from './components/UserAvatar';

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HashIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export default function MainLayout({ currentUser, session, onLogout, avatarUrl, onUpdateAvatar }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [activeDMUser, setActiveDMUser] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userStatus, setUserStatus] = useState('online');
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingDMId, setEditingDMId] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null, type: null });
  const [removeFriendModalState, setRemoveFriendModalState] = useState({ isOpen: false, friendName: null });
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl || '');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [profilesMap, setProfilesMap] = useState({});
  const [userStatusMap, setUserStatusMap] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const {
    messages,
    directMessages,
    friends,
    friendRequests,
    fetchFriendRequests,
    unreadGlobal,
    setUnreadGlobal,
    unreadDMs,
    setUnreadDMs
  } = useSupabaseChat(currentUser, session, activeTab, activeDMUser, soundEnabled);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, username, avatar_url, status');
    if (data) {
      const mapAvatars = {};
      const mapStatuses = {};
      data.forEach((p) => {
        if (p.username) {
          mapAvatars[p.username] = p.avatar_url;
          mapStatuses[p.username] = p.status || 'online';
        }
        if (session?.user?.id && p.id === session.user.id && p.status) {
          setUserStatus(p.status);
        }
      });
      setProfilesMap(mapAvatars);
      setUserStatusMap(mapStatuses);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [avatarUrl, currentUser, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channelId = `realtime_profiles_${session.user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.new) {
            const { id, username, status, avatar_url } = payload.new;
            if (id === session.user.id && status) {
              setUserStatus(status);
            }
            if (username) {
              if (status) {
                setUserStatusMap((prev) => ({ ...prev, [username]: status }));
              }
              if (avatar_url) {
                setProfilesMap((prev) => ({ ...prev, [username]: avatar_url }));
              }
            }
          }
        }
      )
      .subscribe();

    const handleFocusSync = () => {
      if (document.visibilityState === 'visible') {
        fetchProfiles();
      }
    };

    window.addEventListener('visibilitychange', handleFocusSync);
    window.addEventListener('focus', handleFocusSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('visibilitychange', handleFocusSync);
      window.removeEventListener('focus', handleFocusSync);
    };
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, directMessages, activeTab, activeDMUser]);

  const handleStatusChange = async (newStatus) => {
    setUserStatus(newStatus);
    if (session?.user?.id) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        username: currentUser,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const validation = validateMessage(inputMessage);
    if (!validation.isValid || !session?.user?.id) return;

    if (activeTab === 'chat') {
      if (editingMsgId) {
        await supabase.from('messages').update({ content: validation.sanitizedContent }).eq('id', editingMsgId);
        setEditingMsgId(null);
      } else {
        await supabase.from('messages').insert([{
          author: currentUser,
          content: validation.sanitizedContent,
          avatar_url: avatarUrl,
          user_id: session.user.id
        }]);
      }
    } else if (activeTab === 'dm' && activeDMUser) {
      if (editingDMId) {
        await supabase.from('direct_messages').update({ content: validation.sanitizedContent }).eq('id', editingDMId);
        setEditingDMId(null);
      } else {
        await supabase.from('direct_messages').insert([{
          sender: currentUser,
          receiver: activeDMUser,
          content: validation.sanitizedContent,
          avatar_url: avatarUrl,
          user_id: session.user.id
        }]);
      }
    }
    setInputMessage('');
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!friendUsernameInput.trim() || friendUsernameInput === currentUser) return;

    await supabase.from('friend_requests').insert([{
      sender: currentUser,
      receiver: friendUsernameInput.trim(),
      status: 'pending'
    }]);

    setFriendUsernameInput('');
    fetchFriendRequests();
  };

  const handleRespondFriendRequest = async (id, newStatus) => {
    if (newStatus === 'rejected') {
      await supabase.from('friend_requests').delete().eq('id', id);
    } else {
      await supabase.from('friend_requests').update({ status: newStatus }).eq('id', id);
    }
    fetchFriendRequests();
  };

  const confirmRemoveFriend = async () => {
    const friendName = removeFriendModalState.friendName;
    if (!friendName || !session?.user?.id) return;

    await supabase.from('direct_messages').insert([{
      sender: currentUser,
      receiver: friendName,
      content: `O usuário @${currentUser} desfez a amizade com você.`,
      avatar_url: avatarUrl,
      user_id: session.user.id
    }]);

    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender.eq.${currentUser},receiver.eq.${friendName}),and(sender.eq.${friendName},receiver.eq.${currentUser})`);

    setRemoveFriendModalState({ isOpen: false, friendName: null });
    fetchFriendRequests();
  };

  const confirmDelete = async () => {
    if (!deleteModalState.id) return;
    if (deleteModalState.type === 'message') {
      await supabase.from('messages').delete().eq('id', deleteModalState.id);
    } else if (deleteModalState.type === 'dm') {
      await supabase.from('direct_messages').delete().eq('id', deleteModalState.id);
    }
    setDeleteModalState({ isOpen: false, id: null, type: null });
  };

  const handleSaveAvatar = async (e) => {
    e.preventDefault();
    if (!avatarPreview || !session?.user?.id) return;
    setIsUpdatingAvatar(true);

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: currentUser,
      avatar_url: avatarPreview,
      status: userStatus,
      updated_at: new Date().toISOString()
    });

    if (!error && onUpdateAvatar) {
      onUpdateAvatar(avatarPreview);
      setProfilesMap((prev) => ({ ...prev, [currentUser]: avatarPreview }));
    }
    setIsUpdatingAvatar(false);
  };

  const handleLogoutClick = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    } finally {
      if (onLogout) onLogout();
    }
  };

  const selectTab = (tab, dmUser = null) => {
    setActiveTab(tab);
    setActiveDMUser(dmUser);
    setIsMobileMenuOpen(false);
  };

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  const statusLabels = {
    online: 'Online',
    idle: 'Ausente',
    dnd: 'Não Incomodar',
    offline: 'Invisível'
  };

  const activeDMMessages = directMessages.filter(
    (m) => (m.sender === currentUser && m.receiver === activeDMUser) || (m.sender === activeDMUser && m.receiver === currentUser)
  );

  return (
    <div className="fixed inset-0 flex bg-[#313338] text-white font-sans overflow-hidden">
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
        />
      )}

      <div
        className={`fixed md:relative z-30 w-64 h-full bg-[#2b2d31] flex flex-col justify-between border-r border-[#1e1f22] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 font-bold text-gray-200 flex-shrink-0">
            <span>D-Chat</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-[#35373c]"
                title={soundEnabled ? "Sons ativados" : "Sons desativados"}
                type="button"
              >
                {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden text-gray-400 hover:text-white p-1"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                selectTab('chat');
                setUnreadGlobal(0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'chat' ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HashIcon />
                <span>geral</span>
              </div>
              {unreadGlobal > 0 && (
                <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadGlobal}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('friends')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'friends' ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon />
                <span>Amigos</span>
              </div>
              {friendRequests.filter((r) => r.receiver === currentUser && r.status === 'pending').length > 0 && (
                <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {friendRequests.filter((r) => r.receiver === currentUser && r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <SettingsIcon />
                <span>Configurações</span>
              </div>
            </button>
          </div>

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Mensagens Diretas
          </div>

          <div className="p-2 space-y-0.5 flex-1">
            {friends.length === 0 ? (
              <p className="text-xs text-gray-500 px-3 py-2">Nenhum amigo adicionado.</p>
            ) : (
              friends.map((friend) => (
                <button
                  type="button"
                  key={friend}
                  onClick={() => {
                    selectTab('dm', friend);
                    setUnreadDMs((prev) => ({ ...prev, [friend]: 0 }));
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                    activeTab === 'dm' && activeDMUser === friend
                      ? 'bg-[#404249] text-white'
                      : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="relative">
                      <UserAvatar url={profilesMap[friend]} name={friend} size="w-6 h-6" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#2b2d31] ${statusColors[userStatusMap[friend] || 'offline']}`}></span>
                    </div>
                    <span className="truncate">{friend}</span>
                  </div>
                  {unreadDMs[friend] > 0 && (
                    <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadDMs[friend]}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-2 bg-[#232428] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="relative">
              <UserAvatar url={avatarUrl || profilesMap[currentUser]} name={currentUser} />
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${statusColors[userStatus]}`}></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser}</div>
              <div className="text-[10px] text-gray-400 capitalize">{statusLabels[userStatus]}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => selectTab('settings')}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Configurações do Utilizador"
            >
              <SettingsIcon />
            </button>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
              title="Sair da conta"
            >
              <LogOutIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#313338] min-w-0 h-full overflow-hidden">
        <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 font-bold text-white shadow-sm bg-[#313338] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <MenuIcon />
            </button>
            {activeTab === 'chat' && <span className="text-gray-400"># geral</span>}
            {activeTab === 'dm' && <span className="text-gray-400">@ {activeDMUser}</span>}
            {activeTab === 'friends' && <span>Gerenciar Amigos</span>}
            {activeTab === 'settings' && <span>Configurações</span>}
          </div>
        </div>

        {activeTab === 'settings' && (
          <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-w-3xl">
            <div className="bg-[#2b2d31] p-4 sm:p-5 rounded-lg border border-[#1e1f22] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-[#35373c] pb-2">
                Perfil de Usuário
              </h3>
              <form onSubmit={handleSaveAvatar} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <UserAvatar url={avatarPreview || avatarUrl} name={currentUser} size="w-16 h-16" />
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                      Foto de Perfil (Arquivo Local)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-base sm:text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#35373c] file:text-white hover:file:bg-[#404249] cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingAvatar}
                    className="w-full sm:w-auto bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm px-4 py-2 rounded font-medium transition-colors cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UploadIcon />
                    <span>{isUpdatingAvatar ? "Salvando..." : "Salvar Alterações"}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-[#2b2d31] p-4 sm:p-5 rounded-lg border border-[#1e1f22] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-[#35373c] pb-2">
                Estado de Presença
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(statusLabels).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      userStatus === key
                        ? 'border-[#5865f2] bg-[#35373c]'
                        : 'border-[#1e1f22] bg-[#1e1f22] hover:bg-[#2b2d31]'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${statusColors[key]}`}></span>
                    <span className="text-sm font-medium text-white">{statusLabels[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#2b2d31] p-4 sm:p-5 rounded-lg border border-[#1e1f22] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-[#35373c] pb-2">
                Preferências de Áudio e Notificações
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">Efeitos Sonoros</div>
                    <div className="text-xs text-gray-400">Tocar som ao receber mensagens</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      soundEnabled ? 'bg-[#23a55a] justify-end' : 'bg-[#80848e] justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">Notificações no Navegador</div>
                    <div className="text-xs text-gray-400">Exibir alertas na área de trabalho</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      notificationsEnabled ? 'bg-[#23a55a] justify-end' : 'bg-[#80848e] justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
            <form onSubmit={handleSendFriendRequest} className="bg-[#2b2d31] p-4 rounded-lg border border-[#1e1f22] space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Adicionar Amigo</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={friendUsernameInput}
                  onChange={(e) => setFriendUsernameInput(e.target.value)}
                  placeholder="Insira o nome do usuário"
                  className="flex-1 bg-[#1e1f22] text-white text-base sm:text-sm px-3 py-2 rounded focus:outline-none border border-transparent focus:border-[#5865f2]"
                />
                <button type="submit" className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm px-4 py-2 rounded font-medium transition-colors cursor-pointer">
                  Enviar Pedido
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Lista de Amigos ({friends.length})
              </h3>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">Nenum amigo adicionado.</p>
              ) : (
                friends.map((friend) => (
                  <div key={friend} className="bg-[#2b2d31] p-3 rounded-lg border border-[#1e1f22] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserAvatar url={profilesMap[friend]} name={friend} size="w-8 h-8" />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${statusColors[userStatusMap[friend] || 'offline']}`}></span>
                      </div>
                      <span className="text-sm font-medium text-white">{friend}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemoveFriendModalState({ isOpen: true, friendName: friend })}
                      className="bg-[#da373c] hover:bg-[#a1282b] text-white text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Solicitações Pendentes</h3>
              {friendRequests.filter((r) => r.status === 'pending').length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma solicitação pendente.</p>
              ) : (
                friendRequests.filter((r) => r.status === 'pending').map((req) => (
                  <div key={req.id} className="bg-[#2b2d31] p-3 rounded-lg border border-[#1e1f22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-sm text-gray-200">
                      {req.sender === currentUser ? `Enviado para @${req.receiver}` : `De @${req.sender}`}
                    </span>
                    {req.receiver === currentUser ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                          className="flex-1 sm:flex-initial bg-[#248046] hover:bg-[#1a6334] text-white text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondFriendRequest(req.id, 'rejected')}
                          className="flex-1 sm:flex-initial bg-[#da373c] hover:bg-[#a1282b] text-white text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Recusar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Pendente</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {(activeTab === 'chat' || activeTab === 'dm') && (
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'chat' ? (
              <ChatPanel
                messages={messages}
                currentUser={currentUser}
                onDeleteMessage={(id) => setDeleteModalState({ isOpen: true, id, type: 'message' })}
                onEditMessage={(msg) => { setEditingMsgId(msg.id); setInputMessage(msg.content); }}
                profilesMap={profilesMap}
              />
            ) : (
              <ChatPanel
                messages={activeDMMessages}
                currentUser={currentUser}
                onDeleteMessage={(id) => setDeleteModalState({ isOpen: true, id, type: 'dm' })}
                onEditMessage={(msg) => { setEditingDMId(msg.id); setInputMessage(msg.content); }}
                profilesMap={profilesMap}
              />
            )}
            <div ref={messagesEndRef} />

            <form onSubmit={handleSendMessage} className="p-2 sm:p-4 bg-[#313338] flex-shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    editingMsgId || editingDMId
                      ? "Editando mensagem..."
                      : activeTab === 'chat'
                      ? "Conversar em #geral"
                      : `Conversar com @${activeDMUser}`
                  }
                  className="w-full bg-[#383a40] text-white px-4 py-2.5 rounded-lg focus:outline-none border border-transparent focus:border-[#5865f2] text-base sm:text-sm placeholder-gray-500"
                />
                {(editingMsgId || editingDMId) && (
                  <button
                    type="button"
                    onClick={() => { setEditingMsgId(null); setEditingDMId(null); setInputMessage(''); }}
                    className="absolute right-3 text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Excluir Mensagem"
        description="Tem certeza de que deseja apagar esta mensagem permanentemente?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, id: null, type: null })}
      />

      <ConfirmModal
        isOpen={removeFriendModalState.isOpen}
        title="Remover Amigo"
        description={`Tem certeza de que deseja remover @${removeFriendModalState.friendName} da sua lista de amigos?`}
        onConfirm={confirmRemoveFriend}
        onCancel={() => setRemoveFriendModalState({ isOpen: false, friendName: null })}
      />
    </div>
  );
}
