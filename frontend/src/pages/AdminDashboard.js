import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { MessageCircle, Plus, Trash2, LogOut, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ user, setUser }) {
  const [faqs, setFaqs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [faqsRes, deptsRes, facultyRes, eventsRes, locsRes, queriesRes] = await Promise.all([
        axios.get(`${API}/faqs`, { withCredentials: true }),
        axios.get(`${API}/departments`, { withCredentials: true }),
        axios.get(`${API}/faculty`, { withCredentials: true }),
        axios.get(`${API}/events`, { withCredentials: true }),
        axios.get(`${API}/locations`, { withCredentials: true }),
        axios.get(`${API}/admin/all-queries`, { withCredentials: true })
      ]);

      setFaqs(faqsRes.data);
      setDepartments(deptsRes.data);
      setFaculty(facultyRes.data);
      setEvents(eventsRes.data);
      setLocations(locsRes.data);
      setQueries(queriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.location.href = '/chat'}
              data-testid="back-to-chat-button"
              variant="outline"
              className="rounded-full font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <Button
              onClick={handleLogout}
              data-testid="admin-logout-button"
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white rounded-xl p-2 shadow-lg">
            <TabsTrigger value="faqs" data-testid="tab-faqs">FAQs</TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
            <TabsTrigger value="faculty" data-testid="tab-faculty">Faculty</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
            <TabsTrigger value="locations" data-testid="tab-locations">Locations</TabsTrigger>
            <TabsTrigger value="queries" data-testid="tab-queries">User Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="faqs">
            <FAQManager faqs={faqs} setFaqs={setFaqs} fetchAllData={fetchAllData} />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManager departments={departments} setDepartments={setDepartments} fetchAllData={fetchAllData} />
          </TabsContent>

          <TabsContent value="faculty">
            <FacultyManager faculty={faculty} setFaculty={setFaculty} fetchAllData={fetchAllData} />
          </TabsContent>

          <TabsContent value="events">
            <EventManager events={events} setEvents={setEvents} fetchAllData={fetchAllData} />
          </TabsContent>

          <TabsContent value="locations">
            <LocationManager locations={locations} setLocations={setLocations} fetchAllData={fetchAllData} />
          </TabsContent>

          <TabsContent value="queries">
            <QueriesViewer queries={queries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// FAQ Manager Component
function FAQManager({ faqs, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', category: '', tags: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/faqs`, {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }, { withCredentials: true });
      toast.success('FAQ created successfully');
      setOpen(false);
      setFormData({ question: '', answer: '', category: '', tags: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create FAQ');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/faqs/${id}`, { withCredentials: true });
      toast.success('FAQ deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="faq-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">FAQs ({faqs.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-faq-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="faq-form">
              <Input
                placeholder="Question"
                data-testid="faq-question-input"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                required
              />
              <Textarea
                placeholder="Answer"
                data-testid="faq-answer-input"
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                required
                rows={4}
              />
              <Input
                placeholder="Category (e.g., Admissions, Courses)"
                data-testid="faq-category-input"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              />
              <Input
                placeholder="Tags (comma-separated)"
                data-testid="faq-tags-input"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
              <Button type="submit" data-testid="submit-faq-button" className="w-full">Create FAQ</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} data-testid={`faq-item-${faq.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 flex-1">{faq.question}</h3>
              <Button
                onClick={() => handleDelete(faq.id)}
                data-testid={`delete-faq-${faq.id}`}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{faq.category}</span>
              {faq.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Department Manager
function DepartmentManager({ departments, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', contact: '', building: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/departments`, formData, { withCredentials: true });
      toast.success('Department created');
      setOpen(false);
      setFormData({ name: '', description: '', contact: '', building: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create department');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/departments/${id}`, { withCredentials: true });
      toast.success('Department deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="department-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Departments ({departments.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-department-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="department-form">
              <Input placeholder="Name" data-testid="dept-name-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Textarea placeholder="Description" data-testid="dept-description-input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} />
              <Input placeholder="Contact" data-testid="dept-contact-input" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} required />
              <Input placeholder="Building" data-testid="dept-building-input" value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} required />
              <Button type="submit" data-testid="submit-department-button" className="w-full">Create Department</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} data-testid={`dept-item-${dept.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{dept.name}</h3>
              <Button onClick={() => handleDelete(dept.id)} data-testid={`delete-dept-${dept.id}`} variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{dept.description}</p>
            <p className="text-xs text-gray-500">Contact: {dept.contact}</p>
            <p className="text-xs text-gray-500">Building: {dept.building}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Faculty Manager
function FacultyManager({ faculty, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', bio: '', email: '', office: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/faculty`, formData, { withCredentials: true });
      toast.success('Faculty created');
      setOpen(false);
      setFormData({ name: '', department: '', bio: '', email: '', office: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create faculty');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/faculty/${id}`, { withCredentials: true });
      toast.success('Faculty deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete faculty');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="faculty-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Faculty ({faculty.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-faculty-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="faculty-form">
              <Input placeholder="Name" data-testid="faculty-name-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Input placeholder="Department" data-testid="faculty-dept-input" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
              <Textarea placeholder="Bio" data-testid="faculty-bio-input" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} required rows={3} />
              <Input placeholder="Email" type="email" data-testid="faculty-email-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <Input placeholder="Office" data-testid="faculty-office-input" value={formData.office} onChange={(e) => setFormData({...formData, office: e.target.value})} required />
              <Button type="submit" data-testid="submit-faculty-button" className="w-full">Create Faculty</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faculty.map((f) => (
          <div key={f.id} data-testid={`faculty-item-${f.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{f.name}</h3>
              <Button onClick={() => handleDelete(f.id)} data-testid={`delete-faculty-${f.id}`} variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-blue-600 mb-2">{f.department}</p>
            <p className="text-gray-600 text-sm mb-2">{f.bio}</p>
            <p className="text-xs text-gray-500">Email: {f.email}</p>
            <p className="text-xs text-gray-500">Office: {f.office}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Event Manager
function EventManager({ events, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', organizer: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/events`, formData, { withCredentials: true });
      toast.success('Event created');
      setOpen(false);
      setFormData({ title: '', description: '', date: '', location: '', organizer: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/events/${id}`, { withCredentials: true });
      toast.success('Event deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="event-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Events ({events.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-event-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="event-form">
              <Input placeholder="Title" data-testid="event-title-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              <Textarea placeholder="Description" data-testid="event-description-input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} />
              <Input type="date" data-testid="event-date-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              <Input placeholder="Location" data-testid="event-location-input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
              <Input placeholder="Organizer" data-testid="event-organizer-input" value={formData.organizer} onChange={(e) => setFormData({...formData, organizer: e.target.value})} required />
              <Button type="submit" data-testid="submit-event-button" className="w-full">Create Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <div key={event.id} data-testid={`event-item-${event.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <Button onClick={() => handleDelete(event.id)} data-testid={`delete-event-${event.id}`} variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{event.description}</p>
            <p className="text-xs text-gray-500">Date: {event.date}</p>
            <p className="text-xs text-gray-500">Location: {event.location}</p>
            <p className="text-xs text-gray-500">Organizer: {event.organizer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Location Manager
function LocationManager({ locations, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', building: '', description: '', floor: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/locations`, formData, { withCredentials: true });
      toast.success('Location created');
      setOpen(false);
      setFormData({ name: '', building: '', description: '', floor: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create location');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/locations/${id}`, { withCredentials: true });
      toast.success('Location deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="location-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Locations ({locations.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-location-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="location-form">
              <Input placeholder="Name" data-testid="location-name-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Input placeholder="Building" data-testid="location-building-input" value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} required />
              <Textarea placeholder="Description" data-testid="location-description-input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={2} />
              <Input placeholder="Floor" data-testid="location-floor-input" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} required />
              <Button type="submit" data-testid="submit-location-button" className="w-full">Create Location</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} data-testid={`location-item-${loc.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{loc.name}</h3>
              <Button onClick={() => handleDelete(loc.id)} data-testid={`delete-location-${loc.id}`} variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{loc.description}</p>
            <p className="text-xs text-gray-500">Building: {loc.building}</p>
            <p className="text-xs text-gray-500">Floor: {loc.floor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Queries Viewer
function QueriesViewer({ queries }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="queries-viewer">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Queries ({queries.length})</h2>
      <div className="space-y-4">
        {queries.map((query) => (
          <div key={query.id} data-testid={`query-item-${query.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500 mb-2">{new Date(query.timestamp).toLocaleString()}</p>
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-600">Query:</span>
              <p className="text-gray-900">{query.query}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-green-600">Response:</span>
              <p className="text-gray-700 text-sm">{query.response}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;