import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Shield,
  MessageSquare,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface VoiceTestimonialProps {
  onBack: () => void;
  onComplete: (testimonialId?: string) => void;
  formData: {
    name: string;
    email: string;
    company: string;
    textContent: string;
    rating: number;
  };
  workspaceId: string;
}

export interface VoiceTestimonialData {
  phoneNumber: string;
  consent: boolean;
  callTiming: 'instant' | 'scheduled';
  preferredCallTime: string;
  timezone: string;
  additionalNotes?: string;
}

const VoiceTestimonial: React.FC<VoiceTestimonialProps> = ({
  onBack,
  onComplete,
  formData,
  workspaceId,
}) => {
  const [step, setStep] = useState<'consent' | 'phone' | 'timing' | 'schedule'>('consent');
  const [voiceData, setVoiceData] = useState<VoiceTestimonialData>({
    phoneNumber: '',
    consent: false,
    callTiming: 'instant',
    preferredCallTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleConsentNext = () => {
    if (!voiceData.consent) {
      setErrors({ consent: 'Please agree to the voice call consent' });
      return;
    }
    setErrors({});
    setStep('phone');
  };

  const handlePhoneNext = () => {
    const newErrors: Record<string, string> = {};

    if (!voiceData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(voiceData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep('timing');
  };

  const handleTimingNext = () => {
    if (voiceData.callTiming === 'instant') {
      handleInstantCall();
    } else {
      setStep('schedule');
    }
  };

  const handleScheduleCall = async () => {
    if (!voiceData.preferredCallTime) {
      setErrors({ schedule: 'Please select a preferred call time' });
      return;
    }

    setIsLoading(true);
    try {
      // Call the API to schedule the voice testimonial
      await scheduleVoiceCall();
      onComplete();
    } catch (error) {
      setErrors({ schedule: 'Failed to schedule call. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantCall = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await instantVoiceCall();
      onComplete();
    } catch (error) {
      console.error('Error initiating instant voice call:', error);
      setErrors({
        instant: error instanceof Error ? error.message : 'Failed to initiate call. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleVoiceCall = async () => {
    // This will integrate with your backend API
    const response = await fetch(`${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/voice/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: voiceData.phoneNumber,
        company: formData.company,
        preferredCallTime: voiceData.preferredCallTime,
        timezone: voiceData.timezone,
        additionalNotes: voiceData.additionalNotes,
        rating: formData.rating,
        initialText: formData.textContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule voice call');
    }

    return response.json();
  };

  const instantVoiceCall = async () => {
    // Call instantly - no scheduling
    const response = await fetch(`${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/voice/instant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: voiceData.phoneNumber,
        company: formData.company,
        additionalNotes: voiceData.additionalNotes,
        rating: formData.rating,
        initialText: formData.textContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate instant voice call');
    }

    return response.json();
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const renderConsentStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Phone className="h-5 w-5 text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Voice Testimonial Call
        </h2>
        <p className="text-sm text-slate-600">
          We'll have a brief conversation about your experience
        </p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-600" />
          How it works
        </h3>
        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-slate-600">1</span>
            </div>
            <span>Our AI will call you at your preferred time</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-slate-600">2</span>
            </div>
            <span>We'll have a 5-minute guided conversation about your experience</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-slate-600">3</span>
            </div>
            <span>Your testimonial will be transcribed and processed automatically</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
          <Shield className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-slate-900 mb-1">Privacy & Recording</p>
            <p className="text-slate-700">
              Your call will be recorded and transcribed for testimonial purposes only.
              We protect your privacy and never share your information.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={voiceData.consent}
            onChange={(e) =>
              setVoiceData({ ...voiceData, consent: e.target.checked })
            }
            className="mt-1 h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
          />
          <span className="text-xs text-slate-700">
            I consent to receive a phone call and have my conversation recorded and
            transcribed for testimonial purposes. I understand this call will take
            approximately 5 minutes.
          </span>
        </label>

        {errors.consent && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.consent}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPhoneStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Phone className="h-5 w-5 text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Contact Information
        </h2>
        <p className="text-sm text-slate-600">
          We'll call this number for your testimonial
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={voiceData.phoneNumber}
            onChange={(e) =>
              setVoiceData({ ...voiceData, phoneNumber: e.target.value })
            }
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-transparent"
          />
          {errors.phoneNumber && (
            <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
              <AlertCircle className="h-3 w-3" />
              <span>{errors.phoneNumber}</span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Include country code for international numbers
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            value={voiceData.additionalNotes}
            onChange={(e) =>
              setVoiceData({ ...voiceData, additionalNotes: e.target.value })
            }
            placeholder="Any specific points you'd like to discuss or best times to reach you..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderTimingStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Phone className="h-5 w-5 text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          How would you like to receive your call?
        </h2>
        <p className="text-sm text-slate-600">
          Choose when you'd like us to call you for your testimonial
        </p>
      </div>

      <div className="space-y-3">
        <label className="relative block">
          <input
            type="radio"
            name="callTiming"
            value="instant"
            checked={voiceData.callTiming === 'instant'}
            onChange={(e) => setVoiceData({ ...voiceData, callTiming: e.target.value as 'instant' | 'scheduled' })}
            className="sr-only"
          />
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            voiceData.callTiming === 'instant'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                voiceData.callTiming === 'instant' ? 'border-slate-900' : 'border-slate-300'
              }`}>
                {voiceData.callTiming === 'instant' && (
                  <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Call Me Now</div>
                <div className="text-sm text-slate-600">Get your testimonial call within the next few minutes</div>
              </div>
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </label>

        <label className="relative block">
          <input
            type="radio"
            name="callTiming"
            value="scheduled"
            checked={voiceData.callTiming === 'scheduled'}
            onChange={(e) => setVoiceData({ ...voiceData, callTiming: e.target.value as 'instant' | 'scheduled' })}
            className="sr-only"
          />
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            voiceData.callTiming === 'scheduled'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                voiceData.callTiming === 'scheduled' ? 'border-slate-900' : 'border-slate-300'
              }`}>
                {voiceData.callTiming === 'scheduled' && (
                  <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Schedule for Later</div>
                <div className="text-sm text-slate-600">Choose a specific time that works best for you</div>
              </div>
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </label>
      </div>

      {errors.instant && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.instant}</span>
        </div>
      )}
    </motion.div>
  );

  const renderScheduleStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Calendar className="h-5 w-5 text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Schedule Your Call
        </h2>
        <p className="text-sm text-slate-600">
          When would you prefer to receive the call?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Preferred Call Time *
          </label>
          <select
            value={voiceData.preferredCallTime}
            onChange={(e) =>
              setVoiceData({ ...voiceData, preferredCallTime: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">Select a time (your local time)</option>
            {getTimeSlots().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {errors.schedule && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.schedule}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-medium text-slate-900">Call Details</span>
          </div>
          <div className="text-xs text-slate-600 space-y-0.5">
            <p><strong>Duration:</strong> ~5 minutes</p>
            <p><strong>Your timezone:</strong> {voiceData.timezone}</p>
            <p><strong>Phone:</strong> {voiceData.phoneNumber}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6">
            {step === 'consent' && renderConsentStep()}
            {step === 'phone' && renderPhoneStep()}
            {step === 'timing' && renderTimingStep()}
            {step === 'schedule' && renderScheduleStep()}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={step === 'consent' ? onBack : () => {
                  if (step === 'phone') setStep('consent');
                  if (step === 'timing') setStep('phone');
                  if (step === 'schedule') setStep('timing');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>

              <button
                onClick={
                  step === 'consent' ? handleConsentNext :
                  step === 'phone' ? handlePhoneNext :
                  step === 'timing' ? handleTimingNext :
                  handleScheduleCall
                }
                disabled={isLoading}
                className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    {step === 'timing' && voiceData.callTiming === 'instant' ? 'Starting Call...' : 'Scheduling...'}
                  </>
                ) : step === 'schedule' ? (
                  <>
                    <Check className="h-3 w-3" />
                    Schedule Call
                  </>
                ) : step === 'timing' ? (
                  voiceData.callTiming === 'instant' ? (
                    <>
                      <Phone className="h-3 w-3" />
                      Call Me Now
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceTestimonial;