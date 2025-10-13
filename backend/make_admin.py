import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def make_admin(email):
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Update user to admin
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    
    if result.modified_count > 0:
        print(f"✓ Successfully made {email} an admin!")
    elif result.matched_count > 0:
        print(f"ℹ {email} is already an admin")
    else:
        print(f"⚠ User with email {email} not found. Please login first, then run this script again.")
    
    client.close()

if __name__ == "__main__":
    email = "swatibhomkar18@gmail.com"
    asyncio.run(make_admin(email))
