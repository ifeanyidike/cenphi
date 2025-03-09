import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import TestimonialTypeSelection from "./TestimonialTypeSelection";
import { VideoRecorder } from "./VideoRecorder";
import { AudioRecorder } from "./AudioRecorder";
import { AIFeedback } from "./AIFeedback";
import MediaSelectionModal from "./MediaSelectionModal";
import FileUpload from "./FileUpload";
import MobileTransfer from "./MobileTransfer";
import { TestimonialType } from "./types";
import { GUIDED_PROMPTS, MAX_RECORDING_DURATION } from "./constants";
import TestimonialProgress from "./TestimonialProgress";
import TextCollection from "./TextCollection";
import ChangeRenderType from "./ChangeRenderType";
import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";

function TestimonialCollection() {
  const state = collectionStore.state;
  console.log("state", state);
  // const [state, setState] = useState<TestimonialState>({
  //   type: null,
  //   currentPromptIndex: 0,
  //   isRecording: false,
  //   isPaused: false,
  //   duration: 0,
  //   feedback: null,
  // });

  // const [showModal, setShowModal] = useState(false); # showOptionsModal
  // const [selectedOption, setSelectedOption] = useState<
  //   "record" | "upload" | "mobile" | null
  // >(null);
  // const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  // const currentPrompt = GUIDED_PROMPTS[state.currentPromptIndex];
  const progress = useMotionValue(0);
  // useEffect(() => {
  //   progress.set((state.currentPromptIndex + 1) / GUIDED_PROMPTS.length);
  // }, [state.currentPromptIndex, progress]);

  // const handleTypeSelection = (type: TestimonialType) => {
  //   if (type === "text") {
  //     setState((prev) => ({ ...prev, type }));
  //   } else {
  //     setShowModal(true);
  //     setState((prev) => ({ ...prev, type }));
  //   }
  // };

  // const handleOptionSelect = (option: "record" | "upload" | "mobile") => {
  //   setSelectedOption(option);
  //   setShowModal(false);
  // };

  // const handleNext = () => {
  //   if (state.currentPromptIndex < GUIDED_PROMPTS.length - 1) {
  //     setState((prev) => ({
  //       ...prev,
  //       currentPromptIndex: prev.currentPromptIndex + 1,
  //     }));
  //     progress.set((state.currentPromptIndex + 1) / GUIDED_PROMPTS.length);
  //   } else {
  //     //Recording complete
  //     //Submit recording and push to tank you page
  //   }
  // };

  // const handleComplete = async (data: Blob | string) => {
  //   try {
  //     const response = await fetch("/api/analyze-testimonial", {
  //       method: "POST",
  //       body: data instanceof Blob ? data : JSON.stringify({ text: data }),
  //     });

  //     const feedbackData: AIFeedbackData = await response.json();
  //     setState((prev) => ({
  //       ...prev,
  //       feedback: feedbackData,
  //     }));
  //   } catch (error) {
  //     console.error("Error analyzing testimonial:", error);
  //   }
  // };

  function renderFileUpload(type: TestimonialType | null) {
    if (type) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-screen-xl mx-auto min-h-screen md:max-h-screen flex flex-col justify-center"
        >
          <TestimonialProgress
            progress={progress}
            currentStep={state.currentPromptIndex}
            totalSteps={GUIDED_PROMPTS.length}
          />
          <FileUpload
            type={type as "video" | "audio"}
            onComplete={collectionStore.handleComplete}
            maxSize={type === "video" ? 500 * 1024 * 1024 : 100 * 1024 * 1024}
          />
          {renderChangeType()}
        </motion.div>
      );
    }
  }

  function renderMobileTransfer() {
    if (collectionStore.selectedOption === "mobile") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-screen-xl mx-auto"
        >
          <TestimonialProgress
            progress={progress}
            currentStep={state.currentPromptIndex}
            totalSteps={GUIDED_PROMPTS.length}
          />
          <MobileTransfer />
          {renderChangeType()}
        </motion.div>
      );
    }
  }

  function renderDisplayQuestion() {
    return (
      <motion.div
        key={collectionStore.currentPrompt.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="text-sm font-medium text-gray-400 mb-2">
          {collectionStore.currentPrompt.category}
        </div>
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
          {collectionStore.currentPrompt.question}
        </h2>
        <p className="text-gray-500 text-base md:text-lg">
          {collectionStore.currentPrompt.description}
        </p>
      </motion.div>
    );
  }

  function renderChangeType() {
    return (
      // <div className="flex justify-between items-center">
      //   <Button
      //     variant="outline"
      //     onClick={() => {
      //       setState((prev) => ({ ...prev, type: null }));
      //       setSelectedOption(null);
      //     }}
      //   >
      //     Change Type
      //   </Button>
      //   <Button
      //     variant="default"
      //     onClick={handleNext}
      //     disabled={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
      //   >
      //     Next Question
      //   </Button>
      // </div>
      <ChangeRenderType
        type={state.type}
        isComplete={state.currentPromptIndex === GUIDED_PROMPTS.length - 1}
        onNext={() => collectionStore.handleNext(progress)}
      />
    );
  }

  function renderVideoTestimonial() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-screen-xl mx-auto pt-8"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />

        <div className="bg-white rounded-xl shadow-lg  mt-8 p-6 mb-8">
          {renderDisplayQuestion()}
          <VideoRecorder
            onRecordingComplete={collectionStore.handleComplete}
            maxDuration={MAX_RECORDING_DURATION / (GUIDED_PROMPTS.length || 1)}
          />
        </div>

        {state.feedback && (
          <AIFeedback feedback={state.feedback} className="mb-8" />
        )}
        {renderChangeType()}
      </motion.div>
    );
  }

  function renderAudioTestimonial() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{ minHeight: "90vh" }}
        className="max-w-screen-xl mx-auto flex flex-col justify-center"
      >
        <TestimonialProgress
          progress={progress}
          currentStep={state.currentPromptIndex}
          totalSteps={GUIDED_PROMPTS.length}
        />

        <div className="bg-white rounded-xl shadow-lg p-6 mt-4 mb-8">
          {renderDisplayQuestion()}

          <AudioRecorder
            onRecordingComplete={collectionStore.handleComplete}
            maxDuration={MAX_RECORDING_DURATION / (GUIDED_PROMPTS.length || 1)}
          />
        </div>

        {renderChangeType()}
      </motion.div>
    );
  }

  function renderTextTestimonial() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-screen-xl mx-auto"
      >
        <TextCollection />

        {/* {renderChangeType()} */}
      </motion.div>
    );
  }

  const renderContent = () => {
    // if (showModal) {
    //   return;
    // }
    if (
      !state.type ||
      (state.type === "video" && !collectionStore.selectedOption) ||
      (state.type === "audio" && !collectionStore.selectedOption)
    ) {
      return <TestimonialTypeSelection />;
    }

    if (state.type !== "text" && collectionStore.selectedOption === "upload") {
      return renderFileUpload(state.type);
    }

    if (state.type !== "text" && collectionStore.selectedOption === "mobile") {
      return renderMobileTransfer();
    }

    if (state.type === "video" && !collectionStore.selectedOption) return;
    if (state.type === "audio" && !collectionStore.selectedOption) return;

    if (state.type === "video" && collectionStore.selectedOption === "record") {
      return renderVideoTestimonial();
    }
    if (state.type === "audio" && collectionStore.selectedOption === "record") {
      return renderAudioTestimonial();
    }
    if (state.type === "text") {
      return renderTextTestimonial();
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-screen-xl mx-auto px-4">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

        <MediaSelectionModal
        // isOpen={showModal}
        // onClose={() => setShowModal(false)}
        // type={state.type}
        // onOptionSelect={handleOptionSelect}
        />
      </div>
    </div>
  );
}

export default observer(TestimonialCollection);
