import React from 'react'; 
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import FeatureCard from '@/components/FeatureCard';
import { Monitor, Bell, Zap, Shield } from 'lucide-react';

interface LandingProps {
  onSignInClick: () => void;
}

const Landing: React.FC<LandingProps> = ({ onSignInClick }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSignInClick={onSignInClick} />

      {/* Hero Section */}
      <section className="relative flex-grow flex items-center py-12 px-4 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.1),transparent_50%)] -z-10" />
        
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 sm:mb-6 leading-tight">
              Stay Informed with Real-Time{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Alerts
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
              MCM Alerts is your reliable notification system for monitoring website uptime, service status, and critical system events. Get instant alerts when it matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={onSignInClick}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-slate-300 hover:border-slate-400 px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Monitoring
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to keep your systems running smoothly and your team informed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <FeatureCard
              icon={Monitor}
              title="Site Monitoring"
              description="Monitor your websites and get instant notifications when they go up or down with detailed status reports."
            />
            <FeatureCard
              icon={Bell}
              title="Real-time Alerts"
              description="Receive push notifications with customizable sound alerts for immediate awareness across all devices."
            />
            <FeatureCard
              icon={Zap}
              title="API Integration"
              description="Easy integration with external tools like Postman, webhooks, and monitoring services for custom triggers."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Reliable"
              description="Built with enterprise-grade security using modern authentication, encryption, and reliable infrastructure."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold">99.9%</div>
              <div className="text-blue-200">Uptime Reliability</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold">&lt;30s</div>
              <div className="text-blue-200">Alert Response Time</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold">24/7</div>
              <div className="text-blue-200">Continuous Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of developers and businesses who trust MCM Alerts to keep their systems monitored and their teams informed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={onSignInClick}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Monitoring Now
            </Button>
            <div className="text-sm text-muted-foreground">
              No credit card required • Free forever plan available
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img
                  src="/mcm-logo-192.png"
                  alt="MCM Alerts Logo"
                  className="h-8 w-8 rounded"
                />
                <span className="text-xl font-bold">MCM Alerts</span>
              </div>
              <p className="text-slate-300 text-sm">
                Reliable monitoring and alerting for modern applications.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Features</li>
                <li>API Documentation</li>
                <li>Integrations</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Status Page</li>
                <li>Community</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 MCM Alerts. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;