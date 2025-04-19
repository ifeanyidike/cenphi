// stores/UIStore.ts

import {
  AnalysisType,
  ContentFormat,
  ConversionType,
  EnhancementType,
  SharingPlatform,
} from "@/types/testimonial";
import { makeAutoObservable } from "mobx";

export class UIManager {
  currentView: "view" | "analyze" | "enhance" | "convert" | "share" = "view";
  activePanels: Set<string> = new Set(["info"]);
  isDarkMode: boolean = false;
  activeTestimonialType: ContentFormat = "text";
  isFullscreen: boolean = false;

  // Settings for the various tool panels
  analysisToolsExpanded: boolean = false;
  enhancementToolsExpanded: boolean = false;
  sharingToolsExpanded: boolean = false;
  conversionToolsExpanded: boolean = false;

  activeAnalysisType: AnalysisType | null = null;
  activeEnhancementType: EnhancementType | null = null;
  activeConversionType: ConversionType | null = null;
  activeSharingPlatform: SharingPlatform | null = null;
  sidebarMinimized: boolean = false;
  showShareDrawer: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setCurrentView(view: "view" | "analyze" | "enhance" | "convert" | "share") {
    this.currentView = view;
  }

  toggleSidebar(state?: boolean) {
    this.sidebarMinimized = state ?? !this.sidebarMinimized;
  }

  toggleShareDrawer(state?: boolean) {
    this.showShareDrawer = state ?? !this.showShareDrawer;
  }

  togglePanel(panel: string) {
    if (this.activePanels.has(panel)) {
      this.activePanels.delete(panel);
    } else {
      this.activePanels.add(panel);
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

  setActiveTestimonialType(type: ContentFormat) {
    this.activeTestimonialType = type;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  toggleAnalysisTools() {
    this.analysisToolsExpanded = !this.analysisToolsExpanded;
  }

  toggleEnhancementTools() {
    this.enhancementToolsExpanded = !this.enhancementToolsExpanded;
  }

  toggleSharingTools() {
    this.sharingToolsExpanded = !this.sharingToolsExpanded;
  }

  toggleConversionTools() {
    this.conversionToolsExpanded = !this.conversionToolsExpanded;
  }

  setActiveAnalysisType(type: AnalysisType | null) {
    this.activeAnalysisType = type;
  }

  setActiveEnhancementType(type: EnhancementType | null) {
    this.activeEnhancementType = type;
  }

  setActiveConversionType(type: ConversionType | null) {
    this.activeConversionType = type;
  }

  setActiveSharingPlatform(platform: SharingPlatform | null) {
    this.activeSharingPlatform = platform;
  }
}
