import requests
import sys
import json
from datetime import datetime

class CampusChatbotAPITester:
    def __init__(self, base_url="https://scholar-helper-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_public_endpoints(self):
        """Test endpoints that don't require authentication"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test FAQs endpoint
        self.run_test("Get FAQs", "GET", "faqs", 200)
        
        # Test Departments endpoint
        self.run_test("Get Departments", "GET", "departments", 200)
        
        # Test Faculty endpoint
        self.run_test("Get Faculty", "GET", "faculty", 200)
        
        # Test Events endpoint
        self.run_test("Get Events", "GET", "events", 200)
        
        # Test Locations endpoint
        self.run_test("Get Locations", "GET", "locations", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication Endpoints...")
        
        # Test getting user without session (should fail)
        self.run_test("Get User (No Auth)", "GET", "auth/user", 401)
        
        # Test logout without session
        self.run_test("Logout (No Session)", "POST", "auth/logout", 200)

    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔍 Testing Protected Endpoints (Without Auth)...")
        
        # Test chat query without auth
        self.run_test("Chat Query (No Auth)", "POST", "chat/query", 200, 
                     {"query": "What departments are available?"})
        
        # Test chat history without auth (should fail)
        self.run_test("Get Chat History (No Auth)", "GET", "chat/history", 401)

    def test_admin_endpoints(self):
        """Test admin endpoints without admin privileges"""
        print("\n🔍 Testing Admin Endpoints (No Auth)...")
        
        # Test creating FAQ without admin
        faq_data = {
            "question": "Test question?",
            "answer": "Test answer",
            "category": "Test",
            "tags": ["test"]
        }
        self.run_test("Create FAQ (No Admin)", "POST", "faqs", 401, faq_data)
        
        # Test creating department without admin
        dept_data = {
            "name": "Test Department",
            "description": "Test description",
            "contact": "test@example.com",
            "building": "Test Building"
        }
        self.run_test("Create Department (No Admin)", "POST", "departments", 401, dept_data)
        
        # Test getting all queries without admin
        self.run_test("Get All Queries (No Admin)", "GET", "admin/all-queries", 401)

    def test_chat_functionality(self):
        """Test chat functionality"""
        print("\n🔍 Testing Chat Functionality...")
        
        # Test basic chat query
        chat_data = {"query": "What departments are available?"}
        response = self.run_test("Basic Chat Query", "POST", "chat/query", 200, chat_data)
        
        if response and 'response' in response:
            print(f"    Chat Response Preview: {response['response'][:100]}...")
        
        # Test chat with session_id
        chat_data_with_session = {
            "query": "Tell me about faculty",
            "session_id": "test-session-123"
        }
        self.run_test("Chat Query with Session", "POST", "chat/query", 200, chat_data_with_session)

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid endpoints
        self.run_test("Invalid Endpoint", "GET", "invalid/endpoint", 404)
        
        # Test malformed requests
        self.run_test("Malformed Chat Query", "POST", "chat/query", 422, {"invalid": "data"})

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Campus Chatbot API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_public_endpoints()
        self.test_auth_endpoints()
        self.test_protected_endpoints()
        self.test_admin_endpoints()
        self.test_chat_functionality()
        self.test_error_handling()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CampusChatbotAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())