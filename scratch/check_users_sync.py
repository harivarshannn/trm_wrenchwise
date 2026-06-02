import os
import psycopg2
from app.utils.config import load_env

def main():
    load_env()
    # Extract connection credentials from the public URL
    db_url = "postgresql://trm_wrenchwise_db_user:nNfPoxZoPZvg628eQBeAZSL6fm3PDnLv@dpg-d8ba2ddckfvc73cr065g-a.oregon-postgres.render.com/trm_wrenchwise_db?sslmode=require"
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("SELECT username, role, is_active FROM users;")
        rows = cur.fetchall()
        print("\n--- REGISTERED SYSTEM ACCOUNTS ---")
        for row in rows:
            print(f"Username: {row[0]} | Role: {row[1]} | Active: {row[2]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database query failed: {str(e)}")

if __name__ == "__main__":
    main()
