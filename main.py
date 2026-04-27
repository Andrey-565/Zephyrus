from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import jwt
import os
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Настройки SMTP
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")


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
    is_verified = Column(Boolean, default=False)

class VerificationCode(Base):
    __tablename__ = "verification_codes"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String, index=True)
    purpose = Column(String) # 'register', 'reset'
    expires_at = Column(DateTime)

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

class VerifyEmail(BaseModel):
    email: str
    code: str

class UserLogin(BaseModel):
    username: str
    password: str

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    email: str
    code: str
    new_password: str

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

def get_email_template(title: str, subtitle: str, code: str):
    return f"""
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; background: linear-gradient(to right, #8b5cf6, #3b82f6); -webkit-background-clip: text; color: #3b82f6;">ZEPHYRUS</h1>
                </div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">{title}</h2>
                <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px;">{subtitle}</p>
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px dashed #3b82f6; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                    <span style="font-family: monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ffffff;">{code}</span>
                </div>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Код действителен в течение 15 минут.<br>Если вы не запрашивали это письмо, просто проигнорируйте его.</p>
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155;">
                    <p style="margin: 0; color: #475569; font-size: 12px;">&copy; 2026 Zephyrus Project. Все права защищены.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def send_email(to_email: str, subject: str, html_content: str):
    print(f"\n[EMAIL SIMULATION] To: {to_email} | Subject: {subject}")
    print(f"[EMAIL CONTENT] {html_content}\n")
    
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[!] SMTP credentials missing in .env. Email was only simulated in console.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Zephyrus <{SMTP_USER}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")

@app.post("/api/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    # Allow registration if username exists but is NOT verified
    if db_user and db_user.is_verified:
        raise HTTPException(status_code=400, detail="Этот никнейм уже занят")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email and db_email.is_verified:
        raise HTTPException(status_code=400, detail="Эта почта уже используется")
        
    hashed_password = get_password_hash(user.password)
    
    if db_user and not db_user.is_verified:
        # Update unverified user with new data (maybe they changed email or password)
        db_user.hashed_password = hashed_password
        db_user.email = user.email
    elif db_email and not db_email.is_verified:
        # Update unverified user by email
        db_email.hashed_password = hashed_password
        db_email.username = user.username
    else:
        new_user = User(username=user.username, email=user.email, hashed_password=hashed_password, is_verified=False)
        db.add(new_user)
        
    # Generate code
    code = str(random.randint(100000, 999999))
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Remove old register codes for this email
    db.query(VerificationCode).filter(VerificationCode.email == user.email, VerificationCode.purpose == "register").delete()
    
    verification = VerificationCode(email=user.email, code=code, purpose="register", expires_at=expires)
    db.add(verification)
    db.commit()
    
    # Send email
    html_content = get_email_template(
        "Подтверждение регистрации",
        "Используйте этот код, чтобы завершить создание аккаунта в Zephyrus",
        code
    )
    send_email(user.email, "Код подтверждения регистрации Zephyrus", html_content)
    
    return {"message": "Код подтверждения отправлен на почту"}

@app.post("/api/auth/verify-email")
def verify_email(data: VerifyEmail, db: Session = Depends(get_db)):
    # Find code
    verification = db.query(VerificationCode).filter(
        VerificationCode.email == data.email,
        VerificationCode.code == data.code,
        VerificationCode.purpose == "register"
    ).first()
    
    if not verification or verification.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Неверный или просроченный код")
        
    # Mark user verified
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")
        
    user.is_verified = True
    db.delete(verification)
    db.commit()
    
    # Generate token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "message": "Email успешно подтвержден"}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Ищем по username или email
    db_user = db.query(User).filter((User.username == user.username) | (User.email == user.username)).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
        
    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email не подтвержден. Пожалуйста, зарегистрируйтесь снова для получения кода.")
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.is_verified == True).first()
    if not user:
        raise HTTPException(status_code=400, detail="Аккаунта с такой почтой нет или он не подтвержден. Пожалуйста, зарегистрируйтесь.")
        
    code = str(random.randint(100000, 999999))
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    db.query(VerificationCode).filter(VerificationCode.email == data.email, VerificationCode.purpose == "reset").delete()
    verification = VerificationCode(email=data.email, code=code, purpose="reset", expires_at=expires)
    db.add(verification)
    db.commit()
    
    html_content = get_email_template(
        "Сброс пароля",
        "Вы запросили смену пароля. Введите этот код для продолжения",
        code
    )
    send_email(data.email, "Восстановление пароля Zephyrus", html_content)
    return {"message": "Если такой email существует, на него отправлен код"}

@app.post("/api/auth/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    verification = db.query(VerificationCode).filter(
        VerificationCode.email == data.email,
        VerificationCode.code == data.code,
        VerificationCode.purpose == "reset"
    ).first()
    
    if not verification or verification.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Неверный или просроченный код")
        
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")
        
    # Check if new password is the same as old one
    if verify_password(data.new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Новый пароль не может совпадать со старым")
        
    user.hashed_password = get_password_hash(data.new_password)
    db.delete(verification)
    db.commit()
    
    return {"message": "Пароль успешно изменен!"}

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
