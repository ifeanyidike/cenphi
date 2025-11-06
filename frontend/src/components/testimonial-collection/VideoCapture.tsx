import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoStudioChoice from './VideoStudioChoice';
import VideoRecorder from './VideoRecorder';
import VideoUpload from './VideoUpload';

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
}

interface VideoCaptureProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmitSuccess: (testimonialId?: string, compressionSessionId?: string) => void;
  workspaceId: string;
  collectionId?: string;
}

type CaptureStep = 'choice' | 'record' | 'upload';

/**
 * VideoCapture - Unified video capture experience
 *
 * New flow (choice-first):
 * 1. Show beautiful choice screen (Record vs Upload)
 * 2. Based on user choice, show appropriate component
 * 3. Camera/file selection only happens AFTER user decides
 *
 * Benefits:
 * - No automatic camera initialization
 * - Clear user intent before any permissions requested
 * - Immersive, focused experience for each path
 * - Professional studio aesthetic throughout
 */
const VideoCapture: React.FC<VideoCaptureProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
  workspaceId,
  collectionId,
}) => {
  const [step, setStep] = useState<CaptureStep>('choice');

  const handleChoice = (choice: 'record' | 'upload') => {
    setStep(choice);
  };

  const handleBack = () => {
    setStep('choice');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <VideoStudioChoice onChoose={handleChoice} />
          </motion.div>
        )}

        {step === 'record' && (
          <motion.div
            key="record"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <VideoRecorder
              formData={formData}
              setFormData={setFormData}
              onSubmitSuccess={onSubmitSuccess}
              onBack={handleBack}
              workspaceId={workspaceId}
              collectionId={collectionId}
            />
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <VideoUpload
              formData={formData}
              setFormData={setFormData}
              onSubmitSuccess={onSubmitSuccess}
              onBack={handleBack}
              workspaceId={workspaceId}
              collectionId={collectionId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoCapture;
