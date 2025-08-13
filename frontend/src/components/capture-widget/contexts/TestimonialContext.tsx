// src/components/capture-widget/contexts/TestimonialContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  Dispatch,
} from "react";
import {
  TestimonialWidgetConfig,
  defaultConfig,
  AuthorInfo,
  MediaType,
  TestimonialStep,
  CameraOrientation,
} from "../types";

// State interface
interface TestimonialState {
  config: TestimonialWidgetConfig;
  currentStep: TestimonialStep;
  isModalOpen: boolean;
  authorInfo: AuthorInfo;
  mediaType: MediaType;
  userCameraChoice: CameraOrientation;
  recordedChunks: Blob[];
  isRecording: boolean;
  recordingTime: number;
  uploadedMediaFile: File | null;
  uploadedImageFile: File | null;
  transcriptText: string;
  suggestedQuestions: string[];
  currentQuestionIndex: number;
  isSubmitting: boolean;
  error: string | null;
}

// Initial state
const initialState: TestimonialState = {
  config: defaultConfig,
  currentStep: TestimonialStep.Info,
  isModalOpen: false,
  authorInfo: {
    name: "",
    email: "",
    company: "",
    position: "",
    consent: false,
  },
  mediaType: "video",
  userCameraChoice: "portrait",
  recordedChunks: [],
  isRecording: false,
  recordingTime: 0,
  uploadedMediaFile: null,
  uploadedImageFile: null,
  transcriptText: "",
  suggestedQuestions: [
    "What problem were you trying to solve?",
    "Why did you choose our solution?",
    "What results have you seen?",
    "Would you recommend our solution to others?",
  ],
  currentQuestionIndex: 0,
  isSubmitting: false,
  error: null,
};

// Action types
type ActionType =
  | { type: "SET_CONFIG"; payload: Partial<TestimonialWidgetConfig> }
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_STEP"; payload: TestimonialStep }
  | { type: "SET_AUTHOR_INFO"; payload: Partial<AuthorInfo> }
  | { type: "SET_MEDIA_TYPE"; payload: MediaType }
  | { type: "SET_CAMERA_CHOICE"; payload: CameraOrientation }
  | { type: "SET_RECORDED_CHUNKS"; payload: Blob[] }
  | { type: "ADD_RECORDED_CHUNK"; payload: Blob }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "INCREMENT_RECORDING_TIME" }
  | { type: "RESET_RECORDING_TIME" }
  | { type: "SET_UPLOADED_MEDIA"; payload: File | null }
  | { type: "SET_UPLOADED_IMAGE"; payload: File | null }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "SET_SUGGESTED_QUESTIONS"; payload: string[] }
  | { type: "ADD_SUGGESTED_QUESTION"; payload: string }
  | { type: "SET_CURRENT_QUESTION_INDEX"; payload: number }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_STATE" };

// Reducer function
const testimonialReducer = (
  state: TestimonialState,
  action: ActionType
): TestimonialState => {
  switch (action.type) {
    case "SET_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    case "OPEN_MODAL":
      return {
        ...state,
        isModalOpen: true,
      };
    case "CLOSE_MODAL":
      return {
        ...state,
        isModalOpen: false,
      };
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };
    case "SET_AUTHOR_INFO":
      return {
        ...state,
        authorInfo: { ...state.authorInfo, ...action.payload },
      };
    case "SET_MEDIA_TYPE":
      return {
        ...state,
        mediaType: action.payload,
      };
    case "SET_CAMERA_CHOICE":
      return {
        ...state,
        userCameraChoice: action.payload,
      };
    case "SET_RECORDED_CHUNKS":
      return {
        ...state,
        recordedChunks: action.payload,
      };
    case "ADD_RECORDED_CHUNK":
      return {
        ...state,
        recordedChunks: [...state.recordedChunks, action.payload],
      };
    case "START_RECORDING":
      return {
        ...state,
        isRecording: true,
      };
    case "STOP_RECORDING":
      return {
        ...state,
        isRecording: false,
      };
    case "INCREMENT_RECORDING_TIME":
      return {
        ...state,
        recordingTime: state.recordingTime + 1,
      };
    case "RESET_RECORDING_TIME":
      return {
        ...state,
        recordingTime: 0,
      };
    case "SET_UPLOADED_MEDIA":
      return {
        ...state,
        uploadedMediaFile: action.payload,
      };
    case "SET_UPLOADED_IMAGE":
      return {
        ...state,
        uploadedImageFile: action.payload,
      };
    case "SET_TRANSCRIPT":
      return {
        ...state,
        transcriptText: action.payload,
      };
    case "SET_SUGGESTED_QUESTIONS":
      return {
        ...state,
        suggestedQuestions: action.payload,
      };
    case "ADD_SUGGESTED_QUESTION":
      if (state.suggestedQuestions.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        suggestedQuestions: [...state.suggestedQuestions, action.payload],
      };
    case "SET_CURRENT_QUESTION_INDEX":
      return {
        ...state,
        currentQuestionIndex: action.payload,
      };
    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "RESET_STATE":
      return {
        ...initialState,
        config: state.config, // Keep the configuration
      };
    default:
      return state;
  }
};

// Context interface
interface TestimonialContextType {
  state: TestimonialState;
  dispatch: Dispatch<ActionType>;
}

// Create context
const TestimonialContext = createContext<TestimonialContextType | undefined>(
  undefined
);

// Context provider props
interface TestimonialProviderProps {
  children: ReactNode;
  config?: Partial<TestimonialWidgetConfig>;
}

// Provider component
export const TestimonialProvider: React.FC<TestimonialProviderProps> = ({
  children,
  config = {},
}) => {
  const [state, dispatch] = useReducer(testimonialReducer, {
    ...initialState,
    config: { ...initialState.config, ...config },
  });

  return (
    <TestimonialContext.Provider value={{ state, dispatch }}>
      {children}
    </TestimonialContext.Provider>
  );
};

// Custom hook to use the testimonial context
export const useTestimonial = (): TestimonialContextType => {
  const context = useContext(TestimonialContext);
  if (context === undefined) {
    throw new Error("useTestimonial must be used within a TestimonialProvider");
  }
  return context;
};
