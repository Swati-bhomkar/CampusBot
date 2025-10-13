import React from 'react';
import { Button } from '../components/ui/button';
import { MessageCircle, BookOpen, Users, Calendar, MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function LandingPage() {
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/chat`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">CampusBot</span>
        </div>
        <Button 
          onClick={handleLogin}
          data-testid="login-button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105"
        >
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI-Powered <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Campus Assistant</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Get instant answers about campus facilities, departments, faculty, events, and locations. Available 24/7 to help you navigate campus life.
          </p>
          <Button 
            onClick={handleLogin}
            data-testid="get-started-button"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<BookOpen className="w-8 h-8" />}
            title="FAQs & Info"
            description="Instant answers to common questions about courses, admissions, and campus policies"
            color="from-blue-500 to-cyan-500"
          />
          <FeatureCard 
            icon={<Users className="w-8 h-8" />}
            title="Faculty Directory"
            description="Find faculty contact info, office hours, and department details"
            color="from-indigo-500 to-purple-500"
          />
          <FeatureCard 
            icon={<Calendar className="w-8 h-8" />}
            title="Campus Events"
            description="Stay updated on upcoming events, workshops, and activities"
            color="from-purple-500 to-pink-500"
          />
          <FeatureCard 
            icon={<MapPin className="w-8 h-8" />}
            title="Campus Map"
            description="Navigate campus locations, buildings, and important facilities"
            color="from-pink-500 to-rose-500"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step number="1" title="Sign In" description="Use your Google account to get started" />
          <Step number="2" title="Ask Questions" description="Type your question in natural language" />
          <Step number="3" title="Get Answers" description="Receive instant, accurate responses" />
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <p className="text-center text-gray-600">© 2025 CampusBot. Your intelligent campus companion.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default LandingPage;