from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
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
PLUGIN_SECRET = os.environ.get("PLUGIN_SECRET", "change-this-plugin-secret")


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
    mc_uuid = Column(String, nullable=True)
    auth_ip = Column(String, nullable=True)
    zephyr_balance = Column(Integer, default=0)
    auth_code = Column(String, nullable=True)
    unlocked_slots = Column(Integer, default=3)

class VerificationCode(Base):
    __tablename__ = "verification_codes"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String, index=True)
    purpose = Column(String) # 'register', 'reset'
    expires_at = Column(DateTime)

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    slot = Column(Integer)           # 0-53 (double chest)
    item_type = Column(String)       # e.g. "minecraft:diamond"
    item_count = Column(Integer, default=1)
    item_name = Column(String)       # display name
    item_nbt = Column(String, nullable=True)  # optional NBT / extra data

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

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

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
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d0e1a; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #1a1b2e; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 32px; padding: 50px 40px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="margin-bottom: 35px;">
                    <div style="display: inline-block; padding: 12px 24px; background: rgba(139, 92, 246, 0.1); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.2);">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #8b5cf6; text-transform: uppercase;">ZEPHYRUS</h1>
                    </div>
                </div>
                
                <h2 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">{title}</h2>
                <p style="margin: 0 0 40px 0; color: #a9b1d6; font-size: 16px; line-height: 1.6;">{subtitle}</p>
                
                <div style="background: #0d0e1a; border: 2px solid #8b5cf6; border-radius: 20px; padding: 30px; margin-bottom: 40px; box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.1);">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 15px rgba(139, 92, 246, 0.5);">{code}</div>
                </div>
                
                <p style="margin: 0; color: #565f89; font-size: 13px; font-weight: 600; line-height: 1.5;">
                    Код действителен в течение 15 минут.<br>
                    Если вы не запрашивали это письмо, просто проигнорируйте его.
                </p>
                
                <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; color: #414868; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        &copy; 2026 Zephyrus Project &bull; Security System
                    </p>
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
    
    # Генерируем уникальный auth_code для привязки Minecraft-аккаунта
    import secrets
    if not user.auth_code:
        user.auth_code = secrets.token_hex(4).upper()  # e.g. '3412AA00'
    
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

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate auth_code if not exists and not linked
    if not current_user.auth_code and not current_user.mc_uuid:
        import uuid
        current_user.auth_code = str(uuid.uuid4())[:8].upper()
        db.commit()
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "zephyr_balance": current_user.zephyr_balance,
        "mc_uuid": current_user.mc_uuid,
        "auth_code": current_user.auth_code
    }

class UpdateProfile(BaseModel):
    new_username: str = None
    new_email: str = None
    current_password: str
    new_password: str = None

