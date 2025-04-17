// stores/textEditorStore.ts

// types.ts

export interface TextFormatting {
  fontSize?: number;
  fontFamily?: string;
  alignment?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  letterSpacing?: number;
  textColor?: string;
  backgroundColor?: string;
}

import { Testimonial } from "@/types/testimonial";
import {
  makeObservable,
  observable,
  action,
  computed,
  runInAction,
} from "mobx";

type Alignment = "left" | "center" | "right" | "justify";
export class TextEditorManager {
  // Current testimonial reference
  currentTestimonial: Testimonial | null = null;

  // Editing state
  isEditing: boolean = false;
  editedText: string = "";

  // Formatting options
  fontSize: number = 1.25;
  fontFamily: string = "serif";
  alignment: Alignment = "left";
  lineHeight: number = 1.6;
  letterSpacing: number = 0;

  // Color options
  textColor: string = "";
  backgroundColor: string = "";

  // Analysis options
  showFormatting: boolean = false;
  showWordAnalysis: boolean = false;
  highlightedWords: string[] = [];

  // History
  textHistory: string[] = [];
  historyPosition: number = -1;

  constructor() {
    makeObservable(this, {
      currentTestimonial: observable,
      isEditing: observable,
      editedText: observable,
      fontSize: observable,
      fontFamily: observable,
      alignment: observable,
      lineHeight: observable,
      letterSpacing: observable,
      textColor: observable,
      backgroundColor: observable,
      showFormatting: observable,
      showWordAnalysis: observable,
      highlightedWords: observable,
      textHistory: observable,
      historyPosition: observable,

      hasChanges: computed,
      canUndo: computed,
      canRedo: computed,

      setTestimonial: action,
      startEditing: action,
      applyChanges: action,
      cancelEditing: action,
      updateEditedText: action,
      updateFontSize: action,
      updateFontFamily: action,
      updateAlignment: action,
      updateLineHeight: action,
      updateLetterSpacing: action,
      updateTextColor: action,
      updateBackgroundColor: action,
      toggleFormatting: action,
      toggleWordAnalysis: action,
      highlightWord: action,
      clearHighlights: action,
      highlightAllWords: action,
      addToHistory: action,
      undo: action,
      redo: action,
      resetFormatting: action,
    });
  }

  // Computed values
  get hasChanges(): boolean {
    if (!this.isEditing || !this.currentTestimonial) return false;

    const currentText = this.currentTestimonial.content;
    return this.editedText !== currentText;
  }

  get canUndo(): boolean {
    return this.historyPosition > 0;
  }

  get canRedo(): boolean {
    return this.historyPosition < this.textHistory.length - 1;
  }

  // Set the current testimonial
  setTestimonial = (testimonial: Testimonial) => {
    this.currentTestimonial = testimonial;

    // Reset store state when switching testimonials
    this.isEditing = false;
    this.editedText = "";
    this.showFormatting = false;
    this.showWordAnalysis = false;
    this.highlightedWords = [];
    this.textHistory = [];
    this.historyPosition = -1;

    // Initialize formatting from the testimonial if it has formatting metadata
    if (testimonial.custom_formatting) {
      this.fontSize =
        (testimonial.custom_formatting.fontSize as number) || 1.25;
      this.fontFamily =
        (testimonial.custom_formatting.fontFamily as string) || "serif";
      this.alignment =
        (testimonial.custom_formatting.alignment as Alignment) || "left";
      this.lineHeight =
        (testimonial.custom_formatting.lineHeight as number) || 1.6;
      this.letterSpacing =
        (testimonial.custom_formatting.letterSpacing as number) || 0;
      this.textColor =
        (testimonial.custom_formatting.textColor as string) || "";
      this.backgroundColor =
        (testimonial.custom_formatting.backgroundColor as string) || "";
    } else {
      // Default values
      this.resetFormatting();
    }
  };

  // Editing actions
  startEditing = () => {
    if (!this.currentTestimonial) return;

    const currentText = this.currentTestimonial.content || "";
    this.isEditing = true;
    this.editedText = currentText;
    this.showFormatting = false;
    this.showWordAnalysis = false;

    // Initialize history
    this.textHistory = [currentText];
    this.historyPosition = 0;
  };

