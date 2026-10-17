"""
Database Configuration & Session Management
Karachi WasteWatch AI
Supports SQLite for rapid local prototyping and PostgreSQL/PostGIS for production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./karachi_wastewatch.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields an active database session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Ensure database schema includes new AI columns safely."""
    from sqlalchemy import inspect, text
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "reports" in inspector.get_table_names():
                columns = [col["name"] for col in inspector.get_columns("reports")]
                cols_to_add = [
                    ("image_hash", "VARCHAR(64)"),
                    ("fraud_status", "VARCHAR(50) DEFAULT 'Authentic'"),
                    ("authenticity_score", "INTEGER DEFAULT 100"),
                    ("hazard_level", "VARCHAR(50) DEFAULT 'SAFE / LOW'"),
                    ("hazard_type", "VARCHAR(100)"),
                    ("estimated_volume_m3", "FLOAT DEFAULT 0.0"),
                    ("estimated_tonnage", "FLOAT DEFAULT 0.0"),
                    ("recommended_vehicle", "VARCHAR(150)"),
                ]
                for col_name, col_def in cols_to_add:
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_def}"))
                conn.commit()
    except Exception as e:
        print(f"Migration note: {e}")

