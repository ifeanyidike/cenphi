import React from 'react';
import { Cloud, Zap, Shield, ArrowRight, Star } from 'lucide-react';
import GoogleDriveFileBrowser from '@/components/dashboard-landing/GoogleDriveFileBrowser';

const GoogleDrivePage: React.FC = () => {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Cloud className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Google Drive Integration</h1>
              <p className="text-gray-600 mt-1">Access and manage your Google Drive files directly from Cenphi</p>
            </div>
          </div>
          <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            <Star className="w-3 h-3 mr-1" />
            Premium Integration
          </div>
        </div>
      </div>
      
      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-gray-600 text-sm">Instant file access and seamless integration with your workflow</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="bg-gradient-to-r from-green-500 to-green-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
          <p className="text-gray-600 text-sm">Enterprise-grade security with end-to-end encryption</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Import</h3>
          <p className="text-gray-600 text-sm">Intelligent file processing and automatic organization</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <GoogleDriveFileBrowser />
      </div>
    </div>
  );
};

export default GoogleDrivePage;
