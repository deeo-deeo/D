import React, { useState, useEffect } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from './supabaseClient';
import MainLayout from './MainLayout';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputNickname, setInputNickname] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          await fetchUserProfileById(session.user);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão inicial:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          setLoading(true);
          await fetchUserProfileById(currentSession.user);
          if (isMounted) setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser('');
        setCurrentUserAvatar('');
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfileById = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data && data.username) {
        setCurrentUser(data.username);
        if (data.avatar_url) {
          setCurrentUserAvatar(data.avatar_url);
        }
      } else {
        const fallbackName = user.user_metadata?.username || (user.email ? user.email.split('@')[0] : 'Usuario');
        const { error: upsertErr } = await supabase.from('profiles').upsert(
          {
            id: user.id,
            username: fallbackName
          },
          { onConflict: 'id' }
        );

        if (upsertErr) {
          console.warn('Aviso ao criar/atualizar perfil:', upsertErr);
        }
        setCurrentUser(fallbackName);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      const fallback = user.email ? user.email.split('@')[0] : 'Usuario';
      setCurrentUser(fallback);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanNick = inputNickname.trim();
    if (!cleanNick) {
      setAuthError('O nome de usuário é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: inputEmail,
        password: inputPassword,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: cleanNick,
        });

        if (profileError) {
          setAuthError('Erro ao registrar perfil de usuário.');
          return;
        }

        setAuthSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        setInputEmail('');
        setInputPassword('');
        setInputNickname('');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de conexão ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      });

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de conexão ao entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser('');
    setCurrentUserAvatar('');
  };

  if (loading || (session && !currentUser)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#313338] text-white gap-3">
        <div className="w-8 h-8 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-sm text-gray-300">Carregando ambiente...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#313338] text-white p-4">
        <form onSubmit={isRegistering ? handleSignUp : handleSignIn} className="bg-[#313338] p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4 border border-[#2b2d31]">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">{isRegistering ? 'Criar Conta' : 'Bem-vindo ao D'}</h2>
            <p className="text-xs text-gray-400">
              {isRegistering ? 'Preencha os dados para se cadastrar' : 'Insira seus dados para entrar'}
            </p>
          </div>

          {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
          {authSuccess && <p className="text-xs text-green-400 text-center">{authSuccess}</p>}

          <div className="space-y-3">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputNickname}
                    onChange={(e) => setInputNickname(e.target.value)}
                    placeholder="Usuário001"
                    className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2 rounded focus:outline-none border border-[#3f4147] focus:border-[#5865f2] text-sm"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2 rounded focus:outline-none border border-[#3f4147] focus:border-[#5865f2] text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2 rounded focus:outline-none border border-[#3f4147] focus:border-[#5865f2] text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2.5 rounded font-medium transition-colors cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processando...</span>
              </>
            ) : (
              <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
                setAuthSuccess('');
              }}
              className="text-xs text-[#00a8fc] hover:underline cursor-pointer"
            >
              {isRegistering
                ? 'Já tem uma conta? Entre aqui'
                : 'Não tem conta? Crie uma agora'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <MainLayout
      session={session}
      currentUser={currentUser}
      avatarUrl={currentUserAvatar}
      onUpdateAvatar={setCurrentUserAvatar}
      onLogout={handleLogout}
    />
  );
}
