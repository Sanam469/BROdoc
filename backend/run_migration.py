"""Run the auth migration against the database."""
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        user="brodoc_user",
        password="brodoc_pass",
        database="brodoc_db",
        host="localhost",
        port=5432
    )

    # Create users table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(320) NOT NULL UNIQUE,
            hashed_password VARCHAR(1024) NOT NULL,
            full_name VARCHAR(256) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    await conn.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")
    await conn.execute("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)")
    print("[OK] users table ready")

    # Check if user_id column exists on document_jobs
    val = await conn.fetchval(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='document_jobs' AND column_name='user_id'"
    )
    if not val:
        await conn.execute(
            "ALTER TABLE document_jobs "
            "ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_document_jobs_user_id ON document_jobs (user_id)")
        print("[OK] Added user_id column to document_jobs")
    else:
        print("[OK] user_id column already exists")

    print("[DONE] Migration complete!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
