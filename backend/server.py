from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Helper to remove Mongo ObjectId before returning/storing
def clean_mongo(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise RuntimeError("MONGO_URL not set in environment")

client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'campus_chatbot')]

# Create the main app without a prefix
app = FastAPI()
api_router = APIRouter(prefix="/api")

# -------------------------------
# Models
# -------------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    picture: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FAQ(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    category: str
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str
    tags: List[str] = []

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    position: str
    name: str
    contact: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    position: str
    name: str
    contact: str

class DepartmentUpdate(BaseModel):
    position: Optional[str] = None
    name: Optional[str] = None
    contact: Optional[str] = None

class Faculty(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str
    qualification: str
    bio: str
    office: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FacultyCreate(BaseModel):
    name: str
    role: str
    qualification: str
    bio: str
    office: str

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    qualification: Optional[str] = None
    bio: Optional[str] = None
    office: Optional[str] = None

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    date: str
    location: str
    organizer: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    location: str
    organizer: str

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    organizer: Optional[str] = None

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    floor: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationCreate(BaseModel):
    floor: str
    name: str

class LocationUpdate(BaseModel):
    floor: Optional[str] = None
    name: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    query: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatQuery(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# -------------------------------
# Auth helpers (with projection)
# -------------------------------
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get('session_token')
    if not session_token:
        auth_header = request.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.split(' ')[1]
    if not session_token:
        return None

    session = await db.sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None

    # check expires
    expires_at = session.get('expires_at')
    try:
        if isinstance(expires_at, str):
            expires = datetime.fromisoformat(expires_at)
        else:
            expires = expires_at
        if expires < datetime.now(timezone.utc):
            return None
    except Exception:
        return None

    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    if not user:
        return None
    return User(**user)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# -------------------------------
# Auth routes
# -------------------------------
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get('x-session-id')
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required in x-session-id header")

    # Call external auth endpoint to validate session_id and get user data
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(
                'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
                headers={'X-Session-ID': session_id}
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get session data: {str(e)}")

    # Build user dict (plain python types only)
    user_data = {
        "id": str(data.get('id')),
        "email": str(data.get('email')),
        "name": str(data.get('name', '')),
        "picture": str(data.get('picture', '')),
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Defensive check: ensure email exists
    if not user_data["email"]:
        raise HTTPException(status_code=400, detail="Auth provider returned no email")

    # Check existing user — explicitly exclude _id
    existing_user = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
    if not existing_user:
        # Insert only plain dict (no ObjectId present in user_data)
        await db.users.insert_one(user_data)
    else:
        # keep the stored record if present — ensure it's plain dict (should be, because projection excluded _id)
        user_data = existing_user

    # Create session (plain dict)
    session_token = data.get('session_token') or str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_data = {
        "session_token": session_token,
        "user_id": user_data['id'],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_data)

    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=60*60*24*7
    )

    # Return a clean JSON response (explicitly a dict, no ObjectId)
    return JSONResponse(status_code=200, content={"user": user_data, "session_token": session_token})


@api_router.get("/auth/user")
async def get_user(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# -------------------------------
# FAQ routes
# -------------------------------
@api_router.get("/faqs", response_model=List[FAQ])
async def get_faqs(category: Optional[str] = None):
    query = {"category": category} if category else {}
    faqs = await db.faqs.find(query, {"_id": 0}).to_list(1000)
    for faq in faqs:
        if isinstance(faq.get('created_at'), str):
            faq['created_at'] = datetime.fromisoformat(faq['created_at'])
        if isinstance(faq.get('updated_at'), str):
            faq['updated_at'] = datetime.fromisoformat(faq['updated_at'])
    return faqs

@api_router.post("/faqs", response_model=FAQ)
async def create_faq(faq_data: FAQCreate, request: Request):
    await require_admin(request)
    faq = FAQ(**faq_data.model_dump())
    doc = faq.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.faqs.insert_one(doc)
    return faq

@api_router.put("/faqs/{faq_id}", response_model=FAQ)
async def update_faq(faq_id: str, faq_update: FAQUpdate, request: Request):
    await require_admin(request)
    existing_faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if not existing_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    update_data = {k: v for k, v in faq_update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.faqs.update_one({"id": faq_id}, {"$set": update_data})
    updated_faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if isinstance(updated_faq['created_at'], str):
        updated_faq['created_at'] = datetime.fromisoformat(updated_faq['created_at'])
    if isinstance(updated_faq['updated_at'], str):
        updated_faq['updated_at'] = datetime.fromisoformat(updated_faq['updated_at'])
    return FAQ(**updated_faq)

@api_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, request: Request):
    await require_admin(request)
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}

# -------------------------------
# Department, Faculty, Event, Location routes
# -------------------------------
@api_router.get("/departments", response_model=List[Department])
async def get_departments():
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    for dept in departments:
        if isinstance(dept.get('created_at'), str):
            dept['created_at'] = datetime.fromisoformat(dept['created_at'])
    return departments

@api_router.post("/departments", response_model=Department)
async def create_department(dept_data: DepartmentCreate, request: Request):
    await require_admin(request)
    department = Department(**dept_data.model_dump())
    doc = department.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.departments.insert_one(doc)
    return department

@api_router.put("/departments/{dept_id}", response_model=Department)
async def update_department(dept_id: str, dept_update: DepartmentUpdate, request: Request):
    await require_admin(request)
    existing_dept = await db.departments.find_one({"id": dept_id}, {"_id": 0})
    if not existing_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    update_data = {k: v for k, v in dept_update.model_dump().items() if v is not None}
    if update_data:
        await db.departments.update_one({"id": dept_id}, {"$set": update_data})
    updated_dept = await db.departments.find_one({"id": dept_id}, {"_id": 0})
    if isinstance(updated_dept['created_at'], str):
        updated_dept['created_at'] = datetime.fromisoformat(updated_dept['created_at'])
    return Department(**updated_dept)

@api_router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, request: Request):
    await require_admin(request)
    result = await db.departments.delete_one({"id": dept_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}

@api_router.get("/faculty", response_model=List[Faculty])
async def get_faculty():
    faculty = await db.faculty.find({}, {"_id": 0}).to_list(1000)
    for f in faculty:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    def sort_key(f):
        role = f.get('role', '').lower()
        if 'principal' in role or 'coordinator' in role:
            return 0
        elif 'hod' in role or 'head' in role:
            return 1
        elif 'professor' in role:
            return 2
        else:
            return 3
    faculty.sort(key=sort_key)
    return faculty

@api_router.post("/faculty", response_model=Faculty)
async def create_faculty(faculty_data: FacultyCreate, request: Request):
    await require_admin(request)
    faculty = Faculty(**faculty_data.model_dump())
    doc = faculty.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.faculty.insert_one(doc)
    return faculty

@api_router.put("/faculty/{faculty_id}", response_model=Faculty)
async def update_faculty(faculty_id: str, faculty_update: FacultyUpdate, request: Request):
    await require_admin(request)
    existing_faculty = await db.faculty.find_one({"id": faculty_id}, {"_id": 0})
    if not existing_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    update_data = {k: v for k, v in faculty_update.model_dump().items() if v is not None}
    if update_data:
        await db.faculty.update_one({"id": faculty_id}, {"$set": update_data})
    updated_faculty = await db.faculty.find_one({"id": faculty_id}, {"_id": 0})
    if isinstance(updated_faculty['created_at'], str):
        updated_faculty['created_at'] = datetime.fromisoformat(updated_faculty['created_at'])
    return Faculty(**updated_faculty)

@api_router.delete("/faculty/{faculty_id}")
async def delete_faculty(faculty_id: str, request: Request):
    await require_admin(request)
    result = await db.faculty.delete_one({"id": faculty_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return {"message": "Faculty deleted successfully"}

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, request: Request):
    await require_admin(request)
    event = Event(**event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
    return event

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_update: EventUpdate, request: Request):
    await require_admin(request)
    existing_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not existing_event:
        raise HTTPException(status_code=404, detail="Event not found")
    update_data = {k: v for k, v in event_update.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated_event['created_at'], str):
        updated_event['created_at'] = datetime.fromisoformat(updated_event['created_at'])
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, request: Request):
    await require_admin(request)
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

@api_router.get("/locations", response_model=List[Location])
async def get_locations():
    locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    for loc in locations:
        if isinstance(loc.get('created_at'), str):
            loc['created_at'] = datetime.fromisoformat(loc['created_at'])
    return locations

@api_router.post("/locations", response_model=Location)
async def create_location(location_data: LocationCreate, request: Request):
    await require_admin(request)
    location = Location(**location_data.model_dump())
    doc = location.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.locations.insert_one(doc)
    return location

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(location_id: str, location_update: LocationUpdate, request: Request):
    await require_admin(request)
    existing_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not existing_location:
        raise HTTPException(status_code=404, detail="Location not found")
    update_data = {k: v for k, v in location_update.model_dump().items() if v is not None}
    if update_data:
        await db.locations.update_one({"id": location_id}, {"$set": update_data})
    updated_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if isinstance(updated_location['created_at'], str):
        updated_location['created_at'] = datetime.fromisoformat(updated_location['created_at'])
    return Location(**updated_location)

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, request: Request):
    await require_admin(request)
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}

# -------------------------------
# Chat (Gemini) route
# -------------------------------
@api_router.post("/chat/query", response_model=ChatResponse)
async def chat_query(query_data: ChatQuery, request: Request):
    user = await get_current_user(request)

    # Fetch relevant campus data (exclude _id)
    faqs = await db.faqs.find({}, {"_id": 0}).to_list(1000)
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    faculty = await db.faculty.find({}, {"_id": 0}).to_list(100)
    events = await db.events.find({}, {"_id": 0}).to_list(100)
    locations = await db.locations.find({}, {"_id": 0}).to_list(100)

    # Build context for the chatbot
    context = "You are a helpful campus assistant. Use the following campus information to answer the student's question:\n\n"

    if faqs:
        context += "FAQs:\n"
        for faq in faqs[:20]:
            context += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

    if departments:
        context += "\nDepartments:\n"
        for dept in departments:
            context += f"- {dept['position']}: {dept['name']} (Contact: {dept['contact']})\n"

    if faculty:
        context += "\nFaculty:\n"
        for f in faculty[:10]:
            context += f"- {f['name']} - {f['role']} (Qualification: {f['qualification']}): {f['bio']} (Office: {f['office']})\n"

    if events:
        context += "\nUpcoming Events:\n"
        for event in events[:10]:
            context += f"- {event['title']}: {event['description']} (Date: {event['date']}, Location: {event['location']})\n"

    if locations:
        context += "\nCampus Locations:\n"
        for loc in locations[:15]:
            context += f"- {loc['name']} (Floor: {loc['floor']})\n"

    session_id = query_data.session_id or str(uuid.uuid4())

    # --- Gemini API call ---
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

    if not GEMINI_API_KEY:
        response_text = "AI model not configured. Please set GEMINI_API_KEY in environment."
    else:
        prompt = context + "\n\nStudent question: " + query_data.query + "\n\nAnswer:"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        }
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                response_text = None
                if isinstance(data, dict):
                    if "candidates" in data and data["candidates"]:
                        cand = data["candidates"][0]
                        response_text = cand.get("output") or \
                                        (cand.get("content", [{}])[0].get("parts", [{}])[0].get("text") if cand.get("content") else None) or \
                                        cand.get("text")
                    elif "outputs" in data and isinstance(data["outputs"], list) and data["outputs"]:
                        response_text = str(data["outputs"][0])
                    else:
                        response_text = str(data)
                else:
                    response_text = str(data)
            except httpx.HTTPStatusError as exc:
                response_text = f"Gemini API error: {exc.response.text}"
            except Exception as exc:
                response_text = f"Failed to call Gemini: {str(exc)}"

    # Save chat history (ensure stored doc has no _id issues)
    if user:
        chat_record = {
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "query": query_data.query,
            "response": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_record)

    return ChatResponse(response=response_text, session_id=session_id)

@api_router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(request: Request):
    user = await require_auth(request)
    history = await db.chat_history.find({"user_id": user.id}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    for msg in history:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    return history

@api_router.get("/admin/all-queries", response_model=List[ChatMessage])
async def get_all_queries(request: Request):
    await require_admin(request)
    history = await db.chat_history.find({}, {"_id": 0}).sort("timestamp", -1).to_list(200)
    for msg in history:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    return history

@api_router.delete("/admin/queries/{query_id}")
async def delete_query(query_id: str, request: Request):
    await require_admin(request)
    result = await db.chat_history.delete_one({"id": query_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Query not found")
    return {"message": "Query deleted successfully"}

# Admin management
@api_router.post("/admin/make-admin/{user_id}")
async def make_admin(user_id: str, request: Request):
    await require_admin(request)
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_admin": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User is now an admin"}

# Include the router in the main app
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