@app.post("/api/auth/update-profile")
def update_profile(data: UpdateProfile, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    # Update username
    if data.new_username and data.new_username != current_user.username:
        existing_user = db.query(User).filter(User.username == data.new_username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Этот никнейм уже занят")
        current_user.username = data.new_username
        
    # Update email
    if data.new_email and data.new_email != current_user.email:
        existing_email = db.query(User).filter(User.email == data.new_email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Эта почта уже используется")
        current_user.email = data.new_email
        # Note: In a production app, we'd probably require re-verification of the new email
        
    # Update password
    if data.new_password:
        if verify_password(data.new_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Новый пароль совпадает со старым")
        current_user.hashed_password = get_password_hash(data.new_password)
        
    db.commit()
    return {"message": "Профиль успешно обновлен", "username": current_user.username, "email": current_user.email}

@app.post("/api/auth/delete-account")
def delete_account(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    password = data.get("password")
    if not password or not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный пароль")
    
    # Delete inventory items first
    db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).delete()
    # Delete verification codes
    db.query(VerificationCode).filter(VerificationCode.email == current_user.email).delete()
    # Delete user
    db.delete(current_user)
    db.commit()
    return {"message": "Аккаунт успешно удален"}

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

# ─────────────────────────────────────────────────────────────────────────────
# INVENTORY HELPERS
# ─────────────────────────────────────────────────────────────────────────────

MAX_SLOTS = 54  # double chest

def next_unlock_cost(unlocked: int) -> int:
    """Cost to unlock the next batch of slots."""
    if unlocked == 0:
        return 100   # first 3 slots cost 100 zephyr
    # each slot after that costs 20 more than the previous
    return 100 + 20 * (unlocked - 2)

def next_unlock_count(unlocked: int) -> int:
    """How many slots will be unlocked next."""
    return 3 if unlocked == 0 else 1

def verify_plugin_secret(x_plugin_secret: str = None):
    from fastapi import Header
    pass

def require_plugin(x_plugin_secret: str = ""):
    if x_plugin_secret != PLUGIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid plugin secret")

# ─────────────────────────────────────────────────────────────────────────────
# INVENTORY ENDPOINTS (authenticated user)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/inventory")
def get_inventory(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    items_list = [
        {
            "slot": item.slot,
            "item_type": item.item_type,
            "item_count": item.item_count,
            "item_name": item.item_name,
            "item_nbt": item.item_nbt
        } for item in items
    ]
    unlocked = current_user.unlocked_slots
    cost = next_unlock_cost(unlocked) if unlocked < MAX_SLOTS else None
    slots_to_unlock = next_unlock_count(unlocked) if unlocked < MAX_SLOTS else 0
    return {
        "unlocked_slots": unlocked,
        "max_slots": MAX_SLOTS,
        "next_unlock_cost": cost,
        "next_unlock_count": slots_to_unlock,
        "items": items_list
    }

@app.post("/api/inventory/unlock")
def unlock_inventory_slots(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unlocked = current_user.unlocked_slots
    if unlocked >= MAX_SLOTS:
        raise HTTPException(status_code=400, detail="Инвентарь уже полностью разблокирован")
    
    cost = next_unlock_cost(unlocked)
    count = next_unlock_count(unlocked)
    
    if current_user.zephyr_balance < cost:
        raise HTTPException(status_code=400, detail=f"Недостаточно Зефирок. Нужно: {cost}, у вас: {current_user.zephyr_balance}")
    
    current_user.zephyr_balance -= cost
    current_user.unlocked_slots += count
    db.commit()
    
    return {
        "message": f"Разблокировано {count} слот(ов)!",
        "unlocked_slots": current_user.unlocked_slots,
        "zephyr_balance": current_user.zephyr_balance
    }

@app.post("/api/inventory/convert-to-diamond")
def convert_zephyr_to_diamond(
    data: dict = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """10 zephyr → 1 diamond. Tries to stack diamonds in inventory."""
    diamond_count = data.get("amount", 1)
    if diamond_count < 1: diamond_count = 1
    
    cost_per_diamond = 10
    total_cost = cost_per_diamond * diamond_count
    
    if current_user.zephyr_balance < total_cost:
        raise HTTPException(status_code=400, detail=f"Недостаточно Зефирок (нужно {total_cost})")
    
    # 1. Try to find existing diamond stacks that are not full
    existing_stacks = db.query(InventoryItem).filter(
        InventoryItem.user_id == current_user.id,
        InventoryItem.item_type == "minecraft:diamond",
        InventoryItem.item_count < 64
    ).order_by(InventoryItem.slot).all()
    
    diamonds_to_add = diamond_count
    
    for stack in existing_stacks:
        space = 64 - stack.item_count
        add = min(space, diamonds_to_add)
        stack.item_count += add
        diamonds_to_add -= add
        if diamonds_to_add <= 0: break
    
    # 2. If diamonds still remain, find free slots
    if diamonds_to_add > 0:
        unlocked = current_user.unlocked_slots
        items = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
        occupied_slots = {item.slot for item in items}
        
        while diamonds_to_add > 0:
            free_slot = None
            for s in range(unlocked):
                if s not in occupied_slots:
                    free_slot = s
                    break
            
            if free_slot is None:
                db.rollback()
                raise HTTPException(status_code=400, detail="В инвентаре нет свободных слотов! Разблокируйте больше слотов или освободите место.")
            
            add = min(64, diamonds_to_add)
            new_item = InventoryItem(
                user_id=current_user.id,
                slot=free_slot,
                item_type="minecraft:diamond",
                item_count=add,
                item_name="Алмаз"
            )
            db.add(new_item)
            occupied_slots.add(free_slot)
            diamonds_to_add -= add

    current_user.zephyr_balance -= total_cost
    db.commit()
    
    return {
        "message": f"Получено алмазов: {diamond_count}!",
        "zephyr_balance": current_user.zephyr_balance
    }

@app.post("/api/plugin/sync-inventory")
def plugin_sync_inventory(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin replaces the entire inventory state for a user (called on chest close)."""
    require_plugin(x_plugin_secret)
    mc_uuid = data.get("mc_uuid", "")
    items_data = data.get("items", []) # List of {slot, item_type, item_count, item_name, item_nbt}
    
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    if not user:
        return {"success": False, "message": "Аккаунт не найден"}
    
    # Delete all existing items for this user
    db.query(InventoryItem).filter(InventoryItem.user_id == user.id).delete()
    
    # Add new items
    for item in items_data:
        slot = item.get("slot")
        # Security: only allow saving items in unlocked slots
        if slot < 0 or slot >= user.unlocked_slots: continue
        
        new_item = InventoryItem(
            user_id=user.id,
            slot=slot,
            item_type=item.get("item_type"),
            item_count=int(item.get("item_count", 1)),
            item_name=item.get("item_name", ""),
            item_nbt=item.get("item_nbt", None)
        )
        db.add(new_item)
    
    db.commit()
    return {"success": True}

# ─────────────────────────────────────────────────────────────────────────────
# PLUGIN ENDPOINTS (authenticated by PLUGIN_SECRET header)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/plugin/sync-player")
def plugin_sync_player(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Called by plugin on PlayerJoinEvent. Updates IP and links MC UUID if username matches."""
    require_plugin(x_plugin_secret)
    mc_uuid = data.get("mc_uuid", "")
    username = data.get("username", "")
    ip = data.get("ip", "")

    if not mc_uuid or not username:
        return {"success": False, "message": "Missing UUID or username"}

    # 1. Try to find user by mc_uuid
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    
    # 2. If not found, try to find by username (first-time link)
    if not user:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.mc_uuid = mc_uuid # Link the account automatically if names match

    if user:
        user.auth_ip = ip
        db.commit()
        return {"success": true, "message": "Synced", "unlocked_slots": user.unlocked_slots}
    
    return {"success": true, "message": "User not registered on site yet"}
def plugin_verify_link(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin sends auth_code + mc_uuid to link account."""
    require_plugin(x_plugin_secret)
    auth_code = data.get("auth_code", "").upper()
    mc_uuid = data.get("mc_uuid", "")
    mc_name = data.get("mc_name", "")
    
    user = db.query(User).filter(User.auth_code == auth_code).first()
    if not user:
        return {"success": False, "message": "Неверный код привязки"}
    if user.mc_uuid:
        return {"success": False, "message": "Аккаунт уже привязан"}
    
    user.mc_uuid = mc_uuid
    db.commit()
    return {"success": True, "message": f"Аккаунт {user.username} успешно привязан к {mc_name}!"}

@app.post("/api/plugin/deposit-item")
def plugin_deposit_item(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin places an item into the user's web inventory."""
    require_plugin(x_plugin_secret)
    mc_uuid = data.get("mc_uuid", "")
    item_type = data.get("item_type", "")
    item_count = int(data.get("item_count", 1))
    item_name = data.get("item_name", item_type)
    item_nbt = data.get("item_nbt", None)
    
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    if not user:
        return {"success": False, "message": "Аккаунт не найден или не привязан"}
    
    occupied_slots = {item.slot for item in db.query(InventoryItem).filter(InventoryItem.user_id == user.id).all()}
    free_slot = None
    for s in range(user.unlocked_slots):
        if s not in occupied_slots:
            free_slot = s
            break
    
    if free_slot is None:
        return {"success": False, "message": "Инвентарь заполнен! Разблокируйте больше слотов на сайте."}
    
    inv_item = InventoryItem(
        user_id=user.id,
        slot=free_slot,
        item_type=item_type,
        item_count=item_count,
        item_name=item_name,
        item_nbt=item_nbt
    )
    db.add(inv_item)
    db.commit()
    return {"success": True, "slot": free_slot, "message": f"Предмет {item_name} x{item_count} добавлен в слот {free_slot}"}

@app.post("/api/plugin/diamond-to-zephyr")
def plugin_diamond_to_zephyr(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin converts 1 diamond from player's game inventory to 10 zephyr."""
    require_plugin(x_plugin_secret)
    mc_uuid = data.get("mc_uuid", "")
    amount = int(data.get("amount", 1))  # number of diamonds
    
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    if not user:
        return {"success": False, "message": "Аккаунт не найден или не привязан"}
    
    zephyr_earned = amount * 10
    user.zephyr_balance += zephyr_earned
    db.commit()
    return {
        "success": True,
        "message": f"+{zephyr_earned} Зефирок!",
        "new_balance": user.zephyr_balance
    }

@app.delete("/api/plugin/withdraw-item")
def plugin_withdraw_item(
    data: dict,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin takes an item from web inventory (player opens chest on server)."""
    require_plugin(x_plugin_secret)
    mc_uuid = data.get("mc_uuid", "")
    slot = int(data.get("slot", -1))
    
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    if not user:
        return {"success": False, "message": "Аккаунт не найден"}
    
    item = db.query(InventoryItem).filter(
        InventoryItem.user_id == user.id,
        InventoryItem.slot == slot
    ).first()
    
    if not item:
        return {"success": False, "message": "Слот пуст"}
    
    item_data = {"item_type": item.item_type, "item_count": item.item_count, "item_name": item.item_name, "item_nbt": item.item_nbt}
    db.delete(item)
    db.commit()
    return {"success": True, "item": item_data}

@app.get("/api/plugin/inventory/{mc_uuid}")
def plugin_get_inventory(
    mc_uuid: str,
    x_plugin_secret: str = Header(""),
    db: Session = Depends(get_db)
):
    """Plugin fetches full inventory state for a player."""
    require_plugin(x_plugin_secret)
    user = db.query(User).filter(User.mc_uuid == mc_uuid).first()
    if not user:
        return {"success": False, "message": "Аккаунт не найден"}
    
    items = db.query(InventoryItem).filter(InventoryItem.user_id == user.id).all()
    return {
        "success": True,
        "unlocked_slots": user.unlocked_slots,
        "items": [
            {"slot": i.slot, "item_type": i.item_type, "item_count": i.item_count, "item_name": i.item_name, "item_nbt": i.item_nbt}
            for i in items
        ]
    }
