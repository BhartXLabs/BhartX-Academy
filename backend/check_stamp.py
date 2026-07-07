# check_stamp.py — Safe self-healing database migration and stamping manager for Render Free Tier

import os
import sys
import subprocess
from sqlalchemy import create_engine, inspect

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[DB Manager] DATABASE_URL not set. Skipping database checks.")
        sys.exit(0)

    # Sanitize SQLite/Postgres URL scheme compatibility
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print("[DB Manager] Inspecting database tables...")
    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
    except Exception as e:
        print(f"[DB Manager] Error connecting to database: {e}")
        sys.exit(1)

    # Self-healing logic for legacy create_all() databases vs Alembic migrations
    if "users" in tables and "alembic_version" not in tables:
        print("[DB Manager] Detected legacy tables without Alembic history. Stamping database head...")
        result = subprocess.run(["alembic", "stamp", "head"])
        if result.returncode != 0:
            print("[DB Manager] Error: Failed to stamp database head revision.")
            sys.exit(1)
    else:
        print("[DB Manager] Running database migrations...")
        result = subprocess.run(["alembic", "upgrade", "head"])
        if result.returncode != 0:
            print("[DB Manager] Error: Database migration failed.")
            sys.exit(1)

    print("[DB Manager] Database is up-to-date.")

if __name__ == "__main__":
    main()
