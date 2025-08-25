import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, ArrowRight, ArrowLeft, Building2, User, Mail, Phone, Globe, MapPin, Clock } from 'lucide-react';
import { useGA4Integration } from '../hooks/useGA4Integration';
import { useIntegrations } from '../hooks/useIntegrations';
import { GA4IntegrationModal } from './GA4IntegrationModal';
import { GBPIntegrationModal, GSCIntegrationModal, ClarityIntegrationModal } from './IntegrationModals';
import { AuthService } from '../utils/authService';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (clientData: any) => void;
}

interface ClientFormData {
  practice_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  website_url: string;
  timezone: string;
  password: string;
  first_name: string;
  last_name: string;
}

const steps = [
  { id: 'practice', title: 'Practice Information', icon: Building2 },
  { id: 'contact', title: 'Contact Details', icon: User },
  { id: 'complete', title: 'All Set!', icon: CheckCircle }
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST/AKDT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ClientFormData>({
    practice_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    website_url: '',
    timezone: 'America/New_York',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempClientId, setTempClientId] = useState<string>('');
  
  const updateFormData = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.practice_name.trim()) newErrors.practice_name = 'Practice name is required';
      if (!formData.timezone) newErrors.timezone = 'Timezone is required';
    }

    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    setIsSubmitting(true);
    try {
      // Generate a temporary client ID for the registration process
      const clientId = crypto.randomUUID();
      setTempClientId(clientId);
      
      // Use Supabase Edge Function for registration
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          client_id: clientId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Registration successful - user should now sign in normally
        console.log('Registration successful:', data.message)
        
        setCurrentStep(steps.length - 1);
        setTimeout(() => {
          onComplete(data);
        }, 2000);
      } else {
        if (response.status === 409) {
          setErrors({ submit: 'This email is already registered. Please use a different email address or sign in instead.' });
        } else {
          setErrors({ submit: data.error || 'Registration failed' });
        }
      }
    } catch (error) {
      if (error.message.includes('already registered')) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Network error. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Dental Vital Signs</h2>
            <p className="text-gray-600">Let's get your practice set up in just a few steps</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Tell us about your practice</h3>
                <p className="text-gray-600">This helps us customize your dashboard experience</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Practice Name *
                  </label>
                  <input
                    type="text"
                    value={formData.practice_name}
                    onChange={(e) => updateFormData('practice_name', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.practice_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Riverside Dental Specialists"
                  />
                  {errors.practice_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.practice_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => updateFormData('website_url', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourpractice.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone *
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.timezone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  {errors.timezone && (
                    <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
                <p className="text-gray-600">Create your admin account and contact details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => updateFormData('first_name', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => updateFormData('last_name', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Smith"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => updateFormData('contact_person', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contact_person ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dr. John Smith, DDS"
                />
                {errors.contact_person && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@yourpractice.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => updateFormData('phone_number', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600">
                  Welcome to your Dental Vital Signs Dashboard! Your account has been created successfully.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Next Steps</h4>
                </div>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>1. Sign in with your email and password</p>
                  <p>2. Visit Settings to connect your analytics tools</p>
                  <p>3. Start tracking your practice's digital performance</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  onComplete({ redirect: '/signin' });
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep < 2 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : currentStep === 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};