import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CenphiLogo from './cenphi-logo';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/home" className="ml-2 text-xl font-bold text-gray-800"><CenphiLogo/></Link>
            </div>
  
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    Features
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    Customers
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                
                <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                
                <a href="#why-senja" className="text-gray-600 hover:text-gray-900">
                  Why Cenphi
                </a>
                
                <div className="relative group">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                    Resources
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
  
              <div className="flex items-center gap-4">
                <Link to="/signin" className="text-gray-600 hover:text-gray-900 mx-2 px-4 py-2 rounded-lg">
                  Login
                </Link>
                <Link to="signup" className="bg-teal-500 hover:bg-teal-600 text-white mx-2 px-4 py-2 rounded-lg">
                  Sign up for free
                </Link>
              </div>
            </div>
  
            <button 
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
  
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-sm">
            <div className="px-4 pt-2 pb-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#customers" className="block py-2 text-gray-600 hover:text-gray-900">
                Customers
              </a>
              <a href="#pricing" className="block py-2 text-gray-600 hover:text-gray-900">
                Pricing
              </a>
              <a href="#why-senja" className="block py-2 text-gray-600 hover:text-gray-900">
                Why Senja
              </a>
              <a href="#resources" className="block py-2 text-gray-600 hover:text-gray-900">
                Resources
              </a>
              <div className="pt-4 space-y-3">
                <button className="w-full text-left py-2 text-gray-600 hover:text-gray-900">
                  Login
                </button>
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                  Sign up for free
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
};

export default Navbar;