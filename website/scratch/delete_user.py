from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:postgres@localhost:5432/zephyrus')
with engine.connect() as conn:
    conn.execute(text("DELETE FROM users WHERE email = 'andreyorlow65@gmail.com'"))
    conn.commit()
print("User deleted")
