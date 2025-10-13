import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Seeding sample campus data...")
    
    # Sample FAQs
    faqs = [
        {
            "id": str(uuid.uuid4()),
            "question": "What are the admission requirements?",
            "answer": "Admission requirements include high school transcripts, SAT/ACT scores, letters of recommendation, and a personal statement. Minimum GPA requirement is 3.0.",
            "category": "Admissions",
            "tags": ["admissions", "requirements", "application"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "When is the application deadline?",
            "answer": "Regular admission deadline is January 15th. Early action deadline is November 1st. Rolling admissions available for certain programs.",
            "category": "Admissions",
            "tags": ["deadline", "application", "dates"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "How do I register for classes?",
            "answer": "Class registration is done through the student portal. Log in with your student ID, select your desired courses, and confirm your schedule. Priority registration is based on credit hours.",
            "category": "Academic",
            "tags": ["registration", "classes", "courses"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Where is the library located?",
            "answer": "The main library is located in the Academic Building on the 2nd floor. Open Monday-Friday 8am-10pm, Saturday-Sunday 10am-8pm.",
            "category": "Campus",
            "tags": ["library", "location", "hours"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "How do I apply for financial aid?",
            "answer": "Complete the FAFSA form online. Priority deadline is March 1st. Contact the Financial Aid office for scholarship opportunities and payment plans.",
            "category": "Financial",
            "tags": ["financial aid", "fafsa", "scholarships"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "What dining options are available on campus?",
            "answer": "Campus has 3 dining halls, 2 cafes, and a food court. Meal plans are available for purchase. Hours vary by location, typically 7am-9pm.",
            "category": "Campus Life",
            "tags": ["dining", "food", "meal plans"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "Is campus housing available?",
            "answer": "Yes, on-campus housing is available for all students. Residence halls offer single and double rooms. Housing applications open in March.",
            "category": "Housing",
            "tags": ["housing", "dormitory", "residence"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "question": "How do I get parking permit?",
            "answer": "Parking permits can be purchased online through the Campus Safety portal. Student permits are $200/semester. Visitor parking available at hourly rates.",
            "category": "Campus Services",
            "tags": ["parking", "permit", "transportation"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Departments
    departments = [
        {
            "id": str(uuid.uuid4()),
            "name": "Computer Science",
            "description": "Leading programs in software engineering, AI, cybersecurity, and data science",
            "contact": "cs@campus.edu | (555) 123-4567",
            "building": "Engineering Building, 3rd Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Business Administration",
            "description": "Programs in management, finance, marketing, and entrepreneurship",
            "contact": "business@campus.edu | (555) 234-5678",
            "building": "Business Hall, 2nd Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Engineering",
            "description": "Mechanical, electrical, civil, and chemical engineering programs",
            "contact": "engineering@campus.edu | (555) 345-6789",
            "building": "Engineering Building, 1st Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Arts & Humanities",
            "description": "Programs in literature, history, philosophy, and creative arts",
            "contact": "arts@campus.edu | (555) 456-7890",
            "building": "Liberal Arts Building, 4th Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Faculty
    faculty = [
        {
            "id": str(uuid.uuid4()),
            "name": "Dr. Rajesh Kumar",
            "role": "Principal",
            "department": "Administration",
            "bio": "PhD in Educational Leadership. 25+ years of experience in academic administration and institution building.",
            "email": "principal@campus.edu",
            "office": "Administration Building, Room 101",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dr. Sarah Johnson",
            "role": "Professor & HOD",
            "department": "Computer Science",
            "bio": "PhD in Artificial Intelligence. Research focus on machine learning and neural networks.",
            "email": "s.johnson@campus.edu",
            "office": "Engineering Building, Room 301",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Prof. Michael Chen",
            "role": "Associate Professor",
            "department": "Business Administration",
            "bio": "MBA, CPA. 15 years experience in corporate finance and accounting.",
            "email": "m.chen@campus.edu",
            "office": "Business Hall, Room 205",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dr. Emily Rodriguez",
            "role": "Assistant Professor",
            "department": "Engineering",
            "bio": "PhD in Mechanical Engineering. Specializes in renewable energy systems.",
            "email": "e.rodriguez@campus.edu",
            "office": "Engineering Building, Room 115",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Prof. David Williams",
            "role": "Professor",
            "department": "Arts & Humanities",
            "bio": "PhD in Literature. Published author and poetry expert.",
            "email": "d.williams@campus.edu",
            "office": "Liberal Arts Building, Room 402",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Events
    events = [
        {
            "id": str(uuid.uuid4()),
            "title": "Career Fair 2025",
            "description": "Meet with top employers from tech, finance, and engineering industries. Bring your resume!",
            "date": "2025-03-15",
            "location": "Student Center, Main Hall",
            "organizer": "Career Services",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Spring Research Symposium",
            "description": "Student research presentations across all disciplines. Open to public.",
            "date": "2025-04-20",
            "location": "Academic Building, Auditorium",
            "organizer": "Graduate School",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Tech Workshop: AI & Machine Learning",
            "description": "Hands-on workshop on building ML models. All levels welcome.",
            "date": "2025-03-10",
            "location": "Engineering Building, Lab 305",
            "organizer": "CS Department",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Spring Festival",
            "description": "Food trucks, live music, games, and activities. Free for all students!",
            "date": "2025-04-05",
            "location": "Campus Green",
            "organizer": "Student Activities",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Locations
    locations = [
        {
            "id": str(uuid.uuid4()),
            "name": "Main Library",
            "building": "Academic Building",
            "description": "Study spaces, computer labs, research resources, quiet zones",
            "floor": "2nd Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Student Center",
            "building": "Student Center",
            "description": "Dining hall, student lounge, meeting rooms, recreation area",
            "floor": "Ground Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Computer Lab A",
            "building": "Engineering Building",
            "description": "High-performance computers, software development tools, 24/7 access",
            "floor": "3rd Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Admissions Office",
            "building": "Administration Building",
            "description": "Admissions counseling, application help, campus tours",
            "floor": "1st Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Fitness Center",
            "building": "Recreation Center",
            "description": "Cardio equipment, weights, basketball court, swimming pool",
            "floor": "All Floors",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Financial Aid Office",
            "building": "Administration Building",
            "description": "Financial aid counseling, scholarship information, payment plans",
            "floor": "2nd Floor",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Clear existing data
    await db.faqs.delete_many({})
    await db.departments.delete_many({})
    await db.faculty.delete_many({})
    await db.events.delete_many({})
    await db.locations.delete_many({})
    
    # Insert new data
    await db.faqs.insert_many(faqs)
    await db.departments.insert_many(departments)
    await db.faculty.insert_many(faculty)
    await db.events.insert_many(events)
    await db.locations.insert_many(locations)
    
    print(f"✓ Seeded {len(faqs)} FAQs")
    print(f"✓ Seeded {len(departments)} Departments")
    print(f"✓ Seeded {len(faculty)} Faculty members")
    print(f"✓ Seeded {len(events)} Events")
    print(f"✓ Seeded {len(locations)} Locations")
    print("\nSample data seeded successfully!")
    print("\nNote: Faculty includes Principal and teaching staff with roles")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
