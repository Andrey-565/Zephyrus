import React, { useState, useEffect, useRef } from 'react';

interface Feature {
  title: string;
  description: string;
  images: string[];
}
interface Rule {
  title: string;
  description: string;
}
interface Legal {
  terms: string;
  privacy: string;
}
interface Data {
  server_name: string;
  about_us: string;
  discord_link: string;
  map_link: string;
  logo: string;
  review_video: {
    link: string;
    thumbnail: string;
  };
  features: Feature[];
  rules: Rule[];
  legal: Legal;
  copyright: string;
}

export default function HomePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Читаем сохранённую тему из localStorage, по умолчанию 'dark'
    return (localStorage.getItem('zephyrus-theme') as 'dark' | 'light') || 'dark';
  });
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoSpot, setLogoSpot] = useState<{ x: number; y: number; visible: boolean }>({ x: 50, y: 50, visible: false });

  const fetchData = () => {
    setLoading(true);
    setError(false);
    fetch('http://localhost:8000/api/homepage')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // Применяем сохранённую тему при загрузке
    const saved = localStorage.getItem('zephyrus-theme') || 'dark';
    if (saved === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.body.classList.remove('dark');
      localStorage.setItem('zephyrus-theme', 'light');
    } else {
      setTheme('dark');
      document.body.classList.add('dark');
      localStorage.setItem('zephyrus-theme', 'dark');
    }
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="bg-canvas"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <div className="w-[90%] max-w-[650px] bg-[var(--container-bg)] border border-[var(--border-color)] rounded-3xl p-10 relative z-10 shadow-[0_20px_50px_var(--shadow-color)] animate-pulse transition-colors duration-500">
          <div className="w-[100px] h-[100px] mx-auto mb-5 rounded-2xl bg-[var(--feature-bg)]"></div>
          <div className="h-12 w-48 bg-[var(--feature-bg)] mx-auto rounded mb-[30px]"></div>
          <div className="h-12 w-full bg-[var(--tab-bg)] rounded-xl mb-[30px]"></div>
          <div className="space-y-3">
            <div className="h-4 bg-[var(--feature-bg)] rounded w-full"></div>
            <div className="h-4 bg-[var(--feature-bg)] rounded w-5/6 mx-auto"></div>
            <div className="h-4 bg-[var(--feature-bg)] rounded w-4/6 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
        <div className="bg-canvas"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <p className="text-xl mb-4 relative z-10">Ошибка при загрузке данных с сервера</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#8b5cf6] text-white font-bold rounded-xl hover:brightness-110 transition-all relative z-10">
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customLogoFloat {
            0% { transform: translateY(0); box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
            50% { transform: translateY(-10px); box-shadow: 0 0 35px rgba(139, 92, 246, 0.4); }
            100% { transform: translateY(0); box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
      `}} />

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
        <button className="w-[45px] h-[45px] rounded-full bg-[var(--btn-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_4px_10px_var(--shadow-color)] hover:scale-110 hover:bg-[var(--btn-hover)] hover:text-[#8b5cf6] transition-all duration-300" aria-label="Личный кабинет">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>
      </div>

      {/* Модальное окно */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div 
            className="w-full max-w-2xl bg-[var(--container-bg)] rounded-3xl p-8 border border-[var(--border-color)] shadow-[0_20px_60px_var(--shadow-color)] relative transition-colors duration-500 max-h-[80vh] overflow-y-auto"
            style={{ animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--feature-bg)] text-[var(--text-main)] hover:bg-[#8b5cf6] hover:text-white transition-colors"
              onClick={() => setActiveModal(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#8b5cf6] mb-6">
              {activeModal === 'terms' ? 'Пользовательское соглашение' : 'Политика конфиденциальности'}
            </h2>
            <div className="text-[var(--text-main)] text-sm leading-relaxed whitespace-pre-wrap">
              {activeModal === 'terms' ? data.legal.terms : data.legal.privacy}
            </div>
            <div className="mt-8 text-center">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-8 py-3 bg-[#8b5cf6] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8b5cf6]/30 transition-all"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Центрирование контента */}
      <div className="flex-grow flex items-center justify-center py-10 mt-[60px]">
        
        {/* Главный прямоугольный контейнер */}
        <div className="w-[90%] max-w-[650px] bg-[var(--container-bg)] border border-[var(--border-color)] rounded-3xl p-10 text-center relative z-10 shadow-[0_20px_50px_var(--shadow-color)] transition-colors duration-500">
          
          {/* Логотип с отблеском курсора */}
          {data.logo && (
            <div
              ref={logoRef}
              className="w-[100px] h-[100px] mx-auto mb-5 rounded-[20px] bg-[var(--feature-bg)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-colors duration-500 relative cursor-pointer"
              style={{ animation: 'customLogoFloat 4s ease-in-out infinite' }}
              onMouseMove={(e) => {
                const rect = logoRef.current!.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setLogoSpot({ x, y, visible: true });
              }}
              onMouseLeave={() => setLogoSpot(s => ({ ...s, visible: false }))}
            >
              <img src={`/${data.logo}`} alt="Logo" className="w-full h-full object-contain relative z-[1]" />
              {/* Отблеск */}
              <div
                className="absolute inset-0 z-[2] rounded-[20px] pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: logoSpot.visible ? 1 : 0,
                  background: `radial-gradient(circle at ${logoSpot.x}% ${logoSpot.y}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`,
                }}
              />
            </div>
          )}

          {/* Название */}
          <h1 className="text-5xl font-black text-[#8b5cf6] mb-[30px] tracking-tight">{data.server_name}</h1>

          {/* Вкладки */}
          <div className="bg-[var(--tab-bg)] rounded-xl flex p-[5px] mb-[30px] relative transition-colors duration-500">
            <div 
              className="absolute top-[5px] bottom-[5px] left-[5px] bg-[var(--tab-active-bg)] rounded-lg shadow-[0_2px_10px_var(--shadow-color)] transition-transform duration-300 z-[1]"
              style={{ width: 'calc((100% - 10px) / 3)', transform: `translateX(calc(${activeTab} * 100%))` }}
            ></div>
            <button onClick={() => setActiveTab(0)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors duration-300 relative z-[2] ${activeTab === 0 ? 'text-[var(--tab-active-text)]' : 'text-[var(--tab-text)]'}`}>Основное</button>
            <button onClick={() => setActiveTab(1)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors duration-300 relative z-[2] ${activeTab === 1 ? 'text-[var(--tab-active-text)]' : 'text-[var(--tab-text)]'}`}>Обзор сервера</button>
            <button onClick={() => setActiveTab(2)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors duration-300 relative z-[2] ${activeTab === 2 ? 'text-[var(--tab-active-text)]' : 'text-[var(--tab-text)]'}`}>Правила</button>
          </div>

          {/* Контент вкладок */}
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            {/* Вкладка 1: Главная */}
            {activeTab === 0 && (
              <>
                <p className="leading-relaxed mb-5 text-[0.95rem]">
                  {data.about_us.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
                <p className="font-bold text-[var(--text-title)] mb-[25px] text-[1.1rem]">Подавай заявку в Discord и присоединяйся к нам!</p>
                
                <div className="flex justify-center gap-[15px] flex-wrap">
                  <a href={data.discord_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[10px] py-[14px] px-[24px] rounded-xl text-white font-bold no-underline transition-transform hover:-translate-y-0.5 hover:brightness-110 text-[1rem] bg-[#5865F2]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a19.7363 19.7363 0 00-4.8852 1.515C.5334 9.0458-.319 13.5799.0992 18.0578c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923.1258-.0943.2517-.1923.3718-.2914 3.9278 1.7933 8.18 1.7933 12.0614 0 .1202.099.246.1981.3728.2924-1.873.8914-1.873.8914-1.873.8914c.3604.698.7719 1.3628 1.225 1.9932 1.961-.6067 3.9495-1.5219 6.0023-3.0294.5004-5.177-.8382-9.6739-3.5485-13.6604zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg> 
                    Сервер Discord
                  </a>
                  <a href={data.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[10px] py-[14px] px-[24px] rounded-xl text-white font-bold no-underline transition-transform hover:-translate-y-0.5 hover:brightness-110 text-[1rem] bg-[#10b981]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> 
                    Онлайн карта
                  </a>
                </div>
              </>
            )}

            {/* Вкладка 2: Обзор */}
            {activeTab === 1 && (
              <div className="space-y-3">
                {data.features.map((f, idx) => (
                  f.images && f.images.length > 0 ? (
                    /* Карточка С картинками */
                    <div key={idx} className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--feature-bg)] transition-colors duration-500">
                      {/* Изображения */}
                      <div className={`flex gap-0 ${f.images.length > 1 ? 'divide-x divide-[var(--border-color)]' : ''}`}>
                        {f.images.map((img, i) => (
                          <div key={i} className="flex-1 relative" style={{ maxHeight: '130px' }}>
                            <img
                              src={`/${img}`}
                              alt=""
                              className="w-full h-full object-contain bg-black/40"
                              style={{ maxHeight: '130px' }}
                            />
                          </div>
                        ))}
                      </div>
                      {/* Текст */}
                      <div className="px-4 py-3 text-left">
                        <div className="font-bold text-[var(--text-title)] text-[1rem] mb-1">{f.title}</div>
                        <div className="text-[0.82rem] leading-relaxed opacity-80">{f.description}</div>
                      </div>
                    </div>
                  ) : (
                    /* Карточка БЕЗ картинки — акцентная полоска слева */
                    <div key={idx} className="text-left px-4 py-3 bg-[var(--feature-bg)] rounded-xl border border-[var(--border-color)] border-l-[3px] border-l-[#8b5cf6] transition-colors duration-500 flex items-start gap-3">
                      <span className="text-2xl mt-0.5 flex-shrink-0">{f.title.split(' ')[0]}</span>
                      <div>
                        <div className="font-bold text-[var(--text-title)] text-[0.95rem] mb-1">{f.title.split(' ').slice(1).join(' ')}</div>
                        <div className="text-[0.82rem] leading-relaxed opacity-80">{f.description}</div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Вкладка 3: Правила */}
            {activeTab === 2 && (
              <>
                <p className="font-bold text-[var(--text-title)] mb-[25px] text-[1.1rem]">Краткий свод правил</p>
                <div className="text-left">
                  {data.rules.map((r, idx) => (
                    <div key={idx} className="mb-[15px]">
                      <span className="text-[#8b5cf6] font-extrabold text-[1.2rem]">{idx + 1}.</span>
                      <span className="text-[var(--text-main)] font-semibold ml-[5px]">{r.title}</span>
                      <p className="mt-[5px] ml-[20px] text-[0.85rem] leading-relaxed">{r.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="w-full text-center p-[25px] mt-auto bg-[var(--footer-bg)] border-t border-[var(--border-color)] backdrop-blur-md text-[var(--text-main)] text-[0.9rem] z-10 relative transition-colors duration-500">
        <div className="flex justify-center gap-[20px] flex-wrap mb-3">
          <button 
            onClick={() => setActiveModal('terms')} 
            className="text-[var(--text-main)] hover:text-[#8b5cf6] transition-colors font-medium cursor-pointer"
          >
            Пользовательское соглашение
          </button>
          <button 
            onClick={() => setActiveModal('privacy')} 
            className="text-[var(--text-main)] hover:text-[#8b5cf6] transition-colors font-medium cursor-pointer"
          >
            Политика конфиденциальности
          </button>
        </div>
        <p className="opacity-70">{data.copyright}</p>
      </footer>

    </div>
  );
}
