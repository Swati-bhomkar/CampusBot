import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { MessageCircle, Plus, Trash2, LogOut, ArrowLeft, Edit } from 'lucide-react';
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
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [faqsRes, deptsRes, facultyRes, eventsRes, queriesRes] = await Promise.all([
        axios.get(`${API}/faqs`, { withCredentials: true }),
        axios.get(`${API}/departments`, { withCredentials: true }),
        axios.get(`${API}/faculty`, { withCredentials: true }),
        axios.get(`${API}/events`, { withCredentials: true }),
        axios.get(`${API}/admin/all-queries`, { withCredentials: true })
      ]);

      setFaqs(faqsRes.data);
      setDepartments(deptsRes.data);
      setFaculty(facultyRes.data);
      setEvents(eventsRes.data);
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
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', category: '' });
  const [editingItem, setEditingItem] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/faqs`, {
        ...formData,
        tags: []
      }, { withCredentials: true });
      toast.success('FAQ created successfully');
      setOpen(false);
      setFormData({ question: '', answer: '', category: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create FAQ');
    }
  };

  const handleEdit = (faq) => {
    setEditingItem(faq);
    setFormData({ 
      question: faq.question, 
      answer: faq.answer, 
      category: faq.category
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/faqs/${editingItem.id}`, {
        ...formData,
        tags: editingItem.tags || []
      }, { withCredentials: true });
      toast.success('FAQ updated successfully');
      setEditOpen(false);
      setEditingItem(null);
      setFormData({ question: '', answer: '', category: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update FAQ');
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
              <Input placeholder="Question" data-testid="faq-question-input" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} required />
              <Textarea placeholder="Answer" data-testid="faq-answer-input" value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value})} required rows={4} />
              <Input placeholder="Category (e.g., Admissions, Courses)" data-testid="faq-category-input" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
              <Button type="submit" data-testid="submit-faq-button" className="w-full">Create FAQ</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit FAQ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4" data-testid="faq-edit-form">
              <Input placeholder="Question" data-testid="faq-edit-question-input" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} required />
              <Textarea placeholder="Answer" data-testid="faq-edit-answer-input" value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value})} required rows={4} />
              <Input placeholder="Category" data-testid="faq-edit-category-input" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
              <Button type="submit" data-testid="update-faq-button" className="w-full">Update FAQ</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} data-testid={`faq-item-${faq.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 flex-1">{faq.question}</h3>
              <div className="flex gap-1">
                <Button onClick={() => handleEdit(faq)} data-testid={`edit-faq-${faq.id}`} variant="ghost" size="sm" className="text-blue-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleDelete(faq.id)} data-testid={`delete-faq-${faq.id}`} variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{faq.category}</span>
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
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', contact: '', building: '' });
  const [editingItem, setEditingItem] = useState(null);

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

  const handleEdit = (dept) => {
    setEditingItem(dept);
    setFormData({ name: dept.name, description: dept.description, contact: dept.contact, building: dept.building });
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/departments/${editingItem.id}`, formData, { withCredentials: true });
      toast.success('Department updated successfully');
      setEditOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', contact: '', building: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update department');
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} />
              <Input placeholder="Contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} required />
              <Input placeholder="Building" value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} required />
              <Button type="submit" className="w-full">Update Department</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} data-testid={`dept-item-${dept.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{dept.name}</h3>
              <div className="flex gap-1">
                <Button onClick={() => handleEdit(dept)} data-testid={`edit-dept-${dept.id}`} variant="ghost" size="sm" className="text-blue-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleDelete(dept.id)} data-testid={`delete-dept-${dept.id}`} variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
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

// Faculty Manager (already has edit functionality)
function FacultyManager({ faculty, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', qualification: '', bio: '', office: '' });
  const [editingFaculty, setEditingFaculty] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/faculty`, formData, { withCredentials: true });
      toast.success('Faculty created');
      setOpen(false);
      setFormData({ name: '', role: '', qualification: '', bio: '', office: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create faculty');
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      role: faculty.role,
      qualification: faculty.qualification,
      bio: faculty.bio,
      office: faculty.office
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/faculty/${editingFaculty.id}`, formData, { withCredentials: true });
      toast.success('Faculty updated successfully');
      setEditOpen(false);
      setEditingFaculty(null);
      setFormData({ name: '', role: '', qualification: '', bio: '', office: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update faculty');
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
              <Input placeholder="Role (e.g., Principal, Professor, Assistant Professor)" data-testid="faculty-role-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required />
              <Input placeholder="Qualification (e.g., PhD, M.Tech, MBA)" data-testid="faculty-qualification-input" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} required />
              <Textarea placeholder="Bio" data-testid="faculty-bio-input" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} required rows={3} />
              <Input placeholder="Office" data-testid="faculty-office-input" value={formData.office} onChange={(e) => setFormData({...formData, office: e.target.value})} required />
              <Button type="submit" data-testid="submit-faculty-button" className="w-full">Create Faculty</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Faculty</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4" data-testid="faculty-edit-form">
              <Input placeholder="Name" data-testid="faculty-edit-name-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Input placeholder="Role (e.g., Principal, Professor, Assistant Professor)" data-testid="faculty-edit-role-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required />
              <Input placeholder="Qualification (e.g., PhD, M.Tech, MBA)" data-testid="faculty-edit-qualification-input" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} required />
              <Textarea placeholder="Bio" data-testid="faculty-edit-bio-input" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} required rows={3} />
              <Input placeholder="Office" data-testid="faculty-edit-office-input" value={formData.office} onChange={(e) => setFormData({...formData, office: e.target.value})} required />
              <Button type="submit" data-testid="update-faculty-button" className="w-full">Update Faculty</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {/* Principal/Coordinator Section */}
        {faculty.filter(f => f.role && (f.role.toLowerCase().includes('principal') || f.role.toLowerCase().includes('coordinator'))).length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-purple-700 mb-4 pb-2 border-b-2 border-purple-200">Principal / Coordinator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faculty.filter(f => f.role && (f.role.toLowerCase().includes('principal') || f.role.toLowerCase().includes('coordinator'))).map((f) => (
                <FacultyCard key={f.id} faculty={f} handleEdit={handleEdit} handleDelete={handleDelete} isPrincipal={true} />
              ))}
            </div>
          </div>
        )}

        {/* Teaching Staff Section */}
        <div>
          <h3 className="text-xl font-bold text-blue-700 mb-4 pb-2 border-b-2 border-blue-200">Teaching Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.filter(f => !f.role || (!f.role.toLowerCase().includes('principal') && !f.role.toLowerCase().includes('coordinator'))).map((f) => (
              <FacultyCard key={f.id} faculty={f} handleEdit={handleEdit} handleDelete={handleDelete} isPrincipal={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Faculty Card Component
function FacultyCard({ faculty, handleEdit, handleDelete, isPrincipal }) {
  return (
    <div 
      data-testid={`faculty-item-${faculty.id}`} 
      className={`border rounded-xl p-4 hover:shadow-md transition-all ${isPrincipal ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 ${isPrincipal ? 'bg-purple-200 text-purple-800' : 'bg-blue-100 text-blue-700'}`}>
            {faculty.role}
          </span>
        </div>
        <div className="flex gap-1">
          <Button 
            onClick={() => handleEdit(faculty)} 
            data-testid={`edit-faculty-${faculty.id}`} 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => handleDelete(faculty.id)} 
            data-testid={`delete-faculty-${faculty.id}`} 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-green-600 font-semibold mb-2">{faculty.qualification}</p>
      <p className="text-gray-600 text-sm mb-2">{faculty.bio}</p>
      <p className="text-xs text-gray-500">Office: {faculty.office}</p>
    </div>
  );
}

// Event Manager
function EventManager({ events, fetchAllData }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', organizer: '' });
  const [editingItem, setEditingItem] = useState(null);

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

  const handleEdit = (event) => {
    setEditingItem(event);
    setFormData({ title: event.title, description: event.description, date: event.date, location: event.location, organizer: event.organizer });
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/events/${editingItem.id}`, formData, { withCredentials: true });
      toast.success('Event updated successfully');
      setEditOpen(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', date: '', location: '', organizer: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update event');
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={3} />
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
              <Input placeholder="Organizer" value={formData.organizer} onChange={(e) => setFormData({...formData, organizer: e.target.value})} required />
              <Button type="submit" className="w-full">Update Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <div key={event.id} data-testid={`event-item-${event.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <div className="flex gap-1">
                <Button onClick={() => handleEdit(event)} data-testid={`edit-event-${event.id}`} variant="ghost" size="sm" className="text-blue-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleDelete(event.id)} data-testid={`delete-event-${event.id}`} variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
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
