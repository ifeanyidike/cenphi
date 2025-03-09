import { GUIDED_PROMPTS } from "@/components/collection/constants";
import { TestimonialType } from "@/components/collection/TestimonialTypeSelection";
import { TestimonialState } from "@/components/collection/types";
import { MotionValue } from "framer-motion";
import { makeAutoObservable } from "mobx";

class CollectionStore {
  state: TestimonialState = {
    type: null,
    currentPromptIndex: 0,
    isRecording: false,
    isPaused: false,
    duration: 0,
    feedback: null,
  };
  showOptionsModal = false;
  selectedOption: "record" | "upload" | "mobile" | null = null;
  sessionId = Math.random().toString(36).slice(2, 9);
  data: Blob[] | string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setType(newType: TestimonialType) {
    this.state.type = newType;
  }

  public handleTypeSelection(type: TestimonialType) {
    if (type !== "text") this.showOptionsModal = true;
    this.setType(type);
  }

  public get currentPrompt() {
    return GUIDED_PROMPTS[this.state.currentPromptIndex];
  }

  public handleOptionSelect(option: "record" | "upload" | "mobile") {
    this.selectedOption = option;
    this.showOptionsModal = false;
  }

  //   public handleCardOptionSelect (type: TestimonialType) {
  //         // containerRef.current?.scrollIntoView({ behavior: "smooth" });
  //         setSelectedType(type);
  //         if (type === "text") {
  //           setIsPreviewMode((prev) => !prev);
  //         } else {
  //           collectionStore.handleTypeSelection(type);
  //         }
  //       };

  public handleNext(progress: MotionValue<number>) {
    if (this.state.currentPromptIndex < GUIDED_PROMPTS.length - 1) {
      this.state.currentPromptIndex++;

      progress.set((this.state.currentPromptIndex + 1) / GUIDED_PROMPTS.length);
    } else {
      //Recording complete
      //Submit recording and push to tank you page
    }
  }

  public async handleComplete() {
    if (!this.data) return;
    try {
      const response = await fetch("/api/analyze-testimonial", {
        method: "POST",
        body:
          this.data instanceof Blob
            ? this.data
            : JSON.stringify({ text: this.data }),
      });
      console.log("response: ", response);
    } catch (error) {
      console.error("Error analyzing testimonial:", error);
    }
  }

  public async handleCompleteRecordingSection(blob: Blob) {
    if (typeof this.data === "string") return;

    this.data = [...(this.data || []), blob];
  }
  public changeType() {
    this.state.type = null;
    this.selectedOption = null;
  }

  get isComplete() {
    return this.state.currentPromptIndex >= GUIDED_PROMPTS.length - 1;
  }
}

export const collectionStore = new CollectionStore();
