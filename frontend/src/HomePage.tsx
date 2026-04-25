import React, { useState, useEffect } from 'react';

interface Feature {
  title: string;
  description: string;
}
interface Rule {
  title: string;
  description: string;
}
interface Social {
  name: string;
  link: string;
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
  socials: Social[];
  copyright: string;
}

export default function HomePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
  }, []);

  // Состояние загрузки (Скелетон)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2560')] bg-cover bg-center bg-fixed before:content-[''] before:absolute before:inset-0 before:bg-[#0f111a]/75 before:z-0"></div>
        <div className="w-[90%] max-w-[650px] bg-[#1a1b26] border border-white/5 rounded-3xl p-10 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-pulse">
          <div className="w-[100px] h-[100px] mx-auto mb-5 rounded-2xl bg-white/10"></div>
          <div className="h-12 w-48 bg-white/10 mx-auto rounded mb-[30px]"></div>
          <div className="h-12 w-full bg-[#24283b] rounded-xl mb-[30px]"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6 mx-auto"></div>
            <div className="h-4 bg-white/10 rounded w-4/6 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f111a] text-[#a9b1d6] flex flex-col items-center justify-center relative z-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2560')] bg-cover bg-center bg-fixed before:content-[''] before:absolute before:inset-0 before:bg-[#0f111a]/75 before:-z-10"></div>
        <p className="text-xl mb-4 relative z-10">Ошибка при загрузке данных с сервера</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#8b5cf6] text-white font-bold rounded-xl hover:brightness-110 transition-all relative z-10">
          Повторить попытку
        </button>
      </div>
    );
  }

  // Успешный рендер
  return (
    <div className="min-h-screen bg-[#0f111a] text-[#a9b1d6] flex flex-col relative overflow-x-hidden">
      {/* Стили для кастомных анимаций */}
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
      `}} />

      {/* Задний фон с затемнением */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2560')] bg-cover bg-center bg-fixed -z-20"></div>
      <div className="fixed inset-0 bg-[#0f111a]/75 -z-10"></div>

      {/* Кнопки в шапке */}
      <div className="fixed top-[25px] right-[25px] flex gap-[15px] z-[100]">
        <button className="w-[45px] h-[45px] rounded-full bg-[#1a1b26] border border-white/5 flex items-center justify-center text-[#a9b1d6] shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:scale-110 hover:text-[#8b5cf6] transition-all" aria-label="Смена темы"></button>
        <button className="w-[45px] h-[45px] rounded-full bg-[#1a1b26] border border-white/5 flex items-center justify-center text-[#a9b1d6] shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:scale-110 hover:text-[#8b5cf6] transition-all" aria-label="Личный кабинет">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>
      </div>

      {/* Центрирование контента */}
      <div className="flex-grow flex items-center justify-center py-10">
        
        {/* Главный прямоугольный контейнер */}
        <div className="w-[90%] max-w-[650px] bg-[#1a1b26] border border-white/5 rounded-3xl p-10 text-center relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          
          {/* Логотип */}
          {data.logo && (
            <div className="w-[100px] h-[100px] mx-auto mb-5 rounded-[20px] bg-black/30 border border-white/5 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.2)]" style={{ animation: 'customLogoFloat 4s ease-in-out infinite' }}>
              <img src={`/${data.logo}`} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Название */}
          <h1 className="text-5xl font-black text-[#8b5cf6] mb-[30px] tracking-tight">{data.server_name}</h1>

          {/* Вкладки */}
          <div className="bg-[#24283b] rounded-xl flex p-[5px] mb-[30px] relative">
            <div 
              className="absolute top-[5px] bottom-[5px] left-[5px] bg-white/5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-transform duration-300 z-[1]"
              style={{ width: 'calc((100% - 10px) / 3)', transform: `translateX(calc(${activeTab} * 100%))` }}
            ></div>
            <button onClick={() => setActiveTab(0)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors relative z-[2] ${activeTab === 0 ? 'text-white' : 'text-[#a9b1d6]'}`}>Основное</button>
            <button onClick={() => setActiveTab(1)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors relative z-[2] ${activeTab === 1 ? 'text-white' : 'text-[#a9b1d6]'}`}>Обзор сервера</button>
            <button onClick={() => setActiveTab(2)} className={`flex-1 py-3 bg-transparent border-none font-semibold rounded-lg cursor-pointer transition-colors relative z-[2] ${activeTab === 2 ? 'text-white' : 'text-[#a9b1d6]'}`}>Правила</button>
          </div>

          {/* Контент вкладок */}
          <div style={{ animation: 'fadeIn 0.3s' }}>
            
            {/* Вкладка 1: Главная */}
            {activeTab === 0 && (
              <>
                <p className="leading-relaxed mb-5 text-[0.95rem]">
                  {data.about_us.split('\\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
                <p className="font-bold text-white mb-[25px] text-[1.1rem]">Подавай заявку в Discord и присоединяйся к нам!</p>
                
                <div className="flex justify-center gap-[15px] flex-wrap">
                  <a href={data.discord_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[10px] py-[14px] px-[24px] rounded-xl text-white font-bold no-underline transition-transform hover:-translate-y-0.5 hover:brightness-110 text-[1rem] bg-[#5865F2]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a19.7363 19.7363 0 00-4.8852 1.515C.5334 9.0458-.319 13.5799.0992 18.0578c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923.1258-.0943.2517-.1923.3718-.2914 3.9278 1.7933 8.18 1.7933 12.0614 0 .1202.099.246.1981.3728.2924-1.873.8914-1.873.8914-1.873.8914c.3604.698.7719 1.3628 1.225 1.9932 1.961-.6067 3.9495-1.5219 6.0023-3.0294.5004-5.177-.8382-9.6739-3.5485-13.6604zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg> 
                    Сервер Discord
                  </a>
                  <a href={data.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[10px] py-[14px] px-[24px] rounded-xl text-white font-bold no-underline transition-transform hover:-translate-y-0.5 hover:brightness-110 text-[1rem] bg-[#10b981]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg> 
                    Онлайн карта
                  </a>
                </div>
              </>
            )}

            {/* Вкладка 2: Обзор */}
            {activeTab === 1 && (
              <>
                <a href={data.review_video.link} target="_blank" rel="noreferrer" className="block relative w-full rounded-xl overflow-hidden border border-white/5 mb-5 transition-transform hover:scale-[1.02]">
                  <img src={data.review_video.thumbnail} alt="Video thumbnail" className="w-full block aspect-video object-cover" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] bg-black/50 rounded-full flex items-center justify-center text-white">▶</div>
                </a>
                {data.features.map((f, idx) => (
                  <div key={idx} className="text-left mb-5 p-[15px] bg-black/20 rounded-xl border border-white/5">
                    <div className="font-bold text-white mb-[5px] text-[1.1rem]">{f.title}</div>
                    <div className="m-0 text-[0.85rem] leading-relaxed">{f.description}</div>
                  </div>
                ))}
              </>
            )}

            {/* Вкладка 3: Правила */}
            {activeTab === 2 && (
              <>
                <p className="font-bold text-white mb-[25px] text-[1.1rem]">Краткий свод правил</p>
                <div className="text-left">
                  {data.rules.map((r, idx) => (
                    <div key={idx} className="mb-[15px]">
                      <span className="text-[#8b5cf6] font-extrabold text-[1.2rem]">{idx + 1}.</span>
                      <span className="text-white font-semibold ml-[5px]">{r.title}</span>
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
      <footer className="w-full text-center p-[25px] mt-auto bg-[#0f172a]/70 border-t border-white/10 backdrop-blur-md text-[#94a3b8] text-[0.9rem] z-10 relative">
        <div className="flex justify-center gap-[15px] flex-wrap mb-3">
          {data.socials.map((soc, idx) => (
            <a key={idx} href={soc.link} className="text-[#94a3b8] hover:text-[#38bdf8] transition-colors font-semibold no-underline">
              {soc.name}
            </a>
          ))}
        </div>
        <p>{data.copyright}</p>
      </footer>

    </div>
  );
}
