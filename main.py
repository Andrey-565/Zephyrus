from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/homepage")
def get_homepage():
    return {
        "server_name": "Zephyrus",
        "about_us": "Добро пожаловать на наш уникальный Minecraft сервер! Мы предлагаем лучший опыт игры: кастомные механики, отзывчивая администрация и регулярные ивенты. Присоединяйтесь к нашему дружному комьюнити прямо сейчас и создайте свою историю!",
        "discord_link": "https://discord.gg/x5Phd5snYu",
        "map_link": "https://map.yourserver.com",
        "logo": "logo.png",
        "review_video": {
            "link": "https://youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail": "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=800"
        },
        "features": [
            {
                "title": "Кастомные биомы",
                "description": "Исследуйте невероятные ландшафты, созданные с любовью и вниманием к деталям. Десятки новых локаций ждут своих первооткрывателей."
            },
            {
                "title": "Эпические боссы",
                "description": "Участвуйте в рейдах на могущественных боссов с уникальными механиками. Кооперируйтесь с другими игроками для победы и получения редкого лута."
            }
        ],
        "rules": [
            {
                "title": "Уважение к игрокам",
                "description": "Запрещены оскорбления, провокации, токсичное поведение и разжигание конфликтов в игровом чате."
            },
            {
                "title": "Запрет использования читов",
                "description": "Использование любых модификаций или программ, дающих нечестное преимущество над другими игроками, строго запрещено и карается перманентной блокировкой."
            },
            {
                "title": "Защита построек",
                "description": "Гриферство, воровство и разрушение чужих построек без согласия владельца запрещены. Помните о личных границах."
            },
            {
                "title": "Реклама и спам",
                "description": "Запрещено рекламировать другие проекты, сторонние ресурсы или спамить одними и теми же сообщениями в глобальный чат."
            }
        ],
        "socials": [
            {"name": "Telegram", "link": "#"},
            {"name": "VK", "link": "#"},
            {"name": "Discord", "link": "#"},
            {"name": "YouTube", "link": "#"},
            {"name": "Twitch", "link": "#"},
            {"name": "Boosty", "link": "#"}
        ],
        "copyright": "Zephyrus © 2026. Все права защищены. Not an official Minecraft product. Not approved by or associated with Mojang Synergies AB."
    }
