import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def update_faculty():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Rename contact field to email in all faculty documents
    result = await db.faculty.update_many(
        {'contact': {'$exists': True}},
        {'$rename': {'contact': 'email'}}
    )
    print(f'✓ Updated {result.modified_count} faculty records from contact to email')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_faculty())
