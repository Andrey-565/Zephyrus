from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

# Настройки базы данных PostgreSQL (локальный сервер)
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/zephyrus"

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    print(f"Ошибка подключения к БД: {e}")

# Модель пользователя
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

# Создание таблиц (при старте)
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

# Настройки безопасности
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "zephyrus-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 дней

# Pydantic модели
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Этот никнейм уже занят")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Эта почта уже используется")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Успешная регистрация!"}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Ищем по username или email
    db_user = db.query(User).filter((User.username == user.username) | (User.email == user.username)).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
                "title": "🩸 Кровавая луна",
                "description": "Раз в несколько часов небо окрашивается кровью. Мобы становятся сильнее, быстрее и умнее. Нельзя спать и открыть сундук, пока поблизости есть монстры.",
                "images": []
            },
            {
                "title": "🪓 Топор дровосека",
                "description": "Рубит всё дерево целиком за один удар. Скрафти ядро дровосека и наложи его на незеритовый топор в наковальне.",
                "images": ["feat_axe.png", "feat_axe_recipe.jpg"]
            },
            {
                "title": "⚙️ Железо кусочками",
                "description": "При переплавке железная руда теперь выпадает кусочками. Железные големы при гибели также роняют кусочки железа.",
                "images": ["feat_iron.png"]
            },
            {
                "title": "🏛️ Дворец испытаний",
                "description": "Хранилища в дворцах испытаний теперь восстанавливаются со временем. Возвращайся снова и снова за наградой.",
                "images": ["feat_golem_nb.png"]
            },
            {
                "title": "🗺️ Ограниченный мир",
                "description": "Игровой мир ограничен территорией 15 000 × 15 000 блоков. Это сближает игроков и делает каждую встречу ценнее.",
                "images": []
            },
            {
                "title": "🍺 Кастомная еда и пивоварение",
                "description": "Новые рецепты блюд и уникальная система пивоварения. Готовь зелья и блюда с особыми эффектами, которых нет в ванильном Minecraft.",
                "images": []
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
        "legal": {
            "terms": "Добро пожаловать на наш сервер Zephyrus!\n\n1. Общие положения\nИграя на нашем сервере, вы автоматически соглашаетесь с данными правилами и условиями. Незнание правил не освобождает от ответственности.\n\n2. Игровой процесс\nАдминистрация предоставляет доступ к серверу \"как есть\". Мы стараемся обеспечивать бесперебойную работу, но не несем ответственности за возможные откаты или потерю виртуального имущества из-за технических сбоев.\n\n3. Покупки и пожертвования\nВсе покупки на нашем сайте являются добровольными пожертвованиями на развитие проекта. Средства не подлежат возврату, если услуга была оказана в полном объеме.\n\n4. Блокировки\nАдминистрация оставляет за собой право ограничить доступ к серверу любому пользователю за нарушение правил проекта без объяснения причин.\n\n5. Изменения\nДанное соглашение может быть изменено в любой момент без предварительного уведомления пользователей.",
            "privacy": "Политика конфиденциальности проекта Zephyrus\n\n1. Сбор информации\nМы собираем только ту информацию, которая необходима для функционирования вашего аккаунта: ваш никнейм Minecraft, IP-адрес (для защиты от DDoS-атак и ботов) и адрес электронной почты (если вы привязываете его для восстановления пароля).\n\n2. Использование данных\nВаши данные используются исключительно для предоставления доступа к личному кабинету, игровому серверу и обеспечения безопасности вашего аккаунта.\n\n3. Защита данных\nМы используем современные методы шифрования для защиты ваших паролей. Ваши личные данные не передаются третьим лицам ни при каких обстоятельствах, за исключением случаев, предусмотренных законодательством.\n\n4. Файлы Cookie\nНаш сайт использует файлы cookie исключительно для сохранения сессии авторизации (чтобы вам не приходилось входить в аккаунт при каждом посещении) и сохранения ваших настроек (например, выбранной темы сайта)."
        },
        "copyright": "Zephyrus © 2026. Все права защищены. Not an official Minecraft product. Not approved by or associated with Mojang Synergies AB."
    }
