import asyncio
import asyncpg
import ssl

async def main():
    # Public connection string
    dsn = "postgresql://trm_wrenchwise_db_user:nNfPoxZoPZvg628eQBeAZSL6fm3PDnLv@dpg-d8ba2ddckfvc73cr065g-a.oregon-postgres.render.com/trm_wrenchwise_db"
    
    # Configure custom SSL context that does not verify certificate authority but enforces SSL
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        conn = await asyncpg.connect(dsn, ssl=ctx)
        rows = await conn.fetch("SELECT username, role, is_active FROM users;")
        print("\n--- REGISTERED SYSTEM ACCOUNTS ---")
        for row in rows:
            print(f"Username: {row['username']} | Role: {row['role']} | Active: {row['is_active']}")
        await conn.close()
    except Exception as e:
        print(f"Direct connection query failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
