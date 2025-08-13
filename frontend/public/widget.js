// premium-testimonial-widget.js
(function () {
  // Configuration
  const config = {
    apiBaseUrl:
      window.testimonialWidgetConfig?.apiBaseUrl || "https://cenphi.io",
    websocketBaseUrl:
      window.testimonialWidgetConfig?.websocketBaseUrl || "wss://cenphi.io",
    campaignId: window.testimonialWidgetConfig?.campaignId,
    primaryColor: window.testimonialWidgetConfig?.primaryColor || "#4F46E5",
    secondaryColor: window.testimonialWidgetConfig?.secondaryColor || "#8B5CF6",
    buttonText:
      window.testimonialWidgetConfig?.buttonText || "Share Your Story",
    companyName: window.testimonialWidgetConfig?.companyName || "Cenphi",
    companyLogo: window.testimonialWidgetConfig?.companyLogo || null,
    position: window.testimonialWidgetConfig?.position || "bottom-right",
    showTranscription:
      window.testimonialWidgetConfig?.showTranscription !== false,
    maxDuration: window.testimonialWidgetConfig?.maxDuration || 60,
    darkMode: window.testimonialWidgetConfig?.darkMode || false,
    chunkInterval: window.testimonialWidgetConfig?.chunkInterval || 250, // ms
    showAIHints: window.testimonialWidgetConfig?.showAIHints !== false,
    brandMode: window.testimonialWidgetConfig?.brandMode || "gradient", // gradient, solid, minimal
    dialogScale: window.testimonialWidgetConfig?.dialogScale || 1, // Scale factor for dialog size
    roundedCorners: window.testimonialWidgetConfig?.roundedCorners || "rounded", // sharp, rounded, pill
  };

  // Validate configuration
  if (!config.campaignId) {
    console.error("Testimonial Widget Error: campaignId is required");
    return;
  }

  // State management
  let currentStep = 0;
  let authorInfo = {};
  let mediaRecorder;
  let mediaStream;
  let recordedChunks = [];
  let recordingTimer;
  let recordingTime = 0;
  let uploadedMediaFile = null;
  let uploadedImageFile = null;
  let qrCodeImage = null;
  let websocketConnection = null;
  let transcriptText = "";
  let suggestedQuestions = [
    "What problem were you trying to solve?",
    "Why did you choose our solution?",
    "What results have you seen?",
    "Would you recommend our solution to others?",
  ];
  let currentQuestionIndex = 0;
  let sttProcessor = null;
  let autoPlayNextQuestion = false;
  let lastChunkTime = 0;
  let isProcessingTranscript = false;
  let sessionId = "tw-" + Date.now();
  let userCameraChoice = "portrait"; // 'portrait' or 'landscape'
  let isWaitingForAIResponse = false;
  let pauseDetectionInterval = null;
  let lastVoiceActivityTime = Date.now();
  let isUserSpeaking = false;
  let silenceThreshold = 3000; // ms of silence before triggering next question
  let animationFrame = null;
  let audioContext = null;
  let audioAnalyser = null;
  let audioDataArray = null;

  // Color utilities
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Lighten or darken a hex color
  const adjustColor = (hex, percent) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
    g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
    b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Generate theme variables based on config
  const getThemeVariables = () => {
    // Generate variants of the primary color
    const primaryLight = adjustColor(config.primaryColor, 20);
    const primaryDark = adjustColor(config.primaryColor, -20);
    const secondaryLight = adjustColor(config.secondaryColor, 20);
    const secondaryDark = adjustColor(config.secondaryColor, -20);

    // Set CSS variables for light/dark mode
    const lightModeVars = {
      bgPrimary: "#ffffff",
      bgSecondary: "#F9FAFB",
      bgTertiary: "#F3F4F6",
      textPrimary: "#1F2937",
      textSecondary: "#4B5563",
      textTertiary: "#6B7280",
      borderColor: "#E5E7EB",
      borderColorHover: "#D1D5DB",
      shadowColor: "rgba(0, 0, 0, 0.1)",
      modalBg: "#ffffff",
      cardBg: "#F9FAFB",
    };

    const darkModeVars = {
      bgPrimary: "#111827",
      bgSecondary: "#1F2937",
      bgTertiary: "#374151",
      textPrimary: "#F9FAFB",
      textSecondary: "#E5E7EB",
      textTertiary: "#D1D5DB",
      borderColor: "#374151",
      borderColorHover: "#4B5563",
      shadowColor: "rgba(0, 0, 0, 0.3)",
      modalBg: "#1F2937",
      cardBg: "#111827",
    };

    // Choose the appropriate theme
    const themeVars = config.darkMode ? darkModeVars : lightModeVars;

    // Determine border radius based on config
    let borderRadius = "16px";
    let buttonBorderRadius = "9999px";

    if (config.roundedCorners === "sharp") {
      borderRadius = "8px";
      buttonBorderRadius = "8px";
    } else if (config.roundedCorners === "pill") {
      borderRadius = "24px";
      buttonBorderRadius = "9999px";
    }

    return {
      primaryColor: config.primaryColor,
      primaryLight,
      primaryDark,
      secondaryColor: config.secondaryColor,
      secondaryLight,
      secondaryDark,
      ...themeVars,
      borderRadius,
      buttonBorderRadius,
    };
  };

  // Add styles
  const addStyles = () => {
    const themeVars = getThemeVariables();

    const getBrandBackground = () => {
      if (config.brandMode === "solid") {
        return `background-color: ${themeVars.primaryColor};`;
      } else if (config.brandMode === "minimal") {
        return `background-color: ${themeVars.bgSecondary}; color: ${themeVars.primaryColor};`;
      } else {
        // Default: gradient
        return `background: linear-gradient(135deg, ${themeVars.primaryColor}, ${themeVars.secondaryColor});`;
      }
    };

    const headerStyle =
      config.brandMode === "minimal"
        ? `border-bottom: 2px solid ${themeVars.primaryColor};`
        : "";

    const styles = `
      :root {
        --tw-primary: ${themeVars.primaryColor};
        --tw-primary-light: ${themeVars.primaryLight};
        --tw-primary-dark: ${themeVars.primaryDark};
        --tw-secondary: ${themeVars.secondaryColor};
        --tw-secondary-light: ${themeVars.secondaryLight};
        --tw-secondary-dark: ${themeVars.secondaryDark};
        --tw-bg-primary: ${themeVars.bgPrimary};
        --tw-bg-secondary: ${themeVars.bgSecondary};
        --tw-bg-tertiary: ${themeVars.bgTertiary};
        --tw-text-primary: ${themeVars.textPrimary};
        --tw-text-secondary: ${themeVars.textSecondary};
        --tw-text-tertiary: ${themeVars.textTertiary};
        --tw-border-color: ${themeVars.borderColor};
        --tw-border-hover: ${themeVars.borderColorHover};
        --tw-shadow-color: ${themeVars.shadowColor};
        --tw-modal-bg: ${themeVars.modalBg};
        --tw-card-bg: ${themeVars.cardBg};
        --tw-border-radius: ${themeVars.borderRadius};
        --tw-button-radius: ${themeVars.buttonBorderRadius};
        --tw-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --tw-dialog-scale: ${config.dialogScale};
      }
    
      .tw-widget * {
        box-sizing: border-box;
        font-family: var(--tw-font-sans);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      @keyframes tw-float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
        100% { transform: translateY(0px); }
      }

      @keyframes tw-pulse-ring {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 ${hexToRgba(themeVars.primaryColor, 0.4)}; }
        70% { transform: scale(1); box-shadow: 0 0 0 10px ${hexToRgba(themeVars.primaryColor, 0)}; }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 ${hexToRgba(themeVars.primaryColor, 0)}; }
      }
      
      .tw-button {
        position: fixed;
        padding: 14px 24px;
        ${getBrandBackground()}
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
        border: ${config.brandMode === "minimal" ? `2px solid ${themeVars.primaryColor}` : "none"};
        border-radius: var(--tw-button-radius);
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999999;
        box-shadow: 0 10px 25px ${hexToRgba(themeVars.primaryColor, 0.25)}, 
                    0 4px 10px ${hexToRgba(themeVars.secondaryColor, 0.2)};
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
        animation: tw-float 6s ease-in-out infinite;
      }
      
      .tw-button::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
        transform: scale(0);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s;
      }
      
      .tw-button:hover {
        box-shadow: 0 15px 30px ${hexToRgba(themeVars.primaryColor, 0.3)}, 
                    0 8px 15px ${hexToRgba(themeVars.secondaryColor, 0.25)};
        transform: translateY(-2px);
      }
      
      .tw-button:hover::after {
        transform: scale(1);
        opacity: 1;
      }
      
      .tw-button:active {
        transform: translateY(0);
        box-shadow: 0 5px 15px ${hexToRgba(themeVars.primaryColor, 0.2)};
      }
      
      .tw-button.bottom-right {
        bottom: 30px;
        right: 30px;
      }
      
      .tw-button.bottom-left {
        bottom: 30px;
        left: 30px;
      }
      
      .tw-button.top-right {
        top: 30px;
        right: 30px;
      }
      
      .tw-button.top-left {
        top: 30px;
        left: 30px;
      }
      
      .tw-button-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${config.brandMode === "minimal" ? hexToRgba(themeVars.primaryColor, 0.2) : "rgba(255, 255, 255, 0.2)"};
        padding: 5px;
      }
      
      .tw-container {
        position: fixed;
        top: auto;
        left: auto;
        right: auto;
        bottom: auto;
        background-color: transparent; /* Remove the full-screen overlay */
        backdrop-filter: none; /* Remove blur effect */
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        z-index: 1000000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s;
      }

       /* Bottom right position */
      .tw-container.bottom-right {
        bottom: 100px;
        right: 30px;
      }
    
      /* Bottom left position */
      .tw-container.bottom-left {
        bottom: 100px;
        left: 30px;
      }
    
      /* Top right position */
      .tw-container.top-right {
        top: 30px;
        right: 30px;
      }
    
      /* Top left position */
      .tw-container.top-left {
        top: 30px;
        left: 30px;
      }

      .tw-container.active {
        opacity: 1;
        visibility: visible;
      }
      
      .tw-modal {
        width: calc(90% * var(--tw-dialog-scale));
        max-width: calc(650px * var(--tw-dialog-scale));
        max-height: 95vh;
        background-color: var(--tw-modal-bg);
        border-radius: var(--tw-border-radius);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--tw-border-color);
        transform: scale(0.95);
        opacity: 0;
        margin-bottom: 10px;
      }
      
      .tw-container.active .tw-modal {
        transform: scale(1);
        opacity: 1;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes tw-slide-up {
        from { transform: translateY(30px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      
      .tw-header {
        padding: 24px 28px;
        ${getBrandBackground()}
        ${headerStyle}
        color: ${config.brandMode === "minimal" ? themeVars.textPrimary : "white"};
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        overflow: hidden;
      }
      
      .tw-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E") center center;
        opacity: 0.1;
      }
      
      .tw-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, 
          rgba(255,255,255,0.3), 
          rgba(255,255,255,0.6), 
          rgba(255,255,255,0.3)
        );
        filter: blur(1px);
        opacity: ${config.brandMode === "minimal" ? "0" : "1"};
      }
      
      .tw-header-content {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      
      .tw-logo {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: ${config.brandMode === "minimal" ? hexToRgba(themeVars.primaryColor, 0.1) : "rgba(255, 255, 255, 0.9)"};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "var(--tw-primary)"};
        font-size: 14px;
        overflow: hidden;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      
      .tw-logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .tw-header h2 {
        margin: 0;
        font-size: 19px;
        font-weight: 600;
        text-shadow: ${config.brandMode === "minimal" ? "none" : "0 2px 4px rgba(0, 0, 0, 0.1)"};
        letter-spacing: 0.01em;
      }
      
      .tw-close {
        background: ${config.brandMode === "minimal" ? hexToRgba(themeVars.primaryColor, 0.15) : "rgba(255, 255, 255, 0.15)"};
        border: none;
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        z-index: 1000000;
      }
      
      .tw-close:hover {
        background: ${config.brandMode === "minimal" ? hexToRgba(themeVars.primaryColor, 0.25) : "rgba(255, 255, 255, 0.25)"};
        transform: rotate(90deg);
      }
      
      .tw-content {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
        position: relative;
        color: var(--tw-text-primary);
        max-height: 70vh;
      }
      
      .tw-step {
        animation: tw-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      @keyframes tw-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes tw-fade-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
      }

      .tw-fade-out {
        animation: tw-fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      .tw-footer {
        padding: 18px 28px;
        border-top: 1px solid var(--tw-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--tw-bg-secondary);
        border-radius: 0 0 var(--tw-border-radius) var(--tw-border-radius);
      }
      
      .tw-btn {
        padding: 10px 22px;
        border-radius: var(--tw-button-radius);
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        border: none;
        position: relative;
        overflow: hidden;
      }
      
      .tw-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150%;
        height: 150%;
        background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%);
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s;
      }
      
      .tw-btn:active::after {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      
      .tw-btn.primary {
        ${getBrandBackground()}
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
        box-shadow: 0 4px 10px ${hexToRgba(themeVars.primaryColor, 0.2)};
        border: ${config.brandMode === "minimal" ? `2px solid ${themeVars.primaryColor}` : "none"};
      }
      
      .tw-btn.primary:hover {
        box-shadow: 0 6px 15px ${hexToRgba(themeVars.primaryColor, 0.3)};
        transform: translateY(-2px);
      }
      
      .tw-btn.primary:active {
        transform: translateY(0);
        box-shadow: 0 2px 5px ${hexToRgba(themeVars.primaryColor, 0.2)};
      }
      
      .tw-btn.primary:disabled {
        background: var(--tw-text-tertiary);
        box-shadow: none;
        cursor: not-allowed;
        opacity: 0.7;
      }
      
      .tw-btn.secondary {
        background-color: transparent;
        color: var(--tw-text-primary);
        border: 1px solid var(--tw-border-color);
      }
      
      .tw-btn.secondary:hover {
        background-color: var(--tw-bg-tertiary);
        border-color: var(--tw-border-hover);
        transform: translateY(-2px);
      }
      
      .tw-btn.secondary:active {
        transform: translateY(0);
      }
      
      .tw-form-group {
        margin-bottom: 22px;
      }
      
      .tw-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--tw-text-primary);
        font-size: 15px;
      }
      
      .tw-input,
      .tw-textarea {
        width: 100%;
        padding: 14px 18px;
        border: 1px solid var(--tw-border-color);
        border-radius: 12px;
        font-size: 15px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--tw-bg-primary);
        color: var(--tw-text-primary);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .tw-input:focus,
      .tw-textarea:focus {
        outline: none;
        border-color: var(--tw-primary);
        box-shadow: 0 0 0 3px ${hexToRgba(themeVars.primaryColor, 0.15)};
      }
      
      .tw-textarea {
        min-height: 140px;
        resize: vertical;
        line-height: 1.5;
      }
      
      .tw-checkbox-container {
        display: flex;
        align-items: flex-start;
        margin-top: 16px;
      }
      
      .tw-checkbox {
        position: relative;
        appearance: none;
        width: 38px;
        height: 24px;
        border: 1px solid var(--tw-border-color);
        border-radius: 6px;
        margin-right: 12px;
        margin-top: 1px;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: var(--tw-bg-primary);
      }
      
      .tw-checkbox:checked {
        background-color: var(--tw-primary);
        border-color: var(--tw-primary);
      }
      
      .tw-checkbox:checked::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 6px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      
      .tw-checkbox:focus {
        box-shadow: 0 0 0 3px ${hexToRgba(themeVars.primaryColor, 0.15)};
        outline: none;
      }
      
      .tw-checkbox-label {
        font-size: 14px;
        line-height: 1.4;
        color: var(--tw-text-secondary);
      }
      
      /* Method selection */
      .tw-methods {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        margin-top: 20px;
      }
      
      .tw-method {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 28px 18px;
        background-color: var(--tw-card-bg);
        border: 2px solid var(--tw-border-color);
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .tw-method::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--tw-primary), var(--tw-secondary));
        transform: scaleX(0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .tw-method:hover {
        border-color: var(--tw-primary);
        transform: translateY(-5px);
        box-shadow: 0 10px 25px var(--tw-shadow-color);
      }
      
      .tw-method:hover::before {
        transform: scaleX(1);
      }
      
      .tw-method-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        ${getBrandBackground()}
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
        box-shadow: 0 5px 15px ${hexToRgba(themeVars.primaryColor, 0.25)};
      }
      
      .tw-method-title {
        font-weight: 600;
        font-size: 16px;
        margin: 0 0 6px 0;
        color: var(--tw-text-primary);
      }
      
      .tw-method-desc {
        font-size: 14px;
        color: var(--tw-text-secondary);
        margin: 0;
      }
      
      /* Upload section */
      .tw-upload-section {
        margin: 20px 0;
      }
      
      .tw-upload-container {
        border: 2px dashed var(--tw-border-color);
        border-radius: 14px;
        padding: 30px 20px;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--tw-bg-secondary);
        cursor: pointer;
        position: relative;
      }
      
      .tw-upload-container:hover {
        border-color: var(--tw-primary);
        background-color: ${hexToRgba(themeVars.primaryColor, 0.05)};
      }
      
      .tw-upload-icon {
        width: 50px;
        height: 50px;
        margin: 0 auto 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${hexToRgba(themeVars.primaryColor, 0.1)};
        color: var(--tw-primary);
        border-radius: 50%;
      }
      
      .tw-upload-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--tw-text-primary);
      }
      
      .tw-upload-hint {
        font-size: 14px;
        color: var(--tw-text-secondary);
      }
      
      .tw-upload-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }
      
      .tw-uploaded-preview {
        margin-top: 15px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--tw-border-color);
        position: relative;
      }
      
      .tw-uploaded-media {
        width: 100%;
        display: block;
      }
      
      .tw-uploaded-overlay {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
      }
      
      .tw-uploaded-action {
        width: 36px;
        height: 36px;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .tw-uploaded-action:hover {
        background-color: rgba(0, 0, 0, 0.8);
      }
      
      /* Recording */
      .tw-recorder {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background-color: #0F172A;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        margin-bottom: 24px;
      }
      
      .tw-recorder.audio {
        aspect-ratio: auto;
        min-height: 180px;
        max-height: 240px;
      }

      .tw-recorder.portrait {
        aspect-ratio: 0.70;
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .tw-video-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .tw-player-video.portrait {
        aspect-ratio: 0.70;
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .tw-recorder-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 24px;
        color: white;
      }
      
      .tw-question {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 10px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }
      
      .tw-recorder-hint {
        font-size: 14px;
        opacity: 0.9;
        background-color: rgba(0,0,0,0.3);
        padding: 8px 14px;
        border-radius: 9999px;
        display: inline-block;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }

      .tw-recorder-hint.active {
        background-color: ${hexToRgba(themeVars.primaryColor, 0.6)};
        border-color: ${themeVars.primaryColor};
        transform: scale(1.05);
      }
      
      .tw-recording-indicator {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: rgba(0,0,0,0.6);
        padding: 8px 14px;
        border-radius: 9999px;
        border: 1px solid rgba(255,59,48,0.3);
        backdrop-filter: blur(5px);
      }
      
      .tw-recording-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #FF3B30;
        animation: tw-pulse 1s infinite;
      }
      
      @keyframes tw-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.8); }
      }
      
      .tw-controls {
        display: flex;
        justify-content: center;
        gap: 18px;
        margin-top: 20px;
      }
      
      .tw-control-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--tw-bg-tertiary);
        color: var(--tw-text-primary);
        box-shadow: 0 2px 5px var(--tw-shadow-color);
      }
      
      .tw-control-btn.primary {
        ${getBrandBackground()}
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
        box-shadow: 0 5px 15px ${hexToRgba(themeVars.primaryColor, 0.25)};
      }
      
      .tw-control-btn.primary:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 20px ${hexToRgba(themeVars.primaryColor, 0.3)};
      }
      
      .tw-control-btn.primary:active {
        transform: scale(1);
      }
      
      .tw-control-btn.danger {
        background: linear-gradient(135deg, #E11D48, #F43F5E);
        color: white;
        box-shadow: 0 5px 15px rgba(225, 29, 72, 0.25);
      }
      
      .tw-control-btn.danger:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 20px rgba(225, 29, 72, 0.3);
      }

      .tw-control-btn.record {
        animation: tw-pulse-ring 2s infinite;
      }
      
      /* Audio visualization */
      .tw-visualizer {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 3px;
        padding: 20px;
      }
      
      .tw-visualizer-bar {
        background: linear-gradient(to top, var(--tw-primary), var(--tw-secondary));
        width: 4px;
        border-radius: 2px;
        transition: height 0.1s ease-out;
        box-shadow: 0 2px 4px ${hexToRgba(themeVars.primaryColor, 0.3)};
      }
      
      /* Countdown */
      .tw-countdown {
        position: absolute;
        inset: 0;
        background-color: rgba(0,0,0,0.7);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 80px;
        font-weight: 700;
        color: white;
        z-index: 10;
      }
      
      .tw-countdown-number {
        width: 150px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--tw-primary), var(--tw-secondary));
        box-shadow: 0 10px 30px ${hexToRgba(themeVars.primaryColor, 0.5)},
                    0 0 0 10px ${hexToRgba(themeVars.primaryColor, 0.2)};
        position: relative;
        overflow: hidden;
      }
      
      .tw-countdown-number::before {
        content: '';
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
      }
      
      /* Transcript */
      .tw-transcript {
        margin-top: 20px;
        padding: 16px;
        background-color: var(--tw-bg-secondary);
        border-radius: 12px;
        max-height: 120px;
        overflow-y: auto;
        font-style: italic;
        font-size: 14px;
        color: var(--tw-text-secondary);
        border: 1px solid var(--tw-border-color);
        box-shadow: inset 0 2px 4px var(--tw-shadow-color);
        transition: all 0.3s ease;
      }

      .tw-transcript.active {
        border-color: var(--tw-primary);
        background-color: ${hexToRgba(themeVars.primaryColor, 0.05)};
      }
      
      /* Questions */
      .tw-questions {
        margin-top: 20px;
      }
      
      .tw-question-suggestion {
        padding: 14px 18px;
        background-color: var(--tw-bg-secondary);
        border-left: 3px solid var(--tw-primary);
        border-radius: 0 12px 12px 0;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 15px;
        color: var(--tw-text-primary);
        box-shadow: 0 2px 5px var(--tw-shadow-color);
      }
      
      .tw-question-suggestion:hover {
        background-color: ${hexToRgba(themeVars.primaryColor, 0.1)};
        transform: translateX(5px);
        box-shadow: 0 4px 12px var(--tw-shadow-color);
      }

      .tw-question-suggestion.active {
        background-color: ${hexToRgba(themeVars.primaryColor, 0.2)};
        border-left-width: 5px;
        transform: translateX(5px);
        box-shadow: 0 4px 12px var(--tw-shadow-color);
      }
      
      /* Review */
      .tw-player {
        width: 100%;
        background-color: var(--tw-bg-secondary);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 5px 15px var(--tw-shadow-color);
      }
      
      .tw-player-video {
        width: 100%;
        aspect-ratio: 16 / 9;
        background-color: #0F172A;
        object-fit: contain;
      }
      
      .tw-player-audio {
        padding: 24px;
      }
      
      .tw-player-controls {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-top: 1px solid var(--tw-border-color);
      }
      
      .tw-progress {
        flex: 1;
        height: 6px;
        background-color: var(--tw-border-color);
        border-radius: 9999px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        box-shadow: inset 0 1px 2px var(--tw-shadow-color);
      }
      
      .tw-progress-inner {
        height: 100%;
        background: linear-gradient(90deg, var(--tw-primary), var(--tw-secondary));
        border-radius: 9999px;
        transition: width 0.1s linear;
        box-shadow: 0 0 4px ${hexToRgba(themeVars.primaryColor, 0.5)};
      }
      
      .tw-player-time {
        font-size: 13px;
        color: var(--tw-text-secondary);
        min-width: 80px;
        text-align: center;
      }
      
      /* Thank you */
      .tw-thankyou {
        text-align: center;
        padding: 40px 20px;
      }
      
      .tw-thankyou-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--tw-primary), var(--tw-secondary));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 28px;
        box-shadow: 0 10px 25px ${hexToRgba(themeVars.primaryColor, 0.3)},
                    0 0 0 10px ${hexToRgba(themeVars.primaryColor, 0.1)};
        position: relative;
        overflow: hidden;
      }
      
      .tw-thankyou-icon::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
        animation: tw-rotate 8s linear infinite;
      }
      
      @keyframes tw-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .tw-thankyou-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--tw-text-primary);
        margin-bottom: 12px;
      }
      
      .tw-thankyou-message {
        color: var(--tw-text-secondary);
        margin-bottom: 36px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
        line-height: 1.6;
      }
      
      /* Loading spinner */
      .tw-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: tw-spin 0.8s linear infinite;
      }
      
      @keyframes tw-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* QR Code */
      .tw-qr-container {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin: 30px 0;
        padding: 25px;
        background-color: var(--tw-bg-secondary);
        border-radius: 14px;
        border: 1px solid var(--tw-border-color);
      }
      
      .tw-qr-title {
        font-size: 17px;
        font-weight: 600;
        margin-bottom: 15px;
        color: var(--tw-text-primary);
      }
      
      .tw-qr-code {
        width: 180px;
        height: 180px;
        padding: 10px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px var(--tw-shadow-color);
        margin-bottom: 15px;
      }
      
      .tw-qr-desc {
        color: var(--tw-text-secondary);
        text-align: center;
        font-size: 14px;
        max-width: 300px;
      }
      
      /* Segmented control */
      .tw-segmented-control {
        display: flex;
        background-color: var(--tw-bg-tertiary);
        border-radius: 9999px;
        padding: 4px;
        margin: 20px 0;
        position: relative;
        box-shadow: inset 0 1px 2px var(--tw-shadow-color);
      }
      
      .tw-segment {
        flex: 1;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        cursor: pointer;
        border-radius: 9999px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
        color: var(--tw-text-secondary);
      }
      
      .tw-segment.active {
        color: ${config.brandMode === "minimal" ? themeVars.primaryColor : "white"};
      }
      
      .tw-segment-highlight {
        position: absolute;
        height: calc(100% - 8px);
        top: 4px;
        border-radius: 9999px;
        ${getBrandBackground()}
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 5px ${hexToRgba(themeVars.primaryColor, 0.3)};
      }
      
      /* Shared transitions */
      .tw-fade-in {
        animation: tw-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      /* Image gallery */
      .tw-image-preview {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        margin: 15px 0;
        box-shadow: 0 5px 15px var(--tw-shadow-color);
        border: 1px solid var(--tw-border-color);
      }
      
      .tw-preview-img {
        width: 100%;
        display: block;
      }

      /* AI Hints and Effects */
      .tw-ai-hint {
        position: absolute;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${hexToRgba(themeVars.primaryColor, 0.9)};
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 100;
        pointer-events: none;
        max-width: 80%;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .tw-ai-hint.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .tw-ai-hint.hiding {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }

      .tw-ai-typing {
        display: none;
        position: absolute;
        top: 15px;
        left: 15px;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 20px;
        padding: 8px 15px;
        color: white;
        font-size: 13px;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        align-items: center;
        gap: 8px;
      }

      .tw-ai-typing.visible {
        display: flex;
      }

      .tw-ai-typing-dots {
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .tw-ai-typing-dot {
        width: 4px;
        height: 4px;
        background-color: white;
        border-radius: 50%;
        opacity: 0.7;
      }

      .tw-ai-typing-dot:nth-child(1) {
        animation: tw-typing-dot 1.4s infinite 0s;
      }

      .tw-ai-typing-dot:nth-child(2) {
        animation: tw-typing-dot 1.4s infinite 0.2s;
      }

      .tw-ai-typing-dot:nth-child(3) {
        animation: tw-typing-dot 1.4s infinite 0.4s;
      }

      @keyframes tw-typing-dot {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }

      /* Camera orientation selector */
      .tw-orientation-selector {
        display: flex;
        justify-content: center;
        margin-bottom: 15px;
        gap: 15px;
      }

      .tw-orientation-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.3s ease;
      }

      .tw-orientation-option.active {
        opacity: 1;
      }

      .tw-orientation-icon {
        width: 50px;
        height: 50px;
        background-color: var(--tw-bg-tertiary);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--tw-border-color);
        transition: all 0.3s ease;
        padding: 10px;
      }

      .tw-orientation-option.active .tw-orientation-icon {
        border-color: var(--tw-primary);
        background-color: ${hexToRgba(themeVars.primaryColor, 0.1)};
      }

      .tw-orientation-label {
        font-size: 13px;
        color: var(--tw-text-secondary);
      }

      .tw-orientation-option.active .tw-orientation-label {
        color: var(--tw-primary);
        font-weight: 500;
      }

      /* Loading state */
      .tw-loading-state {
        position: absolute;
        inset: 0;
        background-color: var(--tw-bg-primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: var(--tw-border-radius);
      }

      .tw-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid ${hexToRgba(themeVars.primaryColor, 0.2)};
        border-top-color: var(--tw-primary);
        border-radius: 50%;
        animation: tw-spin 1s linear infinite;
        margin-bottom: 15px;
      }

      .tw-loading-text {
        font-size: 16px;
        color: var(--tw-text-primary);
        margin-top: 15px;
      }

      /* Connection status */
      .tw-connection-status {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 100;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .tw-connection-status.visible {
        opacity: 1;
      }

      .tw-connection-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #22c55e;
      }

      .tw-connection-status.disconnected .tw-connection-indicator {
        background-color: #ef4444;
      }

      .tw-connection-status.connecting .tw-connection-indicator {
        background-color: #f59e0b;
        animation: tw-pulse 1s infinite;
      }
      
      /* Responsive fixes */
      @media (max-width: 768px) {
        .tw-modal {
          width: 95vw;
          max-height: 85vh;
        }

        .tw-container.bottom-right,
        .tw-container.bottom-left {
          bottom: 80px;
          right: 10px;
          left: auto;
        }
      
        .tw-container.top-right,
        .tw-container.top-left {
          top: 80px;
          right: 10px;
          left: auto;
        }

        .tw-recorder.portrait {
          max-width: 100%;
        }
        
        .tw-methods {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .tw-recorder {
          aspect-ratio: 4 / 3;
        }
        
        .tw-thankyou-icon {
          width: 60px;
          height: 60px;
        }
        
        .tw-thankyou-title {
          font-size: 24px;
        }
        
        .tw-controls {
          flex-wrap: wrap;
        }
        
        .tw-header {
          padding: 20px;
        }
        
        .tw-content {
          padding: 20px;
        }
        
        .tw-footer {
          padding: 15px 20px;
        }

        .tw-ai-hint {
          max-width: 90%;
        }
      }
    `;

    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  };

  const addFonts = () => {
    // Create link element for Google Fonts
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700&display=swap";
    document.head.appendChild(fontLink);

    // Update your CSS variables to use these fonts
    const fontStyles = document.createElement("style");
    fontStyles.textContent = `
    :root {
      --tw-font-heading: 'Urbanist', sans-serif;
      --tw-font-body: 'Manrope', sans-serif;
    }
    
    .tw-widget h1, .tw-widget h2, .tw-widget h3, 
    .tw-widget h4, .tw-widget .tw-header h2,
    .tw-widget .tw-method-title, .tw-widget .tw-thankyou-title,
    .tw-widget .tw-btn, .tw-widget .tw-question {
      font-family: var(--tw-font-heading);
    }
    
    .tw-widget, .tw-widget p, .tw-widget input, 
    .tw-widget textarea, .tw-widget label,
    .tw-widget .tw-checkbox-label, .tw-widget .tw-method-desc,
    .tw-widget .tw-upload-hint, .tw-widget .tw-transcript {
      font-family: var(--tw-font-body);
    }
  `;
    document.head.appendChild(fontStyles);
  };

  // Create SVG icons
  const icons = {
    camera: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>`,
    mic: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
    text: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    record: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    stop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    messageSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    qrCode: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M12 12v.01"/><path d="M12 17v.01"/><path d="M17 12h.01"/><path d="M17 17h.01"/></svg>`,
    smartphone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
    desktop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
    fileVideo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 11 5 3-5 3v-6Z"/></svg>`,
    fileAudio: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 15h8"/></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    wifiOff: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
    portraitPhone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11.95 18h.1"/></svg>`,
    landscapePhone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 10h.01"/></svg>`,
  };

  // Generate a QR code image from text
  const generateQRCode = (text) => {
    // Define QR code options - we'll use a simple implementation
    const moduleCount = 33; // This will create a 33x33 QR code (version 3)
    const cellSize = 5;
    const margin = 4;
    const size = moduleCount * cellSize + 2 * margin * cellSize;

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Simple simulation of QR code pattern
    // In a real implementation, you'd use a proper QR code library
    ctx.fillStyle = "#000000";

    // Draw position detection patterns (the three big squares in corners)
    // Top-left
    ctx.fillRect(
      margin * cellSize,
      margin * cellSize,
      7 * cellSize,
      7 * cellSize
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(
      (margin + 1) * cellSize,
      (margin + 1) * cellSize,
      5 * cellSize,
      5 * cellSize
    );
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      (margin + 2) * cellSize,
      (margin + 2) * cellSize,
      3 * cellSize,
      3 * cellSize
    );

    // Top-right
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      size - (margin + 7) * cellSize,
      margin * cellSize,
      7 * cellSize,
      7 * cellSize
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(
      size - (margin + 6) * cellSize,
      (margin + 1) * cellSize,
      5 * cellSize,
      5 * cellSize
    );
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      size - (margin + 5) * cellSize,
      (margin + 2) * cellSize,
      3 * cellSize,
      3 * cellSize
    );

    // Bottom-left
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      margin * cellSize,
      size - (margin + 7) * cellSize,
      7 * cellSize,
      7 * cellSize
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(
      (margin + 1) * cellSize,
      size - (margin + 6) * cellSize,
      5 * cellSize,
      5 * cellSize
    );
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      (margin + 2) * cellSize,
      size - (margin + 5) * cellSize,
      3 * cellSize,
      3 * cellSize
    );

    // Add random-looking data modules to make it look like a QR code
    ctx.fillStyle = "#000000";
    const hash = simpleHash(text);

    for (let i = 0; i < moduleCount; i++) {
      for (let j = 0; j < moduleCount; j++) {
        // Skip the position detection patterns and their quiet zones
        if (
          (i < 9 && j < 9) || // Top-left
          (i < 9 && j > moduleCount - 10) || // Top-right
          (i > moduleCount - 10 && j < 9)
        ) {
          // Bottom-left
          continue;
        }

        // Some pseudo-random pattern based on the hash and position
        if ((hash + i * j + i + j) % 3 === 0) {
          ctx.fillRect(
            (margin + i) * cellSize,
            (margin + j) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    // In a real implementation, you would return the QR code URL
    return canvas.toDataURL("image/png");
  };

  // Simple hash function for generating QR code pattern
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (websocketConnection !== null) {
      return; // Already connected
    }

    try {
      const wsUrl = `${config.websocketBaseUrl}/ws/interview/${config.campaignId}?session=${sessionId}`;
      websocketConnection = new WebSocket(wsUrl);

      // Update connection status visual
      updateConnectionStatus("connecting");

      websocketConnection.onopen = (event) => {
        console.log("WebSocket connection established");
        updateConnectionStatus("connected");

        // Send initial message with author info
        const initialPayload = {
          type: "client_info",
          sessionId: sessionId,
          authorInfo: {
            name: authorInfo.name || "",
            email: authorInfo.email || "",
            company: authorInfo.company || "",
            position: authorInfo.position || "",
          },
          campaignId: config.campaignId,
          mediaType: authorInfo.mediaType || "video",
        };

        sendWebSocketMessage(initialPayload);
      };

      websocketConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      websocketConnection.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        updateConnectionStatus("disconnected");
        websocketConnection = null;

        // Attempt to reconnect if we're still recording
        if (
          mediaRecorder &&
          (mediaRecorder.state === "recording" ||
            mediaRecorder.state === "paused")
        ) {
          setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connectWebSocket();
          }, 2000);
        }
      };

      websocketConnection.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateConnectionStatus("disconnected");
      };
    } catch (err) {
      console.error("Error connecting to WebSocket:", err);
      updateConnectionStatus("disconnected");
    }
  };

  // Update connection status indicator
  const updateConnectionStatus = (status) => {
    const statusEl = document.querySelector(".tw-connection-status");
    if (!statusEl) return;

    statusEl.classList.remove("connected", "connecting", "disconnected");
    statusEl.classList.add(status);
    statusEl.classList.add("visible");

    let statusText = "";
    switch (status) {
      case "connected":
        statusText = "Connected";
        // Hide after a few seconds when connected
        setTimeout(() => {
          statusEl.classList.remove("visible");
        }, 3000);
        break;
      case "connecting":
        statusText = "Connecting...";
        break;
      case "disconnected":
        statusText = "Disconnected";
        break;
    }

    statusEl.querySelector(".tw-connection-text").textContent = statusText;
  };

  // Send message over WebSocket
  const sendWebSocketMessage = (data) => {
    if (
      websocketConnection &&
      websocketConnection.readyState === WebSocket.OPEN
    ) {
      websocketConnection.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  // Close WebSocket connection
  const closeWebSocketConnection = () => {
    if (websocketConnection) {
      websocketConnection.close();
      websocketConnection = null;
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    // console.log("Received WebSocket message:", data);

    switch (data.type) {
      case "transcript":
        // Update transcript
        transcriptText = data.text || "";
        updateTranscriptDisplay(transcriptText);
        break;

      case "question_suggestion":
        // Add AI suggested question
        if (data.questions && data.questions.length > 0) {
          const newQuestions = data.questions.filter(
            (q) => !suggestedQuestions.includes(q)
          );
          if (newQuestions.length > 0) {
            suggestedQuestions = [...suggestedQuestions, ...newQuestions];
            updateQuestionSuggestions();
          }
        }
        break;

      case "next_question":
        // Auto advance to next question
        if (data.question) {
          isWaitingForAIResponse = false;
          updateAITypingIndicator(false);
          showNextQuestion(data.question);
        }
        break;

      case "hint":
        // Show recording hint
        if (data.text) {
          showAIHint(data.text);
        }
        break;

      case "filler_detected":
        // Show filler word hint
        if (data.fillerWord) {
          if (config.showAIHints) {
            showAIHint(`Try to avoid using "${data.fillerWord}"`);
          }
        }
        break;

      case "pause_detected":
        // User paused speaking, suggest next question
        if (data.duration && data.duration > 2.0) {
          // Only trigger if we're not already waiting for a response
          if (!isWaitingForAIResponse) {
            isWaitingForAIResponse = true;
            updateAITypingIndicator(true);

            // Request next question from server
            sendWebSocketMessage({
              type: "request_next_question",
              sessionId: sessionId,
              transcript: transcriptText,
              currentQuestion: document.getElementById("tw-current-question")
                .textContent,
            });
          }
        }
        break;

      case "speech_confidence":
        // Update UI based on speech confidence
        if (data.confidence !== undefined) {
          // Could show visual feedback for speech quality
          const confidenceLevel = parseFloat(data.confidence);
          if (confidenceLevel < 0.7 && config.showAIHints) {
            showAIHint("Try speaking a bit louder and clearer");
          }
        }
        break;
    }
  };

  // Update the transcript display
  const updateTranscriptDisplay = (text) => {
    const transcriptEl = document.getElementById("tw-transcript-text");
    if (transcriptEl) {
      transcriptEl.textContent =
        text || "Your speech will appear here as you speak...";

      // Add active highlight for a moment
      const containerEl = document.getElementById("tw-transcript");
      if (containerEl) {
        containerEl.classList.add("active");
        setTimeout(() => {
          containerEl.classList.remove("active");
        }, 500);
      }
    }
  };

  // Update question suggestions display
  const updateQuestionSuggestions = () => {
    const questionsContainer = document.querySelector(".tw-questions");
    if (!questionsContainer) return;

    // Clear existing suggestions
    const suggestionsEl = questionsContainer.querySelector(
      ".tw-question-suggestions"
    );
    if (suggestionsEl) {
      suggestionsEl.innerHTML = "";

      // Add each question suggestion
      suggestedQuestions.forEach((question, index) => {
        const questionEl = document.createElement("div");
        questionEl.className = "tw-question-suggestion";
        questionEl.textContent = question;
        questionEl.dataset.index = index;

        // Set active class for current question
        if (index === currentQuestionIndex) {
          questionEl.classList.add("active");
        }

        questionEl.addEventListener("click", () => {
          // Update current question when clicked
          document.getElementById("tw-current-question").textContent = question;
          currentQuestionIndex = index;
          updateQuestionSuggestions(); // Refresh active states
        });

        suggestionsEl.appendChild(questionEl);
      });
    }
  };

  // Show AI hint popup
  const showAIHint = (text) => {
    let hintEl = document.querySelector(".tw-ai-hint");

    // Create hint element if it doesn't exist
    if (!hintEl) {
      hintEl = document.createElement("div");
      hintEl.className = "tw-ai-hint";
      document.querySelector(".tw-recorder").appendChild(hintEl);
    }

    // Stop any existing hide timer
    if (hintEl.hideTimer) {
      clearTimeout(hintEl.hideTimer);
      hintEl.hideTimer = null;
    }

    // Show the hint
    hintEl.textContent = text;
    hintEl.classList.remove("hiding");
    hintEl.classList.add("visible");

    // Auto-hide after 5 seconds
    hintEl.hideTimer = setTimeout(() => {
      hintEl.classList.add("hiding");
      hintEl.classList.remove("visible");
    }, 5000);
  };

  // Show next question
  const showNextQuestion = (question) => {
    const questionEl = document.getElementById("tw-current-question");
    if (!questionEl) return;

    // Animate transition
    questionEl.classList.add("tw-fade-out");

    setTimeout(() => {
      questionEl.textContent = question;
      questionEl.classList.remove("tw-fade-out");
      questionEl.classList.add("tw-fade-in");

      // Find this question in our suggestions and update active state
      const index = suggestedQuestions.findIndex((q) => q === question);
      if (index !== -1) {
        currentQuestionIndex = index;
        updateQuestionSuggestions();
      } else {
        // If it's a new question, add it to suggestions
        suggestedQuestions.push(question);
        currentQuestionIndex = suggestedQuestions.length - 1;
        updateQuestionSuggestions();
      }

      // Briefly highlight the recorder hint
      const hintEl = document.querySelector(".tw-recorder-hint");
      if (hintEl) {
        hintEl.classList.add("active");
        setTimeout(() => {
          hintEl.classList.remove("active");
        }, 1000);
      }
    }, 300);
  };

  // Update AI typing indicator
  const updateAITypingIndicator = (isVisible) => {
    let typingEl = document.querySelector(".tw-ai-typing");

    if (!typingEl && isVisible) {
      // Create typing indicator if it doesn't exist
      typingEl = document.createElement("div");
      typingEl.className = "tw-ai-typing";
      typingEl.innerHTML = `
        <span>AI thinking</span>
        <div class="tw-ai-typing-dots">
          <div class="tw-ai-typing-dot"></div>
          <div class="tw-ai-typing-dot"></div>
          <div class="tw-ai-typing-dot"></div>
        </div>
      `;
      document.querySelector(".tw-recorder").appendChild(typingEl);
    }

    if (typingEl) {
      if (isVisible) {
        typingEl.classList.add("visible");
      } else {
        typingEl.classList.remove("visible");
      }
    }
  };

  // Open widget
  // const openWidget = () => {
  //   const container = document.querySelector(".tw-container");
  //   container.classList.add("active");
  // };

  const openWidget = () => {
    const container = document.querySelector(".tw-container");
    const button = document.querySelector(".tw-button");

    // Ensure the container has the same positioning class as the button
    const positionClass = button.className.match(
      /(top|bottom)-(left|right)/
    )[0];

    // Remove all position classes and add the matching one
    container.classList.remove(
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right"
    );
    container.classList.add(positionClass);

    // Make the container visible
    container.classList.add("active");
  };

  // Close widget
  const closeWidget = () => {
    document.querySelector(".tw-container").classList.remove("active");
    stopRecording();
    resetWidget();
  };

  // Reset widget
  const resetWidget = () => {
    currentStep = 0;
    authorInfo = {};
    recordedChunks = [];
    recordingTime = 0;
    uploadedMediaFile = null;
    uploadedImageFile = null;
    transcriptText = "";
    closeWebSocketConnection();

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }

    if (pauseDetectionInterval) {
      clearInterval(pauseDetectionInterval);
      pauseDetectionInterval = null;
    }

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext
        .close()
        .catch((err) => console.error("Error closing AudioContext:", err));
      audioContext = null;
      audioAnalyser = null;
      audioDataArray = null;
    }

    setTimeout(() => {
      renderInfoStep();
    }, 300);
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    console.trace("seconds", seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render author info step
  const renderInfoStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    contentEl.innerHTML = `
      <div class="tw-step">
        <h3 class="tw-label" style="font-size: 19px; margin-bottom: 20px; font-weight: 600;">Tell us about yourself</h3>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-name">Name</label>
          <input class="tw-input" type="text" id="tw-name" placeholder="Your full name" value="${authorInfo.name || ""}">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-email">Email Address</label>
          <input class="tw-input" type="email" id="tw-email" placeholder="Your email address" value="${authorInfo.email || ""}">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-company">Company</label>
          <input class="tw-input" type="text" id="tw-company" placeholder="Your company name" value="${authorInfo.company || ""}">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-position">Position</label>
          <input class="tw-input" type="text" id="tw-position" placeholder="Your job title" value="${authorInfo.position || ""}">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-profile-image">Profile Image (Optional)</label>
          <div class="tw-upload-container" id="tw-image-upload-container">
            <div class="tw-upload-icon">${icons.image}</div>
            <div class="tw-upload-title">Upload Profile Image</div>
            <div class="tw-upload-hint">Drop your photo here or click to browse</div>
            <input type="file" class="tw-upload-input" id="tw-profile-image" accept="image/*">
          </div>
          <div id="tw-image-preview-container" ${uploadedImageFile ? "" : 'style="display: none;"'}>
            ${
              uploadedImageFile
                ? `
              <div class="tw-image-preview">
                <img src="${URL.createObjectURL(uploadedImageFile)}" class="tw-preview-img" alt="Profile image preview">
                <div class="tw-uploaded-overlay">
                  <div class="tw-uploaded-action" id="tw-remove-image">${icons.trash}</div>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="tw-checkbox-container">
          <input class="tw-checkbox" type="checkbox" id="tw-consent" ${authorInfo.consent ? "checked" : ""}>
          <label class="tw-checkbox-label" for="tw-consent">
            I consent to my testimonial being used in marketing materials and understand my profile information and image may be displayed alongside my testimonial.
          </label>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-cancel-btn">
        Cancel
      </button>
      <button class="tw-btn primary" id="tw-next-btn">
        <span>Next</span>
        <span>${icons.chevronRight}</span>
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-cancel-btn")
      .addEventListener("click", closeWidget);
    document.getElementById("tw-next-btn").addEventListener("click", () => {
      // Save author info
      authorInfo = {
        name: document.getElementById("tw-name").value,
        email: document.getElementById("tw-email").value,
        company: document.getElementById("tw-company").value,
        position: document.getElementById("tw-position").value,
        consent: document.getElementById("tw-consent").checked,
      };

      // Validate inputs
      if (!authorInfo.name) {
        alert("Please enter your name");
        return;
      }

      if (!authorInfo.email) {
        alert("Please enter your email address");
        return;
      }

      if (!authorInfo.consent) {
        alert("Please consent to sharing your testimonial");
        return;
      }

      // Go to method selection
      renderMethodStep();
    });

    // Image upload handling
    const profileImageInput = document.getElementById("tw-profile-image");
    profileImageInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadedImageFile = e.target.files[0];
        const previewContainer = document.getElementById(
          "tw-image-preview-container"
        );
        previewContainer.style.display = "block";
        previewContainer.innerHTML = `
          <div class="tw-image-preview">
            <img src="${URL.createObjectURL(uploadedImageFile)}" class="tw-preview-img" alt="Profile image preview">
            <div class="tw-uploaded-overlay">
              <div class="tw-uploaded-action" id="tw-remove-image">${icons.trash}</div>
            </div>
          </div>
        `;

        // Add remove image handler
        document
          .getElementById("tw-remove-image")
          .addEventListener("click", () => {
            uploadedImageFile = null;
            document.getElementById(
              "tw-image-preview-container"
            ).style.display = "none";
            document.getElementById("tw-profile-image").value = "";
          });
      }
    });

    // Handle remove image if it exists
    const removeImageBtn = document.getElementById("tw-remove-image");
    if (removeImageBtn) {
      removeImageBtn.addEventListener("click", () => {
        uploadedImageFile = null;
        document.getElementById("tw-image-preview-container").style.display =
          "none";
        document.getElementById("tw-profile-image").value = "";
      });
    }
  };

  // Render method selection step
  const renderMethodStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    // Create QR code URL for continuing on mobile
    const continueUrl = `${config.apiBaseUrl}/continue-testimonial?session=${sessionId}&campaign=${config.campaignId}`;
    qrCodeImage = generateQRCode(continueUrl);

    contentEl.innerHTML = `
      <div class="tw-step">
        <h3 class="tw-label" style="font-size: 19px; margin-bottom: 20px; font-weight: 600;">How would you like to share your experience?</h3>
        
        <div class="tw-methods">
          <div class="tw-method" id="tw-video-option">
            <div class="tw-method-icon">
              ${icons.camera}
            </div>
            <div class="tw-method-title">Video</div>
            <div class="tw-method-desc">Record or upload a video testimonial</div>
          </div>
          
          <div class="tw-method" id="tw-audio-option">
            <div class="tw-method-icon">
              ${icons.mic}
            </div>
            <div class="tw-method-title">Audio</div>
            <div class="tw-method-desc">Record or upload an audio testimonial</div>
          </div>
          
          <div class="tw-method" id="tw-text-option">
            <div class="tw-method-icon">
              ${icons.text}
            </div>
            <div class="tw-method-title">Text</div>
            <div class="tw-method-desc">Write a text testimonial</div>
          </div>
        </div>
        
        <div class="tw-qr-container">
          <div class="tw-qr-title">
            <span>${icons.smartphone}</span> Continue on Mobile
          </div>
          <div class="tw-qr-code">
            <img src="${qrCodeImage}" alt="QR Code" width="160" height="160">
          </div>
          <div class="tw-qr-desc">
            Scan this QR code with your phone's camera to continue this process on your mobile device.
          </div>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-back-btn">
        <span>${icons.chevronLeft}</span>
        <span>Back</span>
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-back-btn")
      .addEventListener("click", renderInfoStep);

    document.getElementById("tw-video-option").addEventListener("click", () => {
      authorInfo.mediaType = "video";
      renderMediaOptionStep();
    });

    document.getElementById("tw-audio-option").addEventListener("click", () => {
      authorInfo.mediaType = "audio";
      renderMediaOptionStep();
    });

    document.getElementById("tw-text-option").addEventListener("click", () => {
      authorInfo.mediaType = "text";
      renderTextStep();
    });
  };

  // Render media option step (record or upload)
  const renderMediaOptionStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    const isVideo = authorInfo.mediaType === "video";

    contentEl.innerHTML = `
      <div class="tw-step">
        <h3 class="tw-label" style="font-size: 19px; margin-bottom: 20px; font-weight: 600;">
          ${isVideo ? "Video" : "Audio"} Testimonial
        </h3>

        <div class="tw-segmented-control">
          <div class="tw-segment active" data-option="record">Record</div>
          <div class="tw-segment" data-option="upload">Upload</div>
          <div class="tw-segment-highlight" style="width: 50%; left: 0;"></div>
        </div>
        
        <div id="tw-record-option" class="tw-fade-in">
          <p style="margin-bottom: 20px; color: var(--tw-text-secondary);">
            Use your ${isVideo ? "camera" : "microphone"} to record a ${isVideo ? "video" : "audio"} testimonial. We recommend keeping it between 30-60 seconds.
          </p>
          ${
            isVideo
              ? `
          <div class="tw-orientation-selector">
            <div class="tw-orientation-option ${userCameraChoice === "portrait" ? "active" : ""}" data-orientation="portrait">
              <div class="tw-orientation-icon">
                ${icons.portraitPhone}
              </div>
              <div class="tw-orientation-label">Portrait</div>
            </div>
            <div class="tw-orientation-option ${userCameraChoice === "landscape" ? "active" : ""}" data-orientation="landscape">
              <div class="tw-orientation-icon">
                ${icons.landscapePhone}
              </div>
              <div class="tw-orientation-label">Landscape</div>
            </div>
          </div>
          `
              : ""
          }
          <button class="tw-btn primary" id="tw-start-record-btn" style="margin: 0 auto;">
            <span>${isVideo ? icons.camera : icons.mic}</span>
            <span>Start Recording</span>
          </button>
        </div>
        
        <div id="tw-upload-option" class="tw-fade-in" style="display: none;">
          <div class="tw-upload-container" id="tw-media-upload-container">
            <div class="tw-upload-icon">${isVideo ? icons.fileVideo : icons.fileAudio}</div>
            <div class="tw-upload-title">Upload ${isVideo ? "Video" : "Audio"} File</div>
            <div class="tw-upload-hint">Drop your file here or click to browse</div>
            <input type="file" class="tw-upload-input" id="tw-media-file" accept="${isVideo ? "video/*" : "audio/*"}">
          </div>
          
          <div id="tw-media-preview-container" style="display: none; margin-top: 20px;">
          </div>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-back-btn">
        <span>${icons.chevronLeft}</span>
        <span>Back</span>
      </button>
      <button class="tw-btn primary" id="tw-next-btn" style="display: none;">
        <span>Next</span>
        <span>${icons.chevronRight}</span>
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-back-btn")
      .addEventListener("click", renderMethodStep);

    document
      .getElementById("tw-start-record-btn")
      .addEventListener("click", renderRecordStep);

    // Orientation selector for video
    if (isVideo) {
      document.querySelectorAll(".tw-orientation-option").forEach((option) => {
        option.addEventListener("click", (e) => {
          const orientation = option.dataset.orientation;
          userCameraChoice = orientation;

          // Update active state
          document.querySelectorAll(".tw-orientation-option").forEach((opt) => {
            opt.classList.remove("active");
          });
          option.classList.add("active");
        });
      });
    }

    // File upload handler
    const mediaFileInput = document.getElementById("tw-media-file");
    mediaFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadedMediaFile = e.target.files[0];
        const previewContainer = document.getElementById(
          "tw-media-preview-container"
        );
        previewContainer.style.display = "block";

        if (isVideo) {
          previewContainer.innerHTML = `
            <div class="tw-player">
              <video id="tw-uploaded-video" class="tw-player-video ${userCameraChoice === "portrait" ? "portrait" : ""}" controls>
                <source src="${URL.createObjectURL(uploadedMediaFile)}" type="${uploadedMediaFile.type}">
              </video>
              <div class="tw-player-controls">
                <div class="tw-uploaded-action" id="tw-remove-media" style="background-color: #E11D48;">
                  ${icons.trash}
                </div>
              </div>
            </div>
          `;
        } else {
          previewContainer.innerHTML = `
            <div class="tw-player">
              <div class="tw-player-audio">
                <audio id="tw-uploaded-audio" style="width: 100%;" controls>
                  <source src="${URL.createObjectURL(uploadedMediaFile)}" type="${uploadedMediaFile.type}">
                </audio>
              </div>
              <div class="tw-player-controls">
                <div class="tw-uploaded-action" id="tw-remove-media" style="background-color: #E11D48;">
                  ${icons.trash}
                </div>
              </div>
            </div>
          `;
        }

        // Show next button
        document.getElementById("tw-next-btn").style.display = "flex";

        // Add remove media handler
        document
          .getElementById("tw-remove-media")
          .addEventListener("click", () => {
            uploadedMediaFile = null;
            document.getElementById(
              "tw-media-preview-container"
            ).style.display = "none";
            document.getElementById("tw-media-file").value = "";
            document.getElementById("tw-next-btn").style.display = "none";
          });
      }
    });

    // Segment control
    const segments = document.querySelectorAll(".tw-segment");
    const highlight = document.querySelector(".tw-segment-highlight");
    const recordOption = document.getElementById("tw-record-option");
    const uploadOption = document.getElementById("tw-upload-option");

    segments.forEach((segment, index) => {
      segment.addEventListener("click", () => {
        // Update active state
        segments.forEach((s) => s.classList.remove("active"));
        segment.classList.add("active");

        // Move highlight
        highlight.style.width = "50%";
        highlight.style.left = `${index * 50}%`;

        // Show relevant content
        if (segment.dataset.option === "record") {
          recordOption.style.display = "block";
          uploadOption.style.display = "none";
          document.getElementById("tw-next-btn").style.display = "none";
        } else {
          recordOption.style.display = "none";
          uploadOption.style.display = "block";
          document.getElementById("tw-next-btn").style.display =
            uploadedMediaFile ? "flex" : "none";
        }
      });
    });

    // Next button for upload path
    document.getElementById("tw-next-btn").addEventListener("click", () => {
      if (uploadedMediaFile) {
        renderTitleStep();
      }
    });
  };

  // Render recording step
  const renderRecordStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    const isVideo = authorInfo.mediaType === "video";
    const recorderClass = isVideo
      ? userCameraChoice === "portrait"
        ? "portrait"
        : ""
      : "audio";

    contentEl.innerHTML = `
      <div class="tw-step">
        <div class="tw-recorder ${recorderClass}" id="tw-recorder">
          ${isVideo ? '<video id="tw-video-preview" class="tw-video-preview" autoplay muted playsinline></video>' : ""}
          
          <div class="tw-recorder-overlay">
            <div class="tw-question" id="tw-current-question">
              ${suggestedQuestions[currentQuestionIndex]}
            </div>
            <div class="tw-recorder-hint">
              Answer naturally in 30-60 seconds
            </div>
          </div>
          
          ${
            !isVideo
              ? `<div class="tw-visualizer" id="tw-visualizer">
            ${Array(30)
              .fill()
              .map(
                () =>
                  `<div class="tw-visualizer-bar" style="height: 10px;"></div>`
              )
              .join("")}
          </div>`
              : ""
          }
          
          <div class="tw-recording-indicator" id="tw-recording-indicator" style="display: none;">
            <div class="tw-recording-dot"></div>
            <div id="tw-recording-time">00:00</div>
          </div>
          
          <div class="tw-countdown" id="tw-countdown" style="display: none;">
            <div class="tw-countdown-number">3</div>
          </div>
          
          <div class="tw-ai-hint"></div>
          <div class="tw-ai-typing"></div>
          
          <div class="tw-connection-status">
            <div class="tw-connection-indicator"></div>
            <div class="tw-connection-text">Connecting...</div>
          </div>
        </div>
        
        <div class="tw-controls" id="tw-controls">
          <button class="tw-control-btn primary record" id="tw-start-recording">
            ${icons.record}
          </button>
        </div>
        
        ${
          config.showTranscription
            ? `
        <div class="tw-transcript" id="tw-transcript">
          <div id="tw-transcript-text">Your speech will appear here as you speak...</div>
        </div>
        
        <div class="tw-questions">
          <h4 class="tw-label" style="margin-top: 20px;">Suggested topics:</h4>
          <div class="tw-question-suggestions">
            ${suggestedQuestions
              .map(
                (question, index) => `
              <div class="tw-question-suggestion ${index === currentQuestionIndex ? "active" : ""}" data-index="${index}">
                ${question}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-back-btn">
        <span>${icons.chevronLeft}</span>
        <span>Back</span>
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-back-btn")
      .addEventListener("click", renderMediaOptionStep);
    document
      .getElementById("tw-start-recording")
      .addEventListener("click", startCountdown);

    // Connect to WebSocket
    connectWebSocket();

    // Initialize media
    initMedia();

    // Add event listeners to question suggestions
    document.querySelectorAll(".tw-question-suggestion").forEach((question) => {
      question.addEventListener("click", () => {
        const index = parseInt(question.dataset.index);
        currentQuestionIndex = index;
        document.getElementById("tw-current-question").textContent =
          suggestedQuestions[index];

        // Update active states
        document.querySelectorAll(".tw-question-suggestion").forEach((q) => {
          q.classList.remove("active");
        });
        question.classList.add("active");
      });
    });
  };

  // Initialize media stream
  const initMedia = async () => {
    try {
      const isVideo = authorInfo.mediaType === "video";

      // Set up constraints based on user choice for video
      let videoConstraints = false;
      if (isVideo) {
        videoConstraints = {
          facingMode: "user",
        };

        // Adjust aspect ratio based on orientation choice
        if (userCameraChoice === "portrait") {
          videoConstraints.width = { ideal: 480 };
          videoConstraints.height = { ideal: 640 };
          videoConstraints.aspectRatio = { ideal: 0.75 };
        } else {
          videoConstraints.width = { ideal: 1280 };
          videoConstraints.height = { ideal: 720 };
          videoConstraints.aspectRatio = { ideal: 16 / 9 };
        }
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: videoConstraints,
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (isVideo) {
        const videoEl = document.getElementById("tw-video-preview");
        if (videoEl) {
          videoEl.srcObject = mediaStream;
        }
      } else {
        setupAudioVisualizer();
      }

      return true;
    } catch (err) {
      console.error("Error accessing media devices:", err);

      let errorMessage =
        "Unable to access your camera/microphone. Please check your permissions and try again.";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Permission to use camera/microphone was denied. Please enable permissions in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage =
          "No camera/microphone found. Please connect a device and try again.";
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "Camera/microphone is already in use by another application. Please close other applications and try again.";
      }

      alert(errorMessage);
      return false;
    }
  };

  // Set up audio visualizer for audio recording
  const setupAudioVisualizer = () => {
    if (!mediaStream) return;

    try {
      // Create audio context
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      audioAnalyser = audioContext.createAnalyser();

      // Configure analyser
      audioAnalyser.fftSize = 256;
      source.connect(audioAnalyser);
      audioDataArray = new Uint8Array(audioAnalyser.frequencyBinCount);

      // Start visualization loop
      updateVisualization();
    } catch (err) {
      console.error("Error setting up audio visualizer:", err);
    }
  };

  // Update audio visualization
  const updateVisualization = () => {
    if (!audioAnalyser || !audioDataArray) {
      return;
    }

    // Get frequency data
    audioAnalyser.getByteFrequencyData(audioDataArray);

    const visualizer = document.getElementById("tw-visualizer");
    if (visualizer) {
      const bars = visualizer.querySelectorAll(".tw-visualizer-bar");
      let totalAmplitude = 0;

      // Update height of each bar
      for (let i = 0; i < bars.length; i++) {
        const barIndex = Math.floor(i * (audioDataArray.length / bars.length));
        const barHeight = (audioDataArray[barIndex] / 255) * 100;
        bars[i].style.height = `${Math.max(4, barHeight)}%`;

        // Color variation based on frequency
        const hue = 220 + (barHeight / 100) * 40;
        bars[i].style.backgroundColor = `hsl(${hue}, 90%, 60%)`;

        totalAmplitude += audioDataArray[barIndex];
      }

      // Check if user is speaking (used for pause detection)
      const avgAmplitude = totalAmplitude / audioDataArray.length;
      const newIsUserSpeaking = avgAmplitude > 30; // Threshold for speech

      if (newIsUserSpeaking && !isUserSpeaking) {
        // User started speaking
        isUserSpeaking = true;
        lastVoiceActivityTime = Date.now();
      } else if (!newIsUserSpeaking && isUserSpeaking) {
        // User stopped speaking
        isUserSpeaking = false;
      } else if (isUserSpeaking) {
        // User is still speaking, update timestamp
        lastVoiceActivityTime = Date.now();
      }
    }

    // Continue loop
    animationFrame = requestAnimationFrame(updateVisualization);
  };

  // Detect pauses in speech
  const startPauseDetection = () => {
    if (pauseDetectionInterval) {
      clearInterval(pauseDetectionInterval);
    }

    pauseDetectionInterval = setInterval(() => {
      if (
        !isUserSpeaking &&
        Date.now() - lastVoiceActivityTime > silenceThreshold
      ) {
        // Send pause detected message via WebSocket
        if (
          websocketConnection &&
          mediaRecorder &&
          mediaRecorder.state === "recording"
        ) {
          const pauseDuration = (Date.now() - lastVoiceActivityTime) / 1000;
          sendWebSocketMessage({
            type: "pause_detected",
            sessionId: sessionId,
            duration: pauseDuration,
          });

          // Reset timer to prevent spamming
          lastVoiceActivityTime = Date.now();
        }
      }
    }, 1000);
  };

  // Start countdown before recording
  const startCountdown = () => {
    const countdownEl = document.getElementById("tw-countdown");
    if (!countdownEl) return;

    countdownEl.style.display = "flex";
    let count = 3;
    countdownEl.querySelector(".tw-countdown-number").textContent = count;

    const countdownInterval = setInterval(() => {
      count--;

      if (count <= 0) {
        clearInterval(countdownInterval);
        countdownEl.style.display = "none";
        startRecording();
      } else {
        countdownEl.querySelector(".tw-countdown-number").textContent = count;
      }
    }, 1000);
  };

  // Start recording
  const startRecording = () => {
    if (!mediaStream) return;

    recordedChunks = [];

    const isVideo = authorInfo.mediaType === "video";
    const options = { mimeType: isVideo ? "video/webm" : "audio/webm" };

    try {
      mediaRecorder = new MediaRecorder(mediaStream, options);

      // Show recording indicator
      const indicator = document.getElementById("tw-recording-indicator");
      if (indicator) {
        indicator.style.display = "flex";
      }

      // Update controls
      const controls = document.getElementById("tw-controls");
      if (controls) {
        controls.innerHTML = `
          <button class="tw-control-btn" id="tw-pause-recording">
            ${icons.pause}
          </button>
          <button class="tw-control-btn danger" id="tw-stop-recording">
            ${icons.stop}
          </button>
        `;

        document
          .getElementById("tw-pause-recording")
          .addEventListener("click", pauseRecording);
        document
          .getElementById("tw-stop-recording")
          .addEventListener("click", stopRecording);
      }

      // Stream chunks to WebSocket
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Store locally for playback
          recordedChunks.push(event.data);

          // Stream to server via WebSocket if connected
          if (
            websocketConnection &&
            websocketConnection.readyState === WebSocket.OPEN
          ) {
            // Only send if enough time has passed since last chunk
            const now = Date.now();
            if (now - lastChunkTime >= 250) {
              // Control rate of chunks
              lastChunkTime = now;

              // Convert blob to base64 and send
              const reader = new FileReader();
              reader.onloadend = function () {
                const base64data = reader.result.split(",")[1];

                // Send chunk to server
                sendWebSocketMessage({
                  type: "media_chunk",
                  sessionId: sessionId,
                  mediaType: authorInfo.mediaType,
                  data: base64data,
                  timestamp: now,
                  isLastChunk: false,
                });
              };
              reader.readAsDataURL(event.data);
            }
          }
        }
      };

      // Start recording with small chunk size for real-time processing
      mediaRecorder.start(config.chunkInterval);

      // Start recording timer
      recordingTime = 0;
      recordingTimer = setInterval(() => {
        recordingTime++;

        // Update time display
        const timeEl = document.getElementById("tw-recording-time");
        if (timeEl) {
          timeEl.textContent = formatTime(recordingTime);
        }

        // Auto-stop if reached maximum duration
        if (recordingTime >= config.maxDuration) {
          stopRecording();
        }
      }, 1000);

      // Show transcript if enabled
      if (config.showTranscription) {
        const transcriptEl = document.getElementById("tw-transcript");
        if (transcriptEl) {
          transcriptEl.style.display = "block";
        }
      }

      // Start pause detection
      startPauseDetection();
    } catch (err) {
      console.error("Error starting recording:", err);
      alert(
        "Unable to start recording. Please try again or use a different browser."
      );
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();

      if (recordingTimer) {
        clearInterval(recordingTimer);
      }

      if (pauseDetectionInterval) {
        clearInterval(pauseDetectionInterval);
      }

      // Update controls
      const controls = document.getElementById("tw-controls");
      if (controls) {
        controls.innerHTML = `
          <button class="tw-control-btn primary" id="tw-resume-recording">
            ${icons.play}
          </button>
          <button class="tw-control-btn danger" id="tw-stop-recording">
            ${icons.stop}
            </button>
        `;

        document
          .getElementById("tw-resume-recording")
          .addEventListener("click", resumeRecording);
        document
          .getElementById("tw-stop-recording")
          .addEventListener("click", stopRecording);
      }

      // Pause recording indicator animation
      const indicator = document.getElementById("tw-recording-indicator");
      if (indicator) {
        indicator.querySelector(".tw-recording-dot").style.animationPlayState =
          "paused";
      }

      // Notify WebSocket that recording is paused
      sendWebSocketMessage({
        type: "recording_paused",
        sessionId: sessionId,
      });
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();

      // Restart recording timer
      recordingTimer = setInterval(() => {
        recordingTime++;

        // Update time display
        const timeEl = document.getElementById("tw-recording-time");
        if (timeEl) {
          timeEl.textContent = formatTime(recordingTime);
        }

        // Auto-stop if reached maximum duration
        if (recordingTime >= config.maxDuration) {
          stopRecording();
        }
      }, 1000);

      // Update controls
      const controls = document.getElementById("tw-controls");
      if (controls) {
        controls.innerHTML = `
          <button class="tw-control-btn" id="tw-pause-recording">
            ${icons.pause}
          </button>
          <button class="tw-control-btn danger" id="tw-stop-recording">
            ${icons.stop}
          </button>
        `;

        document
          .getElementById("tw-pause-recording")
          .addEventListener("click", pauseRecording);
        document
          .getElementById("tw-stop-recording")
          .addEventListener("click", stopRecording);
      }

      // Resume recording indicator animation
      const indicator = document.getElementById("tw-recording-indicator");
      if (indicator) {
        indicator.querySelector(".tw-recording-dot").style.animationPlayState =
          "running";
      }

      // Restart pause detection
      startPauseDetection();

      // Notify WebSocket that recording is resumed
      sendWebSocketMessage({
        type: "recording_resumed",
        sessionId: sessionId,
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (
      mediaRecorder &&
      (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")
    ) {
      mediaRecorder.stop();

      if (recordingTimer) {
        clearInterval(recordingTimer);
      }

      if (pauseDetectionInterval) {
        clearInterval(pauseDetectionInterval);
      }

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      // Stop all tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      // Notify WebSocket that recording is complete
      sendWebSocketMessage({
        type: "recording_complete",
        sessionId: sessionId,
        duration: recordingTime,
        transcript: transcriptText,
      });

      // Move to title step if we have recording
      if (recordedChunks.length > 0) {
        renderTitleStep();
      }
    }
  };

  // Render title step (after recording or upload)
  const renderTitleStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    const isVideo = authorInfo.mediaType === "video";
    const isRecorded = recordedChunks.length > 0;

    let mediaUrl = "";
    let mediaBlob = null;

    if (isRecorded) {
      mediaBlob = new Blob(recordedChunks, {
        type: isVideo ? "video/webm" : "audio/webm",
      });
      mediaUrl = URL.createObjectURL(mediaBlob);
    } else if (uploadedMediaFile) {
      mediaUrl = URL.createObjectURL(uploadedMediaFile);
    }

    contentEl.innerHTML = `
      <div class="tw-step">
        <h3 class="tw-label" style="font-size: 19px; margin-bottom: 20px; font-weight: 600;">Review your ${isVideo ? "video" : "audio"}</h3>
        
        <div class="tw-player">
          ${
            isVideo
              ? `<video id="tw-review-video" class="tw-player-video ${userCameraChoice === "portrait" ? "portrait" : ""}" controls>
                   <source src="${mediaUrl}" type="${isRecorded ? "video/webm" : uploadedMediaFile.type}">
                 </video>`
              : `<div class="tw-player-audio">
                   <audio id="tw-review-audio" style="width: 100%;" controls>
                     <source src="${mediaUrl}" type="${isRecorded ? "audio/webm" : uploadedMediaFile.type}">
                   </audio>
                 </div>`
          }
          
          <div class="tw-player-controls">
            <button class="tw-btn secondary" id="tw-play-btn" style="padding: 8px; min-width: auto;">
              ${icons.play}
            </button>
            
            <div class="tw-progress" id="tw-progress">
              <div class="tw-progress-inner" id="tw-progress-inner" style="width: 0%;"></div>
            </div>
            
            <div class="tw-player-time" id="tw-player-time">00:00 / ${isRecorded ? formatTime(recordingTime) : "00:00"}</div>
          </div>
        </div>
        
        <div class="tw-form-group" style="margin-top: 25px;">
          <label class="tw-label" for="tw-testimonial-title">Title</label>
          <input class="tw-input" type="text" id="tw-testimonial-title" placeholder="Give your testimonial a title" value="${isRecorded && transcriptText.trim() ? generateTitleFromTranscript(transcriptText) : ""}">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-testimonial-description">Description (Optional)</label>
          <textarea class="tw-textarea" id="tw-testimonial-description" placeholder="Add any additional context or details about your testimonial">${isRecorded ? transcriptText : ""}</textarea>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-back-btn">
        <span>${icons.chevronLeft}</span>
        <span>Back</span>
      </button>
      
      <button class="tw-btn primary" id="tw-submit-btn">
        <span>${icons.check}</span>
        <span>Submit</span>
      </button>
    `;

    // Add event listeners
    document.getElementById("tw-back-btn").addEventListener("click", () => {
      if (isRecorded) {
        renderRecordStep();
      } else {
        renderMediaOptionStep();
      }
    });

    document.getElementById("tw-submit-btn").addEventListener("click", () => {
      authorInfo.title =
        document.getElementById("tw-testimonial-title").value ||
        "My Testimonial";
      authorInfo.description =
        document.getElementById("tw-testimonial-description").value || "";

      submitMediaTestimonial();
    });

    // Set up media player
    const mediaEl = isVideo
      ? document.getElementById("tw-review-video")
      : document.getElementById("tw-review-audio");

    if (mediaEl) {
      // Update progress bar during playback
      mediaEl.addEventListener("timeupdate", () => {
        const progress = (mediaEl.currentTime / mediaEl.duration) * 100;
        document.getElementById("tw-progress-inner").style.width =
          `${progress}%`;

        document.getElementById("tw-player-time").textContent =
          `${formatTime(Math.floor(mediaEl.currentTime))} / ${formatTime(Math.floor(mediaEl.duration))}`;
      });

      // mediaEl.addEventListener("loadedmetadata", () => {
      //   document.getElementById("tw-player-time").textContent =
      //     `00:00 / ${formatTime(Math.floor(mediaEl.duration))}`;
      // });

      // Add click handler for progress bar
      document.getElementById("tw-progress").addEventListener("click", (e) => {
        const progressBar = document.getElementById("tw-progress");
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        mediaEl.currentTime = pos * mediaEl.duration;
      });

      // Play/pause button
      document.getElementById("tw-play-btn").addEventListener("click", () => {
        if (mediaEl.paused) {
          mediaEl.play();
          document.getElementById("tw-play-btn").innerHTML = icons.pause;
        } else {
          mediaEl.pause();
          document.getElementById("tw-play-btn").innerHTML = icons.play;
        }
      });

      // Update play button when media state changes
      mediaEl.addEventListener("play", () => {
        document.getElementById("tw-play-btn").innerHTML = icons.pause;
      });

      mediaEl.addEventListener("pause", () => {
        document.getElementById("tw-play-btn").innerHTML = icons.play;
      });
    }
  };

  // Generate a title from transcript
  const generateTitleFromTranscript = (transcript) => {
    if (!transcript || transcript.length < 10) return "";

    // Take first 8-10 words from transcript
    const words = transcript.split(" ");
    const titleWords = words.slice(0, Math.min(10, words.length));
    let title = titleWords.join(" ");

    // Add ellipsis if truncated
    if (words.length > 10) {
      title += "...";
    }

    return title;
  };

  // Render text testimonial step
  const renderTextStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    contentEl.innerHTML = `
      <div class="tw-step">
        <h3 class="tw-label" style="font-size: 19px; margin-bottom: 20px; font-weight: 600;">
          Write Your Testimonial
        </h3>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-testimonial-title">Title</label>
          <input class="tw-input" type="text" id="tw-testimonial-title" placeholder="Summarize your experience in a title">
        </div>
        
        <div class="tw-form-group">
          <label class="tw-label" for="tw-testimonial-text">Your Experience</label>
          <textarea class="tw-textarea" id="tw-testimonial-text" placeholder="Share your experience here..."></textarea>
        </div>
        
        <div class="tw-questions">
          <h4 class="tw-label" style="margin-bottom: 12px;">Need inspiration? Try answering:</h4>
          <div class="tw-question-suggestions">
            ${suggestedQuestions
              .map(
                (question, index) => `
              <div class="tw-question-suggestion">
                ${question}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn secondary" id="tw-back-btn">
        <span>${icons.chevronLeft}</span>
        <span>Back</span>
      </button>
      
      <button class="tw-btn primary" id="tw-submit-text-btn">
        <span>${icons.check}</span>
        <span>Submit</span>
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-back-btn")
      .addEventListener("click", renderMethodStep);

    document
      .getElementById("tw-submit-text-btn")
      .addEventListener("click", () => {
        const title = document.getElementById("tw-testimonial-title").value;
        const text = document.getElementById("tw-testimonial-text").value;

        if (!text) {
          alert("Please enter your testimonial");
          return;
        }

        // Save text testimonial
        authorInfo.title = title || "My Testimonial";
        authorInfo.text = text;

        // Submit text testimonial
        submitTextTestimonial();
      });

    // Add event listeners for question suggestions
    document.querySelectorAll(".tw-question-suggestion").forEach((question) => {
      question.addEventListener("click", () => {
        const textarea = document.getElementById("tw-testimonial-text");
        const questionText = question.textContent.trim();

        // Add the question as a prompt
        if (textarea.value) {
          textarea.value += `\n\n${questionText}\n`;
        } else {
          textarea.value = `${questionText}\n`;
        }

        textarea.focus();

        // Set cursor position after the added text
        const cursorPosition = textarea.value.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      });
    });
  };

  // Render thank you step
  const renderThankYouStep = () => {
    const contentEl = document.querySelector(".tw-content");
    const footerEl = document.querySelector(".tw-footer");

    contentEl.innerHTML = `
      <div class="tw-step">
        <div class="tw-thankyou">
          <div class="tw-thankyou-icon">
            ${icons.check}
          </div>
          
          <h3 class="tw-thankyou-title">Thank You!</h3>
          
          <p class="tw-thankyou-message">
            Your testimonial has been submitted successfully. We truly appreciate you taking the time
            to share your experience with us. Your feedback helps others learn about our offerings.
          </p>
          
          <button class="tw-btn primary" id="tw-share-btn" style="margin: 0 auto;">
            <span>${icons.messageSquare}</span>
            <span>Share with Friends</span>
          </button>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button class="tw-btn primary" id="tw-close-btn">
        Close
      </button>
    `;

    // Add event listeners
    document
      .getElementById("tw-close-btn")
      .addEventListener("click", closeWidget);

    document.getElementById("tw-share-btn").addEventListener("click", () => {
      // Create sharing options - in a real implementation this would open share dialog
      try {
        if (navigator.share) {
          navigator.share({
            title: "Share your experience",
            text: `I just shared my experience with ${config.companyName}. Share yours too!`,
            url: window.location.href,
          });
        } else {
          alert(
            "Sharing not supported on this browser. Copy this link to share: " +
              window.location.href
          );
        }
      } catch (err) {
        console.error("Error sharing:", err);
      }
    });
  };

  // Show loading state
  const showLoadingState = (message = "Loading...") => {
    // Create loading overlay if it doesn't exist
    let loadingEl = document.querySelector(".tw-loading-state");
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.className = "tw-loading-state";
      loadingEl.innerHTML = `
        <div class="tw-loading-spinner"></div>
        <div class="tw-loading-text">${message}</div>
      `;
      document.querySelector(".tw-modal").appendChild(loadingEl);
    } else {
      loadingEl.querySelector(".tw-loading-text").textContent = message;
      loadingEl.style.display = "flex";
    }
  };

  // Hide loading state
  const hideLoadingState = () => {
    const loadingEl = document.querySelector(".tw-loading-state");
    if (loadingEl) {
      loadingEl.style.display = "none";
    }
  };

  // Submit media testimonial (audio/video)
  const submitMediaTestimonial = async () => {
    const submitBtn = document.getElementById("tw-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="tw-spinner"></div><span>Submitting...</span>`;
    }

    try {
      showLoadingState("Uploading your testimonial...");

      const isVideo = authorInfo.mediaType === "video";
      const isRecorded = recordedChunks.length > 0;

      let mediaBlob;
      if (isRecorded) {
        mediaBlob = new Blob(recordedChunks, {
          type: isVideo ? "video/webm" : "audio/webm",
        });
      } else {
        mediaBlob = uploadedMediaFile;
      }

      // Create FormData
      const formData = new FormData();
      formData.append(
        "file",
        mediaBlob,
        `testimonial.${isVideo ? "webm" : "webm"}`
      );
      formData.append("campaignId", config.campaignId);
      formData.append("mediaType", authorInfo.mediaType);
      formData.append("sessionId", sessionId);

      // Add author info
      const authorData = {
        name: authorInfo.name,
        email: authorInfo.email,
        company: authorInfo.company,
        position: authorInfo.position,
        consentGiven: authorInfo.consent,
        title: authorInfo.title,
        description: authorInfo.description,
        transcript: transcriptText,
      };

      formData.append("authorInfo", JSON.stringify(authorData));

      // Add profile image if available
      if (uploadedImageFile) {
        formData.append("profileImage", uploadedImageFile);
      }

      // Upload testimonial
      const response = await fetch(`${config.apiBaseUrl}/api/testimonials`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload testimonial");
      }

      hideLoadingState();

      // Final notification via WebSocket
      sendWebSocketMessage({
        type: "testimonial_submitted",
        sessionId: sessionId,
        testimonialId: response.id || sessionId,
      });

      // Close WebSocket
      closeWebSocketConnection();

      // Show thank you
      renderThankYouStep();
    } catch (err) {
      console.error("Error submitting testimonial:", err);
      hideLoadingState();
      alert("Failed to submit testimonial. Please try again.");

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>${icons.check}</span><span>Submit</span>`;
      }
    }
  };

  // Submit text testimonial
  const submitTextTestimonial = async () => {
    const submitBtn = document.getElementById("tw-submit-text-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="tw-spinner"></div><span>Submitting...</span>`;
    }

    try {
      showLoadingState("Submitting your testimonial...");

      // Create FormData
      const formData = new FormData();
      formData.append("campaignId", config.campaignId);
      formData.append("mediaType", "text");
      formData.append("sessionId", sessionId);

      // Add author info
      const authorData = {
        name: authorInfo.name,
        email: authorInfo.email,
        company: authorInfo.company,
        position: authorInfo.position,
        consentGiven: authorInfo.consent,
        title: authorInfo.title,
        content: authorInfo.text,
      };

      formData.append("authorInfo", JSON.stringify(authorData));

      // Add profile image if available
      if (uploadedImageFile) {
        formData.append("profileImage", uploadedImageFile);
      }

      // Submit testimonial
      const response = await fetch(`${config.apiBaseUrl}/api/testimonials`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit testimonial");
      }

      hideLoadingState();

      // Show thank you
      renderThankYouStep();
    } catch (err) {
      console.error("Error submitting text testimonial:", err);
      hideLoadingState();
      alert("Failed to submit testimonial. Please try again.");

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>${icons.check}</span><span>Submit</span>`;
      }
    }
  };

  // Initialize the widget
  const init = () => {
    // Add styles
    addFonts();
    addStyles();

    // Create widget button
    const triggerBtn = document.createElement("button");
    triggerBtn.className = `tw-widget tw-button ${config.position}`;
    triggerBtn.innerHTML = `<span class="tw-button-icon">${icons.messageSquare}</span><span>${config.buttonText}</span>`;
    document.body.appendChild(triggerBtn);

    // Create modal container
    const container = document.createElement("div");
    container.className = `tw-widget tw-container`;

    container.innerHTML = `
      <div class="tw-modal">
        <div class="tw-header">
          <div class="tw-header-content">
            <div class="tw-logo">
              ${config.companyLogo ? `<img src="${config.companyLogo}" alt="${config.companyName}">` : config.companyName.substring(0, 2).toUpperCase()}
            </div>
            <h2>Share Your Experience</h2>
          </div>
          <button class="tw-close" id="tw-close-x" aria-label="Close">
            ${icons.close}
          </button>
        </div>
        <div class="tw-content">
          <!-- Content will be rendered here -->
        </div>
        <div class="tw-footer">
          <!-- Footer controls will be rendered here -->
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Add event listeners
    triggerBtn.addEventListener("click", openWidget);

    document
      .getElementById("tw-close-x")
      .addEventListener("click", closeWidget);

    // Render first step
    renderInfoStep();
  };

  // Initialize the widget
  init();
})();
