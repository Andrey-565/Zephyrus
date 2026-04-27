import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import zephyrIcon from './assets/zephyr_coin.png';

interface UserData {
  id: number;
  username: string;
  email: string;
  zephyr_balance: number;
  mc_uuid: string | null;
  auth_code: string | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState(10);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('zephyrus-theme') as 'dark' | 'light') || 'dark';
  });

  // Состояния для настроек
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('zephyrus-token');
      if (!token) {
        navigate('/auth');
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setNewUsername(data.username);
          setNewEmail(data.email);
        } else {
          localStorage.removeItem('zephyrus-token');
          navigate('/auth');
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('zephyrus-theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('zephyrus-token');
    navigate('/auth');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return setSettingsError('Введите текущий пароль для подтверждения изменений');
    
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const token = localStorage.getItem('zephyrus-token');
      const res = await fetch('http://localhost:8000/api/auth/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_username: newUsername,
          new_email: newEmail,
          current_password: currentPassword,
          new_password: newPassword || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('Профиль успешно обновлен!');
        setUser(prev => prev ? { ...prev, username: data.username, email: data.email } : null);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setShowSettings(false), 2000);
      } else {
        setSettingsError(data.detail || 'Ошибка при обновлении профиля');
      }
    } catch (err) {
      setSettingsError('Ошибка соединения с сервером');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="bg-canvas"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <div className="w-12 h-12 border-4 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin relative z-10"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 transition-colors duration-500 overflow-hidden text-[var(--text-main)]">
      {/* Анимированный CSS-фон */}
      <div className="bg-canvas"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>

      {/* Кнопки в углу */}
      <div className="fixed top-6 right-6 flex gap-[15px] z-[100]">
        <button 
          onClick={toggleTheme}
          className="w-[45px] h-[45px] rounded-full bg-[var(--btn-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_4px_10px_var(--shadow-color)] hover:scale-110 hover:bg-[var(--btn-hover)] hover:text-[#8b5cf6] transition-all duration-300 overflow-hidden relative" 
        >
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${theme === 'dark' ? 'translate-y-0 rotate-0' : '-translate-y-full rotate-90 opacity-0'}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${theme === 'light' ? 'translate-y-0 rotate-0' : 'translate-y-full -rotate-90 opacity-0'}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </div>
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="w-[45px] h-[45px] rounded-full bg-[var(--btn-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_4px_10px_var(--shadow-color)] hover:scale-110 hover:bg-[var(--btn-hover)] hover:text-[#8b5cf6] transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
      </div>

      {/* Основная карточка кабинета */}
      <div className="w-full max-w-[1000px] bg-[var(--container-bg)] border border-[var(--border-color)] rounded-[40px] p-8 md:p-12 backdrop-blur-[40px] shadow-[0_30px_100px_var(--shadow-color)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Хедер */}
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-[var(--text-title)] tracking-tight">Привет, {user.username}!</h2>
          <div className="flex items-center gap-3 bg-[var(--feature-bg)] border border-[var(--border-color)] px-5 py-2 rounded-full shadow-inner">
            <img src={zephyrIcon} className="w-6 h-6 object-cover rounded-full drop-shadow-[0_0_8px_rgba(244,114,182,0.3)]" alt="Zephyr" />
            <span className="text-[var(--text-main)] font-black text-base">{user.zephyr_balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Статус привязки */}
        <div className={`rounded-2xl p-6 mb-10 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-500 ${user.mc_uuid ? 'bg-green-500/5 border border-green-500/20' : 'bg-[var(--feature-bg)] border border-[var(--border-color)]'}`}>
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
               <h4 className="text-lg font-bold text-[var(--text-main)]">Связь с сервером</h4>
               <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${user.mc_uuid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                 {user.mc_uuid ? 'Привязан' : 'Не привязан'}
               </span>
            </div>
            <p className="opacity-60 text-sm">
              {user.mc_uuid 
                ? 'Ваш игровой аккаунт успешно синхронизирован с личным кабинетом.' 
                : 'Привяжите ваш аккаунт Minecraft, чтобы управлять инвентарем и балансом.'}
            </p>
          </div>
          {user.mc_uuid ? (
            <div className="bg-green-500/10 border border-green-500/20 px-6 py-2 rounded-xl flex items-center gap-3 text-green-500 font-bold shadow-lg shadow-green-500/10">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Подключено
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="bg-blue-500/10 border border-blue-500/20 px-6 py-2 rounded-xl flex items-center gap-3 text-blue-500 font-bold group cursor-pointer active:scale-95 transition-all" 
                onClick={() => {
                  navigator.clipboard.writeText(`/link ${user.auth_code}`);
                  alert('Команда скопирована!');
                }}
              >
                <code className="tracking-wider">/link {user.auth_code}</code>
                <svg className="group-hover:scale-110 transition-transform" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </div>
              <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest">Нажмите, чтобы скопировать</span>
            </div>
          )}
        </div>

        {/* Сетка плиток */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="md:col-span-2 grid grid-cols-2 gap-6">
            {/* Настройки */}
            <div 
              onClick={() => setShowSettings(true)}
              className="bg-[var(--feature-bg)] border border-[var(--border-color)] rounded-[32px] p-8 text-center flex flex-col items-center hover:bg-[var(--btn-hover)] transition-all cursor-pointer group h-fit"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33-1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Настройки аккаунта</h3>
              <p className="opacity-60 text-sm leading-relaxed">Смена никнейма, почты или вашего пароля.</p>
            </div>

            {/* Инвентарь */}
            <div className="bg-[var(--feature-bg)] border border-[var(--border-color)] rounded-[32px] p-8 text-center flex flex-col items-center hover:bg-[var(--btn-hover)] transition-all cursor-pointer group h-fit">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M21 11H3V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><rect x="10" y="9" width="4" height="4" rx="1"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Инвентарь</h3>
              <p className="opacity-60 text-sm leading-relaxed">Ваши предметы в облачном хранилище.</p>
            </div>

            {/* Маркетплейс */}
            <div className="col-span-2 bg-[var(--feature-bg)] border border-[var(--border-color)] rounded-[32px] p-8 flex items-center gap-8 hover:bg-[var(--btn-hover)] transition-all cursor-pointer group">
              <div className="w-20 h-20 bg-purple-500/10 rounded-[24px] flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Маркетплейс</h3>
                <p className="opacity-60 text-sm">Покупайте и продавайте игровые предметы другим игрокам за Зефирки.</p>
              </div>
              <div className="ml-auto w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-500 opacity-0 group-hover:opacity-100 transition-all">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>

          {/* Обмен валюты */}
          <div className="bg-[var(--feature-bg)] border border-[var(--border-color)] rounded-[32px] p-8 text-center flex flex-col items-center justify-center shadow-inner">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Обмен валюты</h3>
            <p className="opacity-60 text-sm mb-6">Обменяйте Зефирки на Алмазы.</p>
            
            <div className="flex items-center gap-3 mb-6 text-sm font-bold opacity-80">
              <span className="text-lg">10</span>
              <img src={zephyrIcon} className="w-5 h-5 object-cover rounded-full" alt="" />
              <span className="text-lg mx-1">➜</span>
              <span className="text-lg">1</span>
              <img src="https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/diamond.png" className="w-6 h-6 object-contain" alt="Diamond" />
            </div>

            <div className="flex items-center bg-white/[0.08] dark:bg-white/[0.05] border border-[var(--border-color)] rounded-xl mb-4 overflow-hidden shadow-inner">
              <button onClick={() => setExchangeAmount(Math.max(10, exchangeAmount - 10))} className="px-3 py-2 hover:bg-white/10 transition-colors opacity-50">－</button>
              <input type="text" value={exchangeAmount} readOnly className="w-16 text-center bg-transparent font-bold text-lg outline-none" />
              <button onClick={() => setExchangeAmount(exchangeAmount + 10)} className="px-3 py-2 hover:bg-white/10 transition-colors opacity-50">＋</button>
            </div>

            <button className="w-full py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black rounded-xl shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all active:scale-95">
              Обменять
            </button>
          </div>

        </div>

        {/* Футер карточки */}
        <div className="flex justify-start">
           <button 
             onClick={handleLogout}
             className="px-6 py-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-sm transition-all"
           >
             Выйти из аккаунта
           </button>
        </div>

      </div>

      {/* МОДАЛЬНОЕ ОКНО НАСТРОЕК */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="w-full max-w-md bg-[var(--container-bg)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-2xl relative z-10 animate-[fadeIn_0.3s_ease-out] backdrop-blur-2xl">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 opacity-40 hover:opacity-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <h3 className="text-2xl font-black text-[var(--text-title)] mb-6 uppercase tracking-tight">Настройки</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Никнейм</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-white/[0.05] dark:bg-white/[0.03] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ваш новый никнейм"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white/[0.05] dark:bg-white/[0.03] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ваша новая почта"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-black uppercase tracking-widest text-blue-500 mb-2 ml-1 opacity-60">Смена пароля (необязательно)</label>
                <div className="relative">
                  <input 
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/[0.05] dark:bg-white/[0.03] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Новый пароль"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {showNewPass ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-widest text-red-500 mb-2 ml-1 opacity-60">Подтверждение</label>
                <div className="relative">
                  <input 
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/[0.05] dark:bg-white/[0.03] border border-red-500/20 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-all pr-12"
                    placeholder="Текущий пароль"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {showCurrentPass ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {settingsError && <div className="text-red-500 text-sm font-bold text-center">{settingsError}</div>}
              {settingsSuccess && <div className="text-green-500 text-sm font-bold text-center">{settingsSuccess}</div>}

              <button 
                type="submit"
                disabled={settingsLoading}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {settingsLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
