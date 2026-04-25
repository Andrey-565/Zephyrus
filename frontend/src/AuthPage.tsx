import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  
  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  
  // Register form state
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPwd, setRegPwd] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('zephyrus-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      localStorage.setItem('zephyrus-theme', 'light');
    } else {
      setTheme('dark');
      localStorage.setItem('zephyrus-theme', 'dark');
    }
  };

  const getPwdStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const pwdStrength = getPwdStrength(regPwd);
  const pwdBarWidth = regPwd.length === 0 ? '0%' : pwdStrength === 1 ? '33%' : pwdStrength === 2 ? '66%' : '100%';
  const pwdBarColor = pwdStrength === 1 ? '#ef4444' : pwdStrength === 2 ? '#f59e0b' : '#10b981';

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPwd) {
      setErrorMsg('Введите логин и пароль');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPwd })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('zephyrus-token', data.access_token);
        setSuccessMsg('Успешный вход! Перенаправляем...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setErrorMsg(data.detail || 'Ошибка авторизации');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUser || regUser.length < 3) return setErrorMsg('Никнейм слишком короткий');
    if (!validateEmail(regEmail)) return setErrorMsg('Некорректный Email');
    if (regPwd.length < 8) return setErrorMsg('Пароль должен быть от 8 символов');

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUser, email: regEmail, password: regPwd })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Регистрация успешна! Теперь вы можете войти.');
        setActiveTab('login');
      } else {
        setErrorMsg(data.detail || 'Ошибка регистрации');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Анимированный CSS-фон */}
      <div className="bg-canvas"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>

      {/* Кнопки в шапке */}
      <div className="fixed top-[25px] right-[25px] flex gap-[15px] z-[100]">
        <button 
          onClick={toggleTheme}
          className="w-[45px] h-[45px] rounded-full bg-[var(--btn-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_4px_10px_var(--shadow-color)] hover:scale-110 hover:bg-[var(--btn-hover)] hover:text-[#8b5cf6] transition-all duration-300 overflow-hidden relative" 
          aria-label="Смена темы"
        >
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${theme === 'dark' ? 'translate-y-0 rotate-0' : '-translate-y-full rotate-90 opacity-0'}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${theme === 'light' ? 'translate-y-0 rotate-0' : 'translate-y-full -rotate-90 opacity-0'}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </div>
        </button>
        <button onClick={() => navigate('/')} className="w-[45px] h-[45px] rounded-full bg-[var(--btn-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_4px_10px_var(--shadow-color)] hover:scale-110 hover:bg-[var(--btn-hover)] hover:text-[#8b5cf6] transition-all duration-300" aria-label="На главную">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-[500px] bg-[var(--container-bg)] border border-[var(--border-color)] rounded-3xl p-10 text-center relative z-10 shadow-[0_20px_50px_var(--shadow-color)] transition-colors duration-500">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] mb-2 tracking-tight">
            {activeTab === 'login' ? 'Добро пожаловать' : 'Присоединяйтесь'}
          </h1>
          <p className="text-[var(--text-secondary)] text-[0.95rem]">
            {activeTab === 'login' ? 'Войдите в свой аккаунт Zephyrus' : 'Создайте аккаунт и начните игру'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--tab-bg)] rounded-xl p-[6px] mb-8 relative border border-[var(--glass-border)] transition-colors duration-500">
          <div 
            className="absolute top-[6px] bottom-[6px] w-[calc(50%-6px)] bg-[var(--tab-active-bg)] rounded-lg shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[1]"
            style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
          ></div>
          <button 
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-[2] transition-colors duration-300 ${activeTab === 'login' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
          >
            Вход
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg relative z-[2] transition-colors duration-300 ${activeTab === 'register' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
          >
            Регистрация
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-3 px-5 rounded-xl text-sm font-semibold mb-6 animate-[shake_0.4s_ease-in-out]">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] py-3 px-5 rounded-xl text-sm font-semibold mb-6 animate-[authFadeIn_0.3s_ease-out]">
            {successMsg}
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-6 text-left animate-[authFadeIn_0.5s_ease-out]">
            <div className="flex flex-col gap-2">
              <label className="text-[0.8rem] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Логин или Email</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-black/5 border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[#3b82f6] focus:bg-[#3b82f6]/5 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
                placeholder="Никнейм или почта"
              />
            </div>
            
            <div className="flex flex-col gap-2 relative">
              <div className="flex justify-between items-center">
                <label className="text-[0.8rem] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Пароль</label>
                <span onClick={() => setShowDiscordModal(true)} className="text-[0.8rem] text-[#3b82f6] font-semibold cursor-pointer hover:underline opacity-80 hover:opacity-100 transition-opacity">Забыли пароль?</span>
              </div>
              <div className="relative">
                <input 
                  type={showLoginPwd ? "text" : "password"} 
                  value={loginPwd}
                  onChange={e => setLoginPwd(e.target.value)}
                  className="w-full px-5 py-4 pr-12 rounded-xl bg-black/5 border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[#3b82f6] focus:bg-[#3b82f6]/5 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="absolute right-4 top-[50%] -translate-y-[50%] text-[var(--text-secondary)] hover:text-[#3b82f6] transition-colors">
                  {showLoginPwd ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" className="mt-2 w-full h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-colors relative flex items-center justify-center">
              {loading ? (
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Войти в аккаунт'
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-6 text-left animate-[authFadeIn_0.5s_ease-out]">
            <div className="flex flex-col gap-2">
              <label className="text-[0.8rem] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Игровой никнейм</label>
              <input 
                type="text" 
                value={regUser}
                onChange={e => setRegUser(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-black/5 border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[#3b82f6] focus:bg-[#3b82f6]/5 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
                placeholder="Ваш ник на сервере"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.8rem] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Электронная почта</label>
              <input 
                type="email" 
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-black/5 border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[#3b82f6] focus:bg-[#3b82f6]/5 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
                placeholder="name@example.com"
              />
            </div>
            
            <div className="flex flex-col gap-2 relative">
              <label className="text-[0.8rem] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Надежный пароль</label>
              <div className="relative">
                <input 
                  type={showRegPwd ? "text" : "password"} 
                  value={regPwd}
                  onChange={e => setRegPwd(e.target.value)}
                  className="w-full px-5 py-4 pr-12 rounded-xl bg-black/5 border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[#3b82f6] focus:bg-[#3b82f6]/5 focus:ring-4 focus:ring-[#3b82f6]/10 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowRegPwd(!showRegPwd)} className="absolute right-4 top-[50%] -translate-y-[50%] text-[var(--text-secondary)] hover:text-[#3b82f6] transition-colors">
                  {showRegPwd ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              <div className="h-[6px] bg-black/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: pwdBarWidth, backgroundColor: pwdBarColor }}></div>
              </div>
            </div>

            <button disabled={loading} type="submit" className="mt-2 w-full h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-colors relative flex items-center justify-center">
              {loading ? (
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Discord Modal */}
      {showDiscordModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDiscordModal(false)}>
          <div className="bg-[var(--container-bg)] border border-[var(--border-color)] p-10 rounded-[30px] max-w-[400px] text-center shadow-2xl animate-[modalFadeIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-[#5865F2] rounded-2xl flex items-center justify-center mx-auto mb-5 text-white shadow-[0_10px_20px_rgba(88,101,242,0.3)]">
              <svg viewBox="0 0 24 24" width="45" height="45" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.054-.108.021-.23-.08-.273a13.114 13.114 0 0 1-1.897-.904.083.083 0 0 1-.008-.135c.133-.1.264-.2.393-.305a.078.078 0 0 1 .084-.011c3.963 1.814 8.255 1.814 12.173 0a.076.076 0 0 1 .084.011c.129.104.26.205.393.305a.082.082 0 0 1-.006.135 12.916 12.916 0 0 1-1.897.904.088.088 0 0 0-.08.273c.35.699.763 1.365 1.225 1.994.053.077.147.102.226.069a19.936 19.936 0 0 0 6.002-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-3 text-[var(--text-main)]">Забыли пароль?</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-[0.95rem] leading-relaxed">
              Для восстановления доступа, пожалуйста, свяжитесь с нами в <b className="text-[var(--text-main)]">Discord</b>. Наша команда поможет вам в кратчайшие сроки!
            </p>
            <button onClick={() => setShowDiscordModal(false)} className="w-full h-12 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-colors">
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