  applyChanges = () => {
    if (!this.isEditing || !this.currentTestimonial) return false;

    // Update the formatting metadata
    const formatting = {
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      alignment: this.alignment,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
      textColor: this.textColor,
      backgroundColor: this.backgroundColor,
    };

    // Ensure we trigger proper reactivity in MobX by modifying observable properties
    runInAction(() => {
      if (this.currentTestimonial) {
        // Ensure formatting is updated
        this.currentTestimonial.custom_formatting = formatting;
      }
    });

    // Reset editing state
    this.isEditing = false;
    this.editedText = "";
    this.textHistory = [];
    this.historyPosition = -1;

    return true;
  };

  cancelEditing = () => {
    this.isEditing = false;
    this.editedText = "";
    this.textHistory = [];
    this.historyPosition = -1;
  };

  updateEditedText = (text: string) => {
    this.editedText = text;
    this.addToHistory(text);
  };

  // Formatting actions
  updateFontSize = (size: number) => {
    this.fontSize = Math.max(0.75, Math.min(2.5, size));
    this.applyFormattingToTestimonial();
  };

  updateFontFamily = (family: string) => {
    this.fontFamily = family;
    this.applyFormattingToTestimonial();
  };

  updateAlignment = (align: "left" | "center" | "right" | "justify") => {
    this.alignment = align;
    this.applyFormattingToTestimonial();
  };

  updateLineHeight = (height: number) => {
    this.lineHeight = Math.max(1, Math.min(3, height));
    this.applyFormattingToTestimonial();
  };

  updateLetterSpacing = (spacing: number) => {
    this.letterSpacing = Math.max(-0.05, Math.min(0.1, spacing));
    this.applyFormattingToTestimonial();
  };

  updateTextColor = (color: string) => {
    this.textColor = color;
    this.applyFormattingToTestimonial();
  };

  updateBackgroundColor = (color: string) => {
    this.backgroundColor = color;
    this.applyFormattingToTestimonial();
  };

  resetFormatting = () => {
    this.fontSize = 1.25;
    this.fontFamily = "serif";
    this.alignment = "left";
    this.lineHeight = 1.6;
    this.letterSpacing = 0;
    this.textColor = "";
    this.backgroundColor = "";
    this.applyFormattingToTestimonial();
  };

  // Apply formatting changes directly to the testimonial
  private applyFormattingToTestimonial = () => {
    if (!this.currentTestimonial) return;

    runInAction(() => {
      if (this.currentTestimonial) {
        this.currentTestimonial.custom_formatting = {
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          alignment: this.alignment,
          lineHeight: this.lineHeight,
          letterSpacing: this.letterSpacing,
          textColor: this.textColor,
          backgroundColor: this.backgroundColor,
        };
      }
    });
  };

  // Panel toggle actions
  toggleFormatting = () => {
    if (this.isEditing) return; // Don't toggle panels while editing
    this.showFormatting = !this.showFormatting;
    if (this.showFormatting) {
      this.showWordAnalysis = false;
    }
  };

  toggleWordAnalysis = () => {
    if (this.isEditing) return; // Don't toggle panels while editing
    this.showWordAnalysis = !this.showWordAnalysis;
    if (this.showWordAnalysis) {
      this.showFormatting = false;
    }
  };

  // Word highlighting actions
  highlightWord = (word: string) => {
    if (this.highlightedWords.includes(word)) {
      this.highlightedWords = this.highlightedWords.filter((w) => w !== word);
    } else {
      this.highlightedWords = [...this.highlightedWords, word];
    }
  };

  clearHighlights = () => {
    this.highlightedWords = [];
  };

  highlightAllWords = (words: string[]) => {
    this.highlightedWords = [...words];
  };

  // History management
  addToHistory = (text: string) => {
    // Only add to history if it's different from the current state
    if (
      this.historyPosition >= 0 &&
      this.textHistory[this.historyPosition] === text
    ) {
      return;
    }

    // If we're not at the end of the history, truncate
    if (this.historyPosition < this.textHistory.length - 1) {
      this.textHistory = this.textHistory.slice(0, this.historyPosition + 1);
    }

    // Add new state and update position
    this.textHistory.push(text);
    this.historyPosition = this.textHistory.length - 1;

    // Limit history size
    if (this.textHistory.length > 50) {
      this.textHistory = this.textHistory.slice(this.textHistory.length - 50);
      this.historyPosition = this.textHistory.length - 1;
    }
  };

  undo = () => {
    if (!this.canUndo) return;

    this.historyPosition--;
    this.editedText = this.textHistory[this.historyPosition];
  };

  redo = () => {
    if (!this.canRedo) return;

    this.historyPosition++;
    this.editedText = this.textHistory[this.historyPosition];
  };
}
