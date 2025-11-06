(function () {
  "use strict";

  // Widget version: 2.0.0 - Fixed aspect ratio handling
  window.CenphiShareWidget = window.CenphiShareWidget || {};

  // Global video manager to prevent multiple videos playing simultaneously
  const GlobalVideoManager = {
    currentPlaying: null,
    allVideos: new Set(),

    register(video) {
      this.allVideos.add(video);
      video.addEventListener("play", () => this.handlePlay(video));
      video.addEventListener("pause", () => this.handlePause(video));
    },

    handlePlay(video) {
      if (this.currentPlaying && this.currentPlaying !== video) {
        this.currentPlaying.pause();
        this.currentPlaying.currentTime = 0;
      }
      this.currentPlaying = video;
    },

    handlePause(video) {
      if (this.currentPlaying === video) {
        this.currentPlaying = null;
      }
    },

    stopAll() {
      this.allVideos.forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
      this.currentPlaying = null;
    },
  };

  // Widget instance counter for unique IDs
  let widgetCounter = 0;

  const defaultConfig = {
    apiUrl: "https://api.cenphi.io",
    embedStyle: "cinematic", // cinematic | magazine | floating | minimal
    carouselStyle: "slide", // slide | stack | fade | multiItem
    theme: "light",
    showBranding: true,
    width: "100%",
    enableAnimations: true,
    accentColor: "#3b82f6",
    mode: "single",
    carouselAutoplay: true,
    carouselInterval: 6000,
    showRating: true,
    showAvatar: true,
    compact: false,
    enableExpand: false, // DISABLED: Removed expand/collapse feature
    description: null, // NEW: Optional text description
    fontFamily: null, // NEW: Custom font family
    itemsPerView: 2, // NEW: For multi-item carousel (default 2 for better visibility)
    forceAspectRatio: false, // NEW: Force aspect ratio on videos - false (natural), "16:9", "9:16", "1:1", "4:3", etc.
    disableTracking: false, // NEW: Disable analytics tracking (for preview mode)
  };

  // FOUR dramatically different style configurations
  const embedStyles = {
    cinematic: {
      maxWidth: "420px",
      expandedMaxWidth: "680px",
      borderRadius: "20px",
      shadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
      background: "#000000",
      padding: "0",
      avatarSize: "44px",
      fontSize: "13px",
    },
    magazine: {
      maxWidth: "460px",
      expandedMaxWidth: "740px",
      borderRadius: "0",
      shadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
      background: "#ffffff",
      padding: "28px",
      avatarSize: "52px",
      fontSize: "14px",
    },
    floating: {
      maxWidth: "400px",
      expandedMaxWidth: "640px",
      borderRadius: "28px",
      shadow: "0 24px 80px rgba(0, 0, 0, 0.18)",
      background: "rgba(255, 255, 255, 0.95)",
      padding: "0",
      avatarSize: "46px",
      fontSize: "13px",
    },
    minimal: {
      maxWidth: "380px",
      expandedMaxWidth: "600px",
      borderRadius: "12px",
      shadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
      background: "#ffffff",
      padding: "24px",
      avatarSize: "38px",
      fontSize: "12px",
    },
  };

  // Initialize widget
  CenphiShareWidget.init = function (options) {
    widgetCounter++;
    const config = Object.assign({}, defaultConfig, options);
    config._instanceId = widgetCounter;
    config._isExpanded = false; // Track expansion state

    if (!config.shareId && !config.shareIds) {
      console.error("CenphiShareWidget: shareId or shareIds is required");
      return;
    }

    if (!config.container) {
      console.error("CenphiShareWidget: container is required");
      return;
    }

    const container =
      typeof config.container === "string"
        ? document.querySelector(config.container)
        : config.container;

    if (!container) {
      console.error("CenphiShareWidget: container not found");
      return;
    }

    injectGlobalStyles(config);

    if (
      config.mode === "carousel" &&
      config.shareIds &&
      config.shareIds.length > 0
    ) {
      renderCarousel(container, config);
    } else {
      const shareId = config.shareId || (config.shareIds && config.shareIds[0]);
      fetchWidgetConfig({ ...config, shareId })
        .then((data) => {
          // Check if this is a clipping artifact with multiple clips
          if (
            data.artifact &&
            data.artifact.clips &&
            Array.isArray(data.artifact.clips) &&
            data.artifact.clips.length > 0
          ) {
            // Automatically convert to carousel mode to show all clips
            config.mode = "carousel";
            config.shareIds = [shareId];
            renderCarousel(container, config);
          } else {
            // Normal single widget rendering
            renderWidget(container, data, config);
          }
        })
        .catch((err) => renderError(container, err, config));
    }
  };

  // Inject global styles (optimized)
  function injectGlobalStyles(config) {
    if (document.getElementById("cenphi-widget-styles")) return;

    const fontImport = config.fontFamily
      ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          config.fontFamily
        )}:wght@300;400;500;600;700&display=swap');`
      : `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&display=swap');`;

    const baseFontFamily =
      config.fontFamily ||
      "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

    const style = document.createElement("style");
    style.id = "cenphi-widget-styles";
    style.textContent = `
      ${fontImport}

      @keyframes cenphi-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes cenphi-slide-up {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes cenphi-scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes cenphi-spin {
        to { transform: rotate(360deg); }
      }

      .cenphi-widget-container {
        font-family: ${baseFontFamily};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        line-height: 1.5;
        transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .cenphi-widget-container * {
        box-sizing: border-box;
      }

      .cenphi-video-wrapper {
        position: relative;
        overflow: hidden;
        background: transparent;
        display: block;
        line-height: 0;
      }

      .cenphi-video-wrapper video {
        display: block;
        width: 100%;
        height: auto;
        max-width: 100%;
        object-fit: contain;
        vertical-align: top;
        background: #000;
      }

      .cenphi-play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.96);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        z-index: 10;
        backdrop-filter: blur(8px);
      }

      .cenphi-play-button:hover {
        transform: translate(-50%, -50%) scale(1.12);
        background: #fff;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.28);
      }

      .cenphi-play-button::after {
        content: '';
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 11px 0 11px 18px;
        border-color: transparent transparent transparent ${config.accentColor};
        margin-left: 3px;
      }

      /* Expand/Collapse button */
      .cenphi-expand-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 20;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }

      .cenphi-expand-btn:hover {
        transform: scale(1.1);
        background: #fff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .cenphi-expand-btn svg {
        width: 18px;
        height: 18px;
        stroke: #1e293b;
        stroke-width: 2;
        fill: none;
      }

      /* Glassmorphism effect */
      .cenphi-glass {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
      }

      .cenphi-glass-dark {
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
      }

      /* Carousel dots - always fully visible */
      .cenphi-carousel-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 16px 0;
        opacity: 1;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%);
      }

      .cenphi-carousel-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      .cenphi-carousel-dot:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: scale(1.25);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
      }

      .cenphi-carousel-dot.active {
        background: ${config.accentColor};
        width: 26px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(59, 130, 246, 0.4);
      }

      /* Mobile touch support for carousel dots */
      @media (max-width: 768px) {
        .cenphi-carousel-dots {
          padding: 18px 0;
          gap: 10px;
        }

        .cenphi-carousel-dot {
          width: 12px;
          height: 12px;
        }

        .cenphi-carousel-dot.active {
          width: 32px;
        }
      }

      /* Multi-item carousel styles */
      .cenphi-multi-carousel {
        position: relative;
        overflow: hidden;
        padding: 20px 50px;
      }

      .cenphi-multi-track {
        display: flex;
        gap: 20px;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .cenphi-multi-item {
        flex: 0 0 auto;
        opacity: 0;
        animation: cenphi-fade-in 0.5s ease forwards;
      }

      .cenphi-carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.98);
        border: 2px solid rgba(59, 130, 246, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 20;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 0 rgba(59, 130, 246, 0.4);
        backdrop-filter: blur(8px);
      }

      .cenphi-carousel-arrow:hover {
        transform: translateY(-50%) scale(1.15);
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 24px rgba(0,0,0,0.3), 0 0 0 4px rgba(59, 130, 246, 0.2);
        border-color: ${config.accentColor};
      }

      .cenphi-carousel-arrow.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.6);
      }

      .cenphi-carousel-arrow.disabled:hover {
        transform: translateY(-50%);
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      .cenphi-carousel-arrow-prev { left: 12px; }
      .cenphi-carousel-arrow-next { right: 12px; }

      .cenphi-carousel-arrow svg {
        width: 22px;
        height: 22px;
        stroke: ${config.accentColor};
        stroke-width: 2.5;
        fill: none;
      }

      .cenphi-stars {
        display: inline-flex;
        gap: 1px;
        color: #f59e0b;
        font-size: 13px;
      }

      .cenphi-avatar {
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      @media (max-width: 768px) {
        .cenphi-widget-container { max-width: 100% !important; }
        .cenphi-play-button { width: 52px; height: 52px; }
        .cenphi-multi-carousel { padding: 20px 40px; }
        .cenphi-carousel-arrow { width: 36px; height: 36px; }
      }

      @media (max-width: 480px) {
        .cenphi-multi-carousel { padding: 20px 35px; }
        .cenphi-carousel-arrow { width: 32px; height: 32px; }
        .cenphi-carousel-arrow svg { width: 16px; height: 16px; }
      }

      @media print {
        .cenphi-carousel-dots,
        .cenphi-carousel-arrow,
        .cenphi-play-button,
        .cenphi-expand-btn { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // Fetch widget configuration
  async function fetchWidgetConfig(config) {
    const url = `${config.apiUrl}/widget/config/${config.shareId}`;
    return fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      if (!response.ok) throw new Error("Failed to load content");
      return response.json();
    });
  }

  // Expand clipping artifacts into individual clips
  function expandClipsInData(allData) {
    const expanded = [];

    allData.forEach((data) => {
      // Check if this is a clipping artifact with clips array
      if (
        data.artifact &&
        data.artifact.clips &&
        Array.isArray(data.artifact.clips)
      ) {
        // Expand each clip into a separate item
        data.artifact.clips.forEach((clip, index) => {
          expanded.push({
            ...data,
            // Create a new artifact object for this clip
            artifact: {
              id: clip.id || `${data.artifact.id}-clip-${index}`,
              processing_type: "clip",
              content_type: "video/mp4",
              asset_url: clip.url,
              text_content: clip.title || clip.theme || null,
              created_at: data.artifact.created_at,
              // Preserve clip metadata
              _clip_data: {
                title: clip.title,
                theme: clip.theme,
                duration: clip.duration,
                clip_index: index,
              },
            },
            share_id: data.share_id,
            testimonial: data.testimonial, // Preserve testimonial if exists
          });
        });
      } else {
        // Not a clipping artifact, keep as is
        expanded.push(data);
      }
    });

    return expanded;
  }

  // Render carousel
  async function renderCarousel(container, config) {
    container.innerHTML = "";
    container.className =
      "cenphi-widget-container cenphi-carousel" +
      (config.compact ? " cenphi-compact" : "");

    const style = embedStyles[config.embedStyle] || embedStyles.cinematic;

    // Multi-item carousel has different max-width
    const maxWidth =
      config.carouselStyle === "multiItem"
        ? "1200px"
        : config.compact
        ? "360px"
        : style.maxWidth;

    container.style.cssText = `
      width: ${config.width};
      max-width: ${maxWidth};
      margin: 0 auto;
      position: relative;
    `;

    container.innerHTML = `
      <div style="
        padding: 60px 20px;
        text-align: center;
        background: #f8fafc;
        border-radius: ${style.borderRadius};
      ">
        <div style="
          width: 26px;
          height: 26px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: ${config.accentColor};
          border-radius: 50%;
          margin: 0 auto 10px;
          animation: cenphi-spin 0.7s linear infinite;
        "></div>
        <div style="font-size: 13px; color: #64748b; font-weight: 500;">Loading testimonials...</div>
      </div>
    `;

    try {
      const promises = config.shareIds.map((id) =>
        fetchWidgetConfig({ ...config, shareId: id })
      );
      let allData = await Promise.all(promises);

      // Expand clipping artifacts into individual clips for carousel display
      allData = expandClipsInData(allData);

      // Add carousel style switcher ONLY in preview mode (when disableTracking is true)
      // For external embeds, directly render the selected carousel style
      if (allData.length > 1 && config.disableTracking === true) {
        addCarouselStyleSwitcher(container, allData, config, style);
      } else {
        // Direct render without switcher (for external embeds or single item)
        if (config.carouselStyle === "slide") {
          renderSlideCarousel(container, allData, config, style);
        } else if (config.carouselStyle === "stack") {
          renderStackCarousel(container, allData, config, style);
        } else if (config.carouselStyle === "fade") {
          renderFadeCarousel(container, allData, config, style);
        } else if (config.carouselStyle === "multiItem") {
          renderMultiItemCarousel(container, allData, config, style);
        }
      }
    } catch (err) {
      renderError(container, err, config);
    }
  }

  // Add carousel style switcher
  function addCarouselStyleSwitcher(container, allData, config, style) {
    const switcherWrapper = document.createElement("div");
    switcherWrapper.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: rgba(248, 250, 252, 0.95);
      border-radius: ${style.borderRadius} ${style.borderRadius} 0 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    `;

    const styles = [
      { key: "slide", label: "Slide", icon: "→" },
      { key: "stack", label: "Stack", icon: "⬚" },
      { key: "fade", label: "Fade", icon: "◐" },
      { key: "multiItem", label: "Grid", icon: "▦" },
    ];

    const carouselContentWrapper = document.createElement("div");
    carouselContentWrapper.style.cssText = "position: relative;";

    styles.forEach(({ key, label, icon }) => {
      const btn = document.createElement("button");
      btn.className = `cenphi-style-btn ${
        config.carouselStyle === key ? "active" : ""
      }`;
      btn.innerHTML = `<span style="font-size: 14px; margin-right: 4px;">${icon}</span>${label}`;
      btn.style.cssText = `
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid ${
          config.carouselStyle === key ? config.accentColor : "rgba(0,0,0,0.1)"
        };
        background: ${
          config.carouselStyle === key ? config.accentColor : "#ffffff"
        };
        color: ${config.carouselStyle === key ? "#ffffff" : "#64748b"};
        font-size: 11px;
        font-weight: ${config.carouselStyle === key ? "600" : "500"};
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      `;

      btn.addEventListener("mouseenter", function () {
        if (config.carouselStyle !== key) {
          this.style.borderColor = config.accentColor;
          this.style.background = `${config.accentColor}15`;
        }
      });

      btn.addEventListener("mouseleave", function () {
        if (config.carouselStyle !== key) {
          this.style.borderColor = "rgba(0,0,0,0.1)";
          this.style.background = "#ffffff";
        }
      });

      btn.addEventListener("click", () => {
        config.carouselStyle = key;
        carouselContentWrapper.innerHTML = "";

        // Re-render carousel with new style
        if (key === "slide") {
          renderSlideCarousel(carouselContentWrapper, allData, config, style);
        } else if (key === "stack") {
          renderStackCarousel(carouselContentWrapper, allData, config, style);
        } else if (key === "fade") {
          renderFadeCarousel(carouselContentWrapper, allData, config, style);
        } else if (key === "multiItem") {
          renderMultiItemCarousel(
            carouselContentWrapper,
            allData,
            config,
            style
          );
        }

        // Update button states
        switcherWrapper.querySelectorAll("button").forEach((b, i) => {
          const isActive = styles[i].key === key;
          b.style.borderColor = isActive
            ? config.accentColor
            : "rgba(0,0,0,0.1)";
          b.style.background = isActive ? config.accentColor : "#ffffff";
          b.style.color = isActive ? "#ffffff" : "#64748b";
          b.style.fontWeight = isActive ? "600" : "500";
        });

        // Update container max-width for multiItem
        const maxWidth =
          key === "multiItem"
            ? "1200px"
            : config.compact
            ? "360px"
            : style.maxWidth;
        container.style.maxWidth = maxWidth;
      });

      switcherWrapper.appendChild(btn);
    });

    // Initial render
    if (config.carouselStyle === "slide") {
      renderSlideCarousel(carouselContentWrapper, allData, config, style);
    } else if (config.carouselStyle === "stack") {
      renderStackCarousel(carouselContentWrapper, allData, config, style);
    } else if (config.carouselStyle === "fade") {
      renderFadeCarousel(carouselContentWrapper, allData, config, style);
    } else if (config.carouselStyle === "multiItem") {
      renderMultiItemCarousel(carouselContentWrapper, allData, config, style);
    }

    container.innerHTML = "";
    container.appendChild(switcherWrapper);
    container.appendChild(carouselContentWrapper);
  }

  // Slide Carousel
  function renderSlideCarousel(container, allData, config, style) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
    position: relative;
    border-radius: ${style.borderRadius};
    box-shadow: ${style.shadow};
    padding-bottom: 60px;
  `;

    allData.forEach((data, idx) => {
      const item = document.createElement("div");
      item.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      background: ${style.background};
      border-radius: ${style.borderRadius};
      overflow: hidden;
      opacity: ${idx === 0 ? 1 : 0};
      visibility: ${idx === 0 ? "visible" : "hidden"};
      transition: opacity 0.4s ease, visibility 0.4s ease;
      z-index: ${idx === 0 ? 1 : 0};
    `;
      item.setAttribute("data-index", idx);
      renderWidgetContent(item, data, config, true);
      wrapper.appendChild(item);
    });

    // Create a spacer for the first item to set initial height
    const spacer = document.createElement("div");
    spacer.style.cssText = `
      visibility: hidden;
      pointer-events: none;
    `;
    spacer.setAttribute("data-spacer", "true");
    renderWidgetContent(spacer, allData[0], config, true);
    wrapper.appendChild(spacer);

    // Create navigation arrows if more than 1 item
    if (allData.length > 1) {
      const prevArrow = document.createElement("div");
      prevArrow.className = "cenphi-carousel-arrow cenphi-carousel-arrow-prev";
      prevArrow.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    `;

      const nextArrow = document.createElement("div");
      nextArrow.className = "cenphi-carousel-arrow cenphi-carousel-arrow-next";
      nextArrow.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;

      wrapper.appendChild(prevArrow);
      wrapper.appendChild(nextArrow);

      // Pass arrows to navigation function
      addSlideNavigation(wrapper, allData, config, prevArrow, nextArrow);
    }

    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  // Stack Carousel
  function renderStackCarousel(container, allData, config, style) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position: relative;
      padding-bottom: 60px;
    `;

    allData.forEach((data, index) => {
      const item = document.createElement("div");
      const zIndex = allData.length - index;
      const offset = index * 4;
      const scale = 1 - index * 0.025;

      item.style.cssText = `
        position: absolute;
        top: ${offset}px;
        left: 0;
        right: 0;
        z-index: ${zIndex};
        transform: scale(${scale});
        transform-origin: center top;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: ${index === 0 ? 1 : 0.4};
        visibility: ${index === 0 ? "visible" : "hidden"};
        pointer-events: ${index === 0 ? "auto" : "none"};
        border-radius: ${style.borderRadius};
        background: ${style.background};
        overflow: hidden;
      `;
      item.setAttribute("data-index", index);

      renderWidgetContent(item, data, config, true);
      wrapper.appendChild(item);
    });

    // Create a spacer for the first item to set initial height
    const spacer = document.createElement("div");
    spacer.style.cssText = `
      visibility: hidden;
      pointer-events: none;
    `;
    spacer.setAttribute("data-spacer", "true");
    renderWidgetContent(spacer, allData[0], config, true);
    wrapper.appendChild(spacer);

    if (allData.length > 1) addStackNavigation(wrapper, allData, config, style);

    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  // Fade Carousel
  function renderFadeCarousel(container, allData, config, style) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position: relative;
      border-radius: ${style.borderRadius};
      box-shadow: ${style.shadow};
      padding-bottom: 60px;
    `;

    allData.forEach((data, index) => {
      const item = document.createElement("div");
      item.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        opacity: ${index === 0 ? 1 : 0};
        visibility: ${index === 0 ? "visible" : "hidden"};
        transition: opacity 0.65s ease-in-out, visibility 0.65s ease-in-out;
        pointer-events: ${index === 0 ? "auto" : "none"};
        background: ${style.background};
        border-radius: ${style.borderRadius};
        overflow: hidden;
        z-index: ${index === 0 ? 1 : 0};
      `;
      item.setAttribute("data-index", index);

      renderWidgetContent(item, data, config, true);
      wrapper.appendChild(item);
    });

    // Create a spacer for the first item to set initial height
    const spacer = document.createElement("div");
    spacer.style.cssText = `
      visibility: hidden;
      pointer-events: none;
    `;
    spacer.setAttribute("data-spacer", "true");
    renderWidgetContent(spacer, allData[0], config, true);
    wrapper.appendChild(spacer);

    if (allData.length > 1) addFadeNavigation(wrapper, allData, config);

    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  // Multi-Item Carousel with video-aware navigation and proper text display
  function renderMultiItemCarousel(container, allData, config, style) {
    const itemsPerView = Math.min(config.itemsPerView || 3, allData.length);
    const gapSize = 16; // Reduced from 24px
    const wrapper = document.createElement("div");
    wrapper.className = "cenphi-multi-carousel";
    wrapper.style.cssText = `
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: ${style.borderRadius};
      box-shadow: 0 20px 60px rgba(0,0,0,0.12);
      position: relative;
      overflow: visible;
      padding: 20px 50px;
    `;

    const trackWrapper = document.createElement("div");
    trackWrapper.style.cssText = `
      overflow: hidden;
      border-radius: 12px;
      position: relative;
      padding-bottom: 12px;
    `;

    const track = document.createElement("div");
    track.className = "cenphi-multi-track";
    track.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: ${gapSize}px;
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    `;

    allData.forEach((data, index) => {
      const item = document.createElement("div");
      item.className = "cenphi-multi-item";
      item.style.cssText = `
        flex: 0 0 calc((100% - ${
          (itemsPerView - 1) * gapSize
        }px) / ${itemsPerView});
        opacity: 0;
        transform: translateY(20px);
        animation: cenphi-fade-in 0.6s ease forwards;
        animation-delay: ${index * 0.08}s;
        border-radius: 10px;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        align-self: flex-start;
      `;
      item.setAttribute("data-index", index);

      item.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-4px)";
        this.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      });
      item.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      });

      // Create inner wrapper for content with proper background
      const contentWrapper = document.createElement("div");
      contentWrapper.style.cssText = `
        background: ${style.background};
        border-radius: 10px;
        overflow: hidden;
      `;

      renderWidgetContent(contentWrapper, data, config, true);
      item.appendChild(contentWrapper);
      track.appendChild(item);
    });

    trackWrapper.appendChild(track);
    wrapper.appendChild(trackWrapper);

    // Show navigation arrows ONLY if there are more items than can fit in view
    if (allData.length > itemsPerView) {
      addMultiItemNavigation(
        wrapper,
        track,
        trackWrapper,
        allData,
        config,
        itemsPerView,
        gapSize
      );
    }

    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  // Navigation: Slide
  function addSlideNavigation(wrapper, allData, config, prevArrow, nextArrow) {
    let currentIndex = 0;
    let autoplayInterval = null;
    let isUserPaused = false;

    const dotsWrapper = document.createElement("div");
    dotsWrapper.className = "cenphi-carousel-dots";
    allData.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = `cenphi-carousel-dot ${index === 0 ? "active" : ""}`;
      dotsWrapper.appendChild(dot);
    });

    wrapper.appendChild(dotsWrapper);

    const getAllVideos = () => wrapper.querySelectorAll("video");
    const pauseAllVideos = () => {
      getAllVideos().forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    };

    const getCurrentVideo = () => {
      const currentItem = wrapper.querySelector(
        `[data-index="${currentIndex}"]`
      );
      return currentItem ? currentItem.querySelector("video") : null;
    };

    const updateCarousel = (index) => {
      pauseAllVideos();
      currentIndex = index;

      // Update visibility of all items
      const items = wrapper.querySelectorAll("[data-index]");
      items.forEach((item, i) => {
        if (parseInt(item.getAttribute("data-index")) === index) {
          item.style.opacity = "1";
          item.style.visibility = "visible";
          item.style.zIndex = "1";
        } else {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          item.style.zIndex = "0";
        }
      });

      // Update spacer to match current item's content
      const spacer = wrapper.querySelector("[data-spacer]");
      if (spacer) {
        spacer.innerHTML = "";
        renderWidgetContent(spacer, allData[index], config, true);
      }

      const dots = dotsWrapper.querySelectorAll(".cenphi-carousel-dot");
      dots.forEach((dot, i) => {
        dot.className = `cenphi-carousel-dot ${i === index ? "active" : ""}`;
      });

      // Update arrow states
      if (prevArrow && nextArrow) {
        prevArrow.style.opacity = index === 0 ? "0.4" : "1";
        prevArrow.style.cursor = index === 0 ? "not-allowed" : "pointer";
        nextArrow.style.opacity = index === allData.length - 1 ? "0.4" : "1";
        nextArrow.style.cursor =
          index === allData.length - 1 ? "not-allowed" : "pointer";
      }

      setupAutoplay();
    };

    const advanceSlide = () => {
      const newIndex = currentIndex < allData.length - 1 ? currentIndex + 1 : 0;
      updateCarousel(newIndex);
    };

    const setupAutoplay = () => {
      clearInterval(autoplayInterval);
      autoplayInterval = null;

      if (!config.carouselAutoplay || isUserPaused) return;

      const currentVideo = getCurrentVideo();
      if (currentVideo && !currentVideo.paused) {
        currentVideo.addEventListener("ended", advanceSlide, { once: true });
      } else {
        autoplayInterval = setTimeout(advanceSlide, config.carouselInterval);
      }
    };

    // Arrow click handlers
    if (prevArrow && nextArrow) {
      prevArrow.addEventListener("click", () => {
        if (currentIndex > 0) {
          isUserPaused = false;
          updateCarousel(currentIndex - 1);
        }
      });

      nextArrow.addEventListener("click", () => {
        if (currentIndex < allData.length - 1) {
          isUserPaused = false;
          updateCarousel(currentIndex + 1);
        }
      });

      // Initialize arrow states
      prevArrow.style.opacity = "0.4";
      prevArrow.style.cursor = "not-allowed";
    }

    dotsWrapper
      .querySelectorAll(".cenphi-carousel-dot")
      .forEach((dot, index) => {
        dot.addEventListener("click", () => {
          isUserPaused = false;
          updateCarousel(index);
        });
      });

    wrapper.addEventListener("mouseenter", () => {
      isUserPaused = true;
      clearInterval(autoplayInterval);
    });

    wrapper.addEventListener("mouseleave", () => {
      isUserPaused = false;
      setupAutoplay();
    });

    // Add touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    wrapper.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isUserPaused = true;
        clearInterval(autoplayInterval);
      },
      { passive: true }
    );

    wrapper.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true }
    );

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next slide
          const nextIndex =
            currentIndex < allData.length - 1 ? currentIndex + 1 : 0;
          updateCarousel(nextIndex);
        } else {
          // Swipe right - previous slide
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : allData.length - 1;
          updateCarousel(prevIndex);
        }
      }

      // Resume autoplay after swipe
      isUserPaused = false;
      setupAutoplay();
    };

    if (config.carouselAutoplay) setupAutoplay();
  }

  // Navigation: Stack
  function addStackNavigation(wrapper, allData, config) {
    let currentIndex = 0;
    let autoplayInterval = null;

    const dotsWrapper = document.createElement("div");
    dotsWrapper.className = "cenphi-carousel-dots";
    dotsWrapper.style.cssText = "position: relative; z-index: 1000;";

    allData.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = `cenphi-carousel-dot ${index === 0 ? "active" : ""}`;
      dotsWrapper.appendChild(dot);
    });

    wrapper.appendChild(dotsWrapper);

    const updateStack = (index) => {
      currentIndex = index;
      const items = wrapper.querySelectorAll("div[data-index]");

      items.forEach((item, i) => {
        if (parseInt(item.getAttribute("data-index")) === index) {
          item.style.opacity = "1";
          item.style.visibility = "visible";
          item.style.pointerEvents = "auto";
        } else {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          item.style.pointerEvents = "none";
        }
      });

      // Update spacer to match current item's content
      const spacer = wrapper.querySelector("[data-spacer]");
      if (spacer) {
        spacer.innerHTML = "";
        renderWidgetContent(spacer, allData[index], config, true);
      }

      const dots = dotsWrapper.querySelectorAll(".cenphi-carousel-dot");
      dots.forEach((dot, i) => {
        dot.className = `cenphi-carousel-dot ${i === index ? "active" : ""}`;
      });

      if (config.carouselAutoplay) {
        clearTimeout(autoplayInterval);
        autoplayInterval = setTimeout(() => {
          updateStack((currentIndex + 1) % allData.length);
        }, config.carouselInterval);
      }
    };

    dotsWrapper
      .querySelectorAll(".cenphi-carousel-dot")
      .forEach((dot, index) => {
        dot.addEventListener("click", () => updateStack(index));
      });

    // Add touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    wrapper.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        if (config.carouselAutoplay) {
          clearTimeout(autoplayInterval);
        }
      },
      { passive: true }
    );

    wrapper.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            // Swipe left - next
            updateStack((currentIndex + 1) % allData.length);
          } else {
            // Swipe right - previous
            updateStack((currentIndex - 1 + allData.length) % allData.length);
          }
        }
      },
      { passive: true }
    );

    if (config.carouselAutoplay) {
      autoplayInterval = setTimeout(
        () => updateStack(1),
        config.carouselInterval
      );
    }
  }

  // Navigation: Fade
  function addFadeNavigation(wrapper, allData, config) {
    let currentIndex = 0;
    let autoplayInterval = null;

    const dotsWrapper = document.createElement("div");
    dotsWrapper.className = "cenphi-carousel-dots";

    allData.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = `cenphi-carousel-dot ${index === 0 ? "active" : ""}`;
      dotsWrapper.appendChild(dot);
    });

    wrapper.appendChild(dotsWrapper);

    const updateFade = (index) => {
      currentIndex = index;
      const items = wrapper.querySelectorAll("div[data-index]");

      items.forEach((item, i) => {
        if (parseInt(item.getAttribute("data-index")) === index) {
          item.style.opacity = "1";
          item.style.visibility = "visible";
          item.style.zIndex = "1";
          item.style.pointerEvents = "auto";
        } else {
          item.style.opacity = "0";
          item.style.visibility = "hidden";
          item.style.zIndex = "0";
          item.style.pointerEvents = "none";
        }
      });

      // Update spacer to match current item's content
      const spacer = wrapper.querySelector("[data-spacer]");
      if (spacer) {
        spacer.innerHTML = "";
        renderWidgetContent(spacer, allData[index], config, true);
      }

      const dots = dotsWrapper.querySelectorAll(".cenphi-carousel-dot");
      dots.forEach((dot, i) => {
        dot.className = `cenphi-carousel-dot ${i === index ? "active" : ""}`;
      });

      if (config.carouselAutoplay) {
        clearTimeout(autoplayInterval);
        autoplayInterval = setTimeout(() => {
          updateFade((currentIndex + 1) % allData.length);
        }, config.carouselInterval);
      }
    };

    dotsWrapper
      .querySelectorAll(".cenphi-carousel-dot")
      .forEach((dot, index) => {
        dot.addEventListener("click", () => updateFade(index));
      });

    // Add touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    wrapper.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        if (config.carouselAutoplay) {
          clearTimeout(autoplayInterval);
        }
      },
      { passive: true }
    );

    wrapper.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            // Swipe left - next
            updateFade((currentIndex + 1) % allData.length);
          } else {
            // Swipe right - previous
            updateFade((currentIndex - 1 + allData.length) % allData.length);
          }
        }
      },
      { passive: true }
    );

    if (config.carouselAutoplay) {
      autoplayInterval = setTimeout(
        () => updateFade(1),
        config.carouselInterval
      );
    }
  }

  // Navigation: Multi-Item with ROBUST VIDEO-AWARE arrows and pagination
  function addMultiItemNavigation(
    wrapper,
    track,
    trackWrapper,
    allData,
    config,
    itemsPerView,
    gapSize
  ) {
    let currentPosition = 0;
    const maxPosition = Math.max(0, allData.length - itemsPerView);

    // VIDEO-AWARE AUTOPLAY: State variables
    let autoplayInterval = null;
    let isUserPaused = false;

    // BULLETPROOF: Get currently visible item indices
    const getVisibleIndices = () => {
      const start = currentPosition;
      const end = Math.min(currentPosition + itemsPerView, allData.length);
      const indices = [];
      for (let i = start; i < end; i++) {
        indices.push(i);
      }
      return indices;
    };

    // BULLETPROOF: Check if ANY video in current view is playing (real-time DOM query)
    const isAnyVideoPlayingInView = () => {
      const visibleIndices = getVisibleIndices();
      for (const index of visibleIndices) {
        const item = track.querySelector(`[data-index="${index}"]`);
        if (!item) continue;

        const video = item.querySelector("video");
        if (video && !video.paused && !video.ended && video.currentTime > 0) {
          console.log(`Video playing in item ${index}`);
          return true;
        }
      }
      return false;
    };

    // BULLETPROOF: Stop and reset all videos that are NOT in current view
    const stopAllVideosOutOfView = () => {
      const visibleIndices = getVisibleIndices();
      const allItems = track.querySelectorAll("[data-index]");

      allItems.forEach((item) => {
        const itemIndex = parseInt(item.getAttribute("data-index"));
        if (!visibleIndices.includes(itemIndex)) {
          const video = item.querySelector("video");
          if (video && !video.paused) {
            console.log(`Stopping video in item ${itemIndex} (out of view)`);
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    };

    // Stylish navigation arrows
    const prevArrow = document.createElement("div");
    prevArrow.className = "cenphi-multi-arrow cenphi-multi-arrow-prev disabled";
    prevArrow.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    `;
    prevArrow.style.cssText = `
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid rgba(59, 130, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 15;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      color: ${config.accentColor};
    `;

    const nextArrow = document.createElement("div");
    nextArrow.className = `cenphi-multi-arrow cenphi-multi-arrow-next ${
      maxPosition === 0 ? "disabled" : ""
    }`;
    nextArrow.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;
    nextArrow.style.cssText = `
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid rgba(59, 130, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 15;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      color: ${config.accentColor};
    `;

    wrapper.appendChild(prevArrow);
    wrapper.appendChild(nextArrow);

    // Add hover effects
    [prevArrow, nextArrow].forEach((arrow) => {
      arrow.addEventListener("mouseenter", function () {
        if (!this.classList.contains("disabled")) {
          this.style.transform = "translateY(-50%) scale(1.1)";
          this.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.18)";
          this.style.background =
            "linear-gradient(135deg, #ffffff 0%, #ffffff 100%)";
          this.style.borderColor = config.accentColor;
        }
      });
      arrow.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(-50%)";
        this.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)";
        this.style.background =
          "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
        this.style.borderColor = "rgba(59, 130, 246, 0.2)";
      });
    });

    // Pagination dots
    const dotsWrapper = document.createElement("div");
    dotsWrapper.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 15;
    `;

    for (let i = 0; i <= maxPosition; i++) {
      const dot = document.createElement("div");
      dot.className = `cenphi-multi-dot ${i === 0 ? "active" : ""}`;
      dot.style.cssText = `
        width: ${i === 0 ? "28px" : "8px"};
        height: 8px;
        border-radius: 4px;
        background: ${
          i === 0 ? config.accentColor : "rgba(100, 116, 139, 0.3)"
        };
        cursor: pointer;
        transition: all 0.3s ease;
      `;
      // Click handler is added later with autoplay logic
      dot.addEventListener("mouseenter", function () {
        if (!this.classList.contains("active")) {
          this.style.background = "rgba(100, 116, 139, 0.5)";
        }
      });
      dot.addEventListener("mouseleave", function () {
        if (!this.classList.contains("active")) {
          this.style.background = "rgba(100, 116, 139, 0.3)";
        }
      });
      dotsWrapper.appendChild(dot);
    }
    wrapper.appendChild(dotsWrapper);

    const updatePosition = (newPosition) => {
      // BULLETPROOF: Block navigation if video is playing in CURRENT view
      // Check at the EXACT moment of navigation attempt (not cached state)
      if (newPosition !== currentPosition && isAnyVideoPlayingInView()) {
        console.log(
          "BLOCKED: Video is playing in current view. Navigation prevented."
        );

        // Show visual feedback - shake animation
        wrapper.style.animation = "none";
        setTimeout(() => {
          wrapper.style.animation = "cenphi-shake 0.3s ease";
          setTimeout(() => {
            wrapper.style.animation = "";
          }, 300);
        }, 10);
        return; // BLOCK NAVIGATION
      }

      // Navigation allowed - update position
      console.log(`Navigation: ${currentPosition} -> ${newPosition}`);

      // CRITICAL: Stop ALL videos BEFORE the slide animation starts
      // This prevents videos from being visible while sliding out
      const allVideos = track.querySelectorAll("video");
      allVideos.forEach((video) => {
        if (!video.paused) {
          console.log("Stopping video before carousel slide");
          video.pause();
          video.currentTime = 0;
        }
      });

      currentPosition = Math.max(0, Math.min(maxPosition, newPosition));

      // Calculate and apply transform
      const itemWidth = track.children[0].offsetWidth + gapSize; // width + gap
      track.style.transform = `translateX(-${currentPosition * itemWidth}px)`;

      // Update previous arrow state
      prevArrow.className =
        currentPosition === 0
          ? "cenphi-multi-arrow cenphi-multi-arrow-prev disabled"
          : "cenphi-multi-arrow cenphi-multi-arrow-prev";
      prevArrow.style.opacity = currentPosition === 0 ? "0.4" : "1";
      prevArrow.style.cursor =
        currentPosition === 0 ? "not-allowed" : "pointer";

      // Update next arrow state
      nextArrow.className =
        currentPosition >= maxPosition
          ? "cenphi-multi-arrow cenphi-multi-arrow-next disabled"
          : "cenphi-multi-arrow cenphi-multi-arrow-next";
      nextArrow.style.opacity = currentPosition >= maxPosition ? "0.4" : "1";
      nextArrow.style.cursor =
        currentPosition >= maxPosition ? "not-allowed" : "pointer";

      // Update pagination dots
      const dots = dotsWrapper.querySelectorAll(".cenphi-multi-dot");
      dots.forEach((dot, i) => {
        const isActive = i === currentPosition;
        dot.className = `cenphi-multi-dot ${isActive ? "active" : ""}`;
        dot.style.width = isActive ? "28px" : "8px";
        dot.style.background = isActive
          ? config.accentColor
          : "rgba(100, 116, 139, 0.3)";
      });

      // After position update, setup autoplay (unless user paused)
      setupAutoplay();
    };

    // Helper function to advance carousel position (used by autoplay)
    const advancePosition = () => {
      // CRITICAL: Block auto-advance if ANY video is playing
      if (isAnyVideoPlayingInView()) {
        console.log(
          "AUTOPLAY BLOCKED: Video is playing. Will check again in 1 second."
        );
        // Check again in 1 second instead of advancing
        autoplayInterval = setTimeout(advancePosition, 1000);
        return;
      }

      // Safe to advance - no videos playing
      const newPosition =
        currentPosition < maxPosition ? currentPosition + 1 : 0;
      updatePosition(newPosition);
    };

    const setupAutoplay = () => {
      clearTimeout(autoplayInterval);
      autoplayInterval = null;

      // Don't setup autoplay if disabled or user paused
      if (!config.carouselAutoplay || isUserPaused) return;

      // Check if ANY video in current view is playing
      if (isAnyVideoPlayingInView()) {
        // DON'T start autoplay timer - wait for video to end
        console.log("Video is playing - autoplay will wait until video ends");
        return;
      }

      // No videos playing - setup autoplay
      autoplayInterval = setTimeout(advancePosition, config.carouselInterval);
    };

    prevArrow.addEventListener("click", () => {
      if (currentPosition > 0) {
        isUserPaused = true; // User initiated navigation
        updatePosition(currentPosition - 1);
      }
    });

    nextArrow.addEventListener("click", () => {
      if (currentPosition < maxPosition) {
        isUserPaused = true; // User initiated navigation
        updatePosition(currentPosition + 1);
      }
    });

    // Pagination dots also pause autoplay when clicked
    dotsWrapper.querySelectorAll(".cenphi-multi-dot").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        isUserPaused = true; // User initiated navigation
        updatePosition(i);
      });
    });

    // Listen to ALL videos in the carousel to detect when they end/play/pause
    const allVideos = track.querySelectorAll("video");
    allVideos.forEach((video) => {
      video.addEventListener("ended", () => {
        console.log("Video ended - resuming autoplay");
        setupAutoplay();
      });

      video.addEventListener("pause", () => {
        // Resume autoplay when video is paused (user stopped it)
        if (!isUserPaused && config.carouselAutoplay) {
          setupAutoplay();
        }
      });

      video.addEventListener("play", () => {
        // Stop autoplay when video starts playing
        console.log("Video started playing - pausing autoplay");
        clearTimeout(autoplayInterval);
        autoplayInterval = null;
      });
    });

    // Pause autoplay on hover
    wrapper.addEventListener("mouseenter", () => {
      isUserPaused = true;
      clearTimeout(autoplayInterval);
      autoplayInterval = null;
    });

    wrapper.addEventListener("mouseleave", () => {
      isUserPaused = false;
      setupAutoplay();
    });

    // Start autoplay if enabled
    if (config.carouselAutoplay) {
      setupAutoplay();
    }

    // Add shake animation to global styles
    if (!document.getElementById("cenphi-shake-animation")) {
      const shakeStyle = document.createElement("style");
      shakeStyle.id = "cenphi-shake-animation";
      shakeStyle.textContent = `
        @keyframes cenphi-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `;
      document.head.appendChild(shakeStyle);
    }
  }

  // Render single widget with proper expand/collapse support
  function renderWidget(container, data, config) {
    const style = embedStyles[config.embedStyle] || embedStyles.cinematic;
    const maxWidth = config._isExpanded
      ? style.expandedMaxWidth
      : config.compact
      ? "340px"
      : style.maxWidth;

    // Don't clear innerHTML completely - just update the specific widget
    const existingWidget = container.querySelector("[data-widget-main]");

    if (!existingWidget) {
      // First render
      container.innerHTML = "";
      container.className =
        "cenphi-widget-container" + (config.compact ? " cenphi-compact" : "");

      container.style.cssText = `
        width: ${config.width};
        max-width: ${maxWidth};
        margin: 0 auto;
        transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
      `;

      renderWidgetContent(container, data, config, false);

      // Add expand/collapse button if enabled
      if (config.enableExpand) {
        addExpandButton(container, data, config);
      }
    } else {
      // Subsequent renders for expand/collapse
      container.style.maxWidth = maxWidth;

      // Update button icon
      const expandBtn = container.querySelector(".cenphi-expand-btn");
      if (expandBtn) {
        expandBtn.title = config._isExpanded ? "Collapse" : "Expand";
        expandBtn.innerHTML = config._isExpanded
          ? `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/><path d="M13 19V5h-2v14h2z"/></svg>`
          : `<svg viewBox="0 0 24 24"><path d="M5 5h6v2H7v4H5V5zm14 14h-6v-2h4v-4h2v6z"/></svg>`;

        // Add visual feedback
        expandBtn.style.transform = "scale(1.15)";
        setTimeout(() => {
          expandBtn.style.transform = "scale(1)";
        }, 200);
      }
    }
  }

  // Add expand/collapse button with improved functionality
  function addExpandButton(container, data, config) {
    const widget = container.querySelector("[data-widget-main]");
    if (!widget) return;

    const expandBtn = document.createElement("button");
    expandBtn.className = "cenphi-expand-btn";
    expandBtn.title = config._isExpanded ? "Collapse" : "Expand";
    expandBtn.innerHTML = config._isExpanded
      ? `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/><path d="M13 19V5h-2v14h2z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M5 5h6v2H7v4H5V5zm14 14h-6v-2h4v-4h2v6z"/></svg>`;

    expandBtn.style.transition = "all 0.2s ease, transform 0.2s ease";

    expandBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      config._isExpanded = !config._isExpanded;

      // Visual feedback - pulse effect
      expandBtn.style.transform = "scale(0.9)";
      setTimeout(() => {
        renderWidget(container, data, config);
      }, 100);
    });

    widget.appendChild(expandBtn);
  }

  // Render widget content
  function renderWidgetContent(container, data, config, isCarousel) {
    const style = embedStyles[config.embedStyle] || embedStyles.cinematic;

    if (config.embedStyle === "cinematic") {
      renderCinematicEmbed(container, data, config, style, isCarousel);
    } else if (config.embedStyle === "magazine") {
      renderMagazineEmbed(container, data, config, style, isCarousel);
    } else if (config.embedStyle === "floating") {
      renderFloatingEmbed(container, data, config, style, isCarousel);
    } else if (config.embedStyle === "minimal") {
      renderMinimalEmbed(container, data, config, style, isCarousel);
    }

    if (data.share_id && !config.disableTracking) {
      trackEvent(config.apiUrl, data.share_id, "view");
    }
  }

  // CINEMATIC Style
  function renderCinematicEmbed(container, data, config, style, isCarousel) {
    const widget = document.createElement("div");
    widget.setAttribute("data-widget-main", "true");
    widget.style.cssText = `
      background: ${isCarousel ? "transparent" : style.background};
      border-radius: ${isCarousel ? "0" : style.borderRadius};
      box-shadow: ${isCarousel ? "none" : style.shadow};
      overflow: hidden;
      position: relative;
      ${config.enableAnimations ? "animation: cenphi-scale-in 0.5s ease;" : ""}
    `;

    if (!data.testimonial && !data.artifact) {
      widget.innerHTML =
        "<p style='padding: 40px 20px; text-align: center; color: #94a3b8;'>No content available</p>";
      container.appendChild(widget);
      return;
    }

    const testimonial = data.testimonial || {};
    const artifact = data.artifact || {};

    const isVideo =
      testimonial.type === "video" || artifact.content_type === "video/mp4";
    const videoUrl =
      testimonial.video_url || testimonial.media_url || artifact.asset_url;
    const textContent =
      testimonial.text_content || testimonial.content || artifact.text_content;
    const videoId = `cenphi-v-${
      config._instanceId
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let content = "";

    if (isVideo && videoUrl) {
      // For natural aspect ratio (default), let the video determine its own size
      // For forced aspect ratio, constrain the wrapper
      const wrapperStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? `aspect-ratio: ${config.forceAspectRatio}; min-height: 420px;`
          : "min-height: 200px;"; // Minimum height for loading state

      const videoStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? "object-fit: cover;"
          : ""; // Natural aspect - use global CSS

      content += `
        <div class="cenphi-video-wrapper" style="${wrapperStyle}">
          <video id="${videoId}" playsinline controls preload="metadata" ${
        videoStyle ? `style="${videoStyle}"` : ""
      }>
            <source src="${escapeHtml(videoUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
          <div class="cenphi-play-button"></div>
        </div>
      `;
    } else if (textContent) {
      content += `
        <div style="
          background: linear-gradient(135deg, ${config.accentColor}, #9333ea);
          padding: 38px 22px;
          min-height: 240px;
          max-height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        ">
          <div style="
            color: white;
            font-size: 17px;
            font-weight: 500;
            line-height: 1.7;
            text-align: center;
            font-style: italic;
            max-height: 400px;
            overflow-y: auto;
            padding: 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 12;
            -webkit-box-orient: vertical;
            overflow: hidden;
          ">
            "${escapeHtml(textContent)}"
          </div>
        </div>
      `;
    }

    // Optional description
    if (config.description && !isCarousel) {
      content += `
        <div style="padding: 16px 18px; background: rgba(0,0,0,0.4); color: rgba(255,255,255,0.9); font-size: 12px; line-height: 1.5;">
          ${escapeHtml(config.description)}
        </div>
      `;
    }

    content += `
      <div class="cenphi-glass-dark" style="
        position: ${isVideo ? "absolute" : "relative"};
        bottom: 0;
        left: 0;
        right: 0;
        padding: 14px;
        ${isVideo ? "border-radius: 0 0 20px 20px;" : ""}
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${
            config.showAvatar && testimonial.author_avatar
              ? `<img src="${escapeHtml(
                  testimonial.author_avatar
                )}" alt="${escapeHtml(
                  testimonial.author_name || "Author"
                )}" class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${
                  style.avatarSize
                }; border: 2px solid rgba(255,255,255,0.25);">`
              : testimonial.author_name
              ? `<div class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${
                  style.avatarSize
                }; background: linear-gradient(135deg, ${
                  config.accentColor
                }, #9333ea); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; border: 2px solid rgba(255,255,255,0.25);">${getInitials(
                  testimonial.author_name
                )}</div>`
              : ""
          }
          <div style="flex: 1; color: white;">
            <div style="font-weight: 600; font-size: 10px; margin-bottom: 3px;">${escapeHtml(
              testimonial.author_name || "Anonymous"
            )}</div>
            ${
              testimonial.author_role || testimonial.author_company
                ? `<div style="font-size: 12px; opacity: 0.82;">${escapeHtml(
                    [testimonial.author_role, testimonial.author_company]
                      .filter(Boolean)
                      .join(" • ")
                  )}</div>`
                : ""
            }
            ${
              config.showRating && testimonial.rating
                ? `<div class="cenphi-stars" style="margin-top: 5px; color: #fbbf24;">${"★".repeat(
                    testimonial.rating
                  )}${"☆".repeat(5 - testimonial.rating)}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    if (config.showBranding) {
      content += `
        <div style="
          padding: 5px 18px;
          text-align: center;
          font-size: 10px;
          color: rgba(255,255,255,0.55);
          background: rgba(0,0,0,0.25);
        ">
          Powered by <a href="https://cenphi.io" target="_blank" rel="noopener" style="color: white; text-decoration: none; font-weight: 600;">Cenphi</a>
        </div>
      `;
    }

    widget.innerHTML = content;
    container.appendChild(widget);

    setupVideoControls(widget, videoId);
  }

  // MAGAZINE Style - Editorial layout
  function renderMagazineEmbed(container, data, config, style, isCarousel) {
    const widget = document.createElement("div");
    widget.setAttribute("data-widget-main", "true");
    widget.style.cssText = `
      background: ${isCarousel ? "transparent" : style.background};
      border-radius: ${isCarousel ? "0" : style.borderRadius};
      box-shadow: ${isCarousel ? "none" : style.shadow};
      padding: ${isCarousel ? "0" : style.padding};
      border: ${isCarousel ? "none" : "1px solid rgba(0,0,0,0.08)"};
      position: relative;
      ${config.enableAnimations ? "animation: cenphi-fade-in 0.5s ease;" : ""}
    `;

    if (!data.testimonial && !data.artifact) {
      widget.innerHTML =
        "<p style='padding: 40px 20px; text-align: center; color: #94a3b8;'>No content available</p>";
      container.appendChild(widget);
      return;
    }

    const testimonial = data.testimonial || {};
    const artifact = data.artifact || {};

    const isVideo =
      testimonial.type === "video" || artifact.content_type === "video/mp4";
    const videoUrl =
      testimonial.video_url || testimonial.media_url || artifact.asset_url;
    const textContent =
      testimonial.text_content || testimonial.content || artifact.text_content;
    const videoId = `cenphi-v-${
      config._instanceId
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let content = "";

    // Author section first (editorial style)
    content += `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
          ${
            config.showAvatar && testimonial.author_avatar
              ? `<img src="${escapeHtml(
                  testimonial.author_avatar
                )}" alt="${escapeHtml(
                  testimonial.author_name || "Author"
                )}" class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${style.avatarSize}; border: 2px solid ${
                  config.accentColor
                };">`
              : testimonial.author_name
              ? `<div class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${
                  style.avatarSize
                }; background: linear-gradient(135deg, ${
                  config.accentColor
                }, #9333ea); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;">${getInitials(
                  testimonial.author_name
                )}</div>`
              : ""
          }
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 3px;">${escapeHtml(
              testimonial.author_name || "Anonymous"
            )}</div>
            ${
              testimonial.author_role || testimonial.author_company
                ? `<div style="font-size: 13px; color: #64748b;">${escapeHtml(
                    [testimonial.author_role, testimonial.author_company]
                      .filter(Boolean)
                      .join(" • ")
                  )}</div>`
                : ""
            }
            ${
              config.showRating && testimonial.rating
                ? `<div class="cenphi-stars" style="margin-top: 5px;">${"★".repeat(
                    testimonial.rating
                  )}${"☆".repeat(5 - testimonial.rating)}</div>`
                : ""
            }
          </div>
        </div>
        <div style="height: 2px; background: linear-gradient(90deg, ${
          config.accentColor
        }, transparent); opacity: 0.3;"></div>
      </div>
    `;

    if (isVideo && videoUrl) {
      // For natural aspect ratio (default), let the video determine its own size
      // For forced aspect ratio, constrain the wrapper
      const wrapperStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? `aspect-ratio: ${config.forceAspectRatio}; min-height: 380px;`
          : "min-height: 200px;"; // Minimum height for loading state

      const videoStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? "object-fit: cover;"
          : ""; // Natural aspect - use global CSS

      content += `
        <div class="cenphi-video-wrapper" style="${wrapperStyle} border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <video id="${videoId}" playsinline controls preload="metadata" ${
        videoStyle ? `style="${videoStyle}"` : ""
      }>
            <source src="${escapeHtml(videoUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
          <div class="cenphi-play-button"></div>
        </div>
      `;
    } else if (textContent) {
      content += `
        <div style="
          position: relative;
          padding: 28px 0;
          margin-bottom: 20px;
        ">
          <div style="
            font-size: 72px;
            line-height: 1;
            color: ${config.accentColor};
            opacity: 0.15;
            position: absolute;
            top: -10px;
            left: -8px;
          ">"</div>
          <div style="
            color: #1e293b;
            font-size: 15px;
            line-height: 1.8;
            font-style: italic;
            position: relative;
            z-index: 1;
          ">
            ${escapeHtml(textContent)}
          </div>
        </div>
      `;
    }

    // Optional description
    if (config.description && !isCarousel) {
      content += `
        <div style="
          padding: 14px 16px;
          background: #f8fafc;
          border-left: 3px solid ${config.accentColor};
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
          margin-top: 16px;
        ">
          ${escapeHtml(config.description)}
        </div>
      `;
    }

    if (config.showBranding) {
      content += `
        <div style="
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid rgba(0,0,0,0.06);
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
        ">
          Powered by <a href="https://cenphi.io" target="_blank" rel="noopener" style="color: ${config.accentColor}; text-decoration: none; font-weight: 600;">Cenphi</a>
        </div>
      `;
    }

    widget.innerHTML = content;
    container.appendChild(widget);

    setupVideoControls(widget, videoId);
  }

  // FLOATING Style - Glassmorphism with purple gradient
  function renderFloatingEmbed(container, data, config, style, isCarousel) {
    const widget = document.createElement("div");
    widget.setAttribute("data-widget-main", "true");
    widget.style.cssText = `
      background: ${
        isCarousel
          ? "transparent"
          : "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(236, 72, 153, 0.12))"
      };
      border-radius: ${isCarousel ? "0" : style.borderRadius};
      box-shadow: ${isCarousel ? "none" : style.shadow};
      overflow: hidden;
      position: relative;
      ${config.enableAnimations ? "animation: cenphi-scale-in 0.5s ease;" : ""}
    `;

    if (!data.testimonial && !data.artifact) {
      widget.innerHTML =
        "<p style='padding: 40px 20px; text-align: center; color: #94a3b8;'>No content available</p>";
      container.appendChild(widget);
      return;
    }

    const testimonial = data.testimonial || {};
    const artifact = data.artifact || {};

    const isVideo =
      testimonial.type === "video" || artifact.content_type === "video/mp4";
    const videoUrl =
      testimonial.video_url || testimonial.media_url || artifact.asset_url;
    const textContent =
      testimonial.text_content || testimonial.content || artifact.text_content;
    const videoId = `cenphi-v-${
      config._instanceId
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let content = "";

    if (isVideo && videoUrl) {
      // For natural aspect ratio (default), let the video determine its own size
      // For forced aspect ratio, constrain the wrapper
      const wrapperStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? `aspect-ratio: ${config.forceAspectRatio}; min-height: 400px;`
          : "min-height: 200px;"; // Minimum height for loading state

      const videoStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? "object-fit: cover;"
          : ""; // Natural aspect - use global CSS

      content += `
        <div class="cenphi-video-wrapper" style="${wrapperStyle}">
          <video id="${videoId}" playsinline controls preload="metadata" ${
        videoStyle ? `style="${videoStyle}"` : ""
      }>
            <source src="${escapeHtml(videoUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
          <div class="cenphi-play-button"></div>
        </div>
      `;
    } else if (textContent) {
      content += `
        <div style="
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          padding: 50px 24px;
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            font-size: 120px;
            line-height: 1;
            color: rgba(255,255,255,0.08);
            position: absolute;
            top: 10px;
            left: 20px;
          ">"</div>
          <div style="color: white; font-size: 16px; font-weight: 500; line-height: 1.7; text-align: center; font-style: italic; position: relative; z-index: 1;">
            ${escapeHtml(textContent)}
          </div>
        </div>
      `;
    }

    // Optional description
    if (config.description && !isCarousel) {
      content += `
        <div class="cenphi-glass" style="
          padding: 16px 20px;
          color: #334155;
          font-size: 12px;
          line-height: 1.5;
        ">
          ${escapeHtml(config.description)}
        </div>
      `;
    }

    content += `
      <div class="cenphi-glass" style="padding: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${
            config.showAvatar && testimonial.author_avatar
              ? `<img src="${escapeHtml(
                  testimonial.author_avatar
                )}" alt="${escapeHtml(
                  testimonial.author_name || "Author"
                )}" class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${
                  style.avatarSize
                }; border: 2px solid rgba(139,92,246,0.4);">`
              : testimonial.author_name
              ? `<div class="cenphi-avatar" style="width: ${
                  style.avatarSize
                }; height: ${
                  style.avatarSize
                }; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid rgba(139,92,246,0.4);">${getInitials(
                  testimonial.author_name
                )}</div>`
              : ""
          }
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 15px; color: #1e293b; margin-bottom: 3px;">${escapeHtml(
              testimonial.author_name || "Anonymous"
            )}</div>
            ${
              testimonial.author_role || testimonial.author_company
                ? `<div style="font-size: 12px; color: #64748b;">${escapeHtml(
                    [testimonial.author_role, testimonial.author_company]
                      .filter(Boolean)
                      .join(" • ")
                  )}</div>`
                : ""
            }
            ${
              config.showRating && testimonial.rating
                ? `<div class="cenphi-stars" style="margin-top: 5px;">${"★".repeat(
                    testimonial.rating
                  )}${"☆".repeat(5 - testimonial.rating)}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    if (config.showBranding) {
      content += `
        <div style="
          padding: 10px 20px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          background: rgba(255,255,255,0.5);
        ">
          Powered by <a href="https://cenphi.io" target="_blank" rel="noopener" style="color: #8b5cf6; text-decoration: none; font-weight: 600;">Cenphi</a>
        </div>
      `;
    }

    widget.innerHTML = content;
    container.appendChild(widget);

    setupVideoControls(widget, videoId);
  }

  // MINIMAL Style - Ultra-clean with left accent
  function renderMinimalEmbed(container, data, config, style, isCarousel) {
    const widget = document.createElement("div");
    widget.setAttribute("data-widget-main", "true");
    widget.style.cssText = `
      background: ${isCarousel ? "transparent" : style.background};
      border-radius: ${isCarousel ? "0" : style.borderRadius};
      box-shadow: ${isCarousel ? "none" : style.shadow};
      padding: ${isCarousel ? "0" : style.padding};
      border-left: ${isCarousel ? "none" : `4px solid ${config.accentColor}`};
      position: relative;
      ${config.enableAnimations ? "animation: cenphi-fade-in 0.5s ease;" : ""}
    `;

    if (!data.testimonial && !data.artifact) {
      widget.innerHTML =
        "<p style='padding: 40px 20px; text-align: center; color: #94a3b8;'>No content available</p>";
      container.appendChild(widget);
      return;
    }

    const testimonial = data.testimonial || {};
    const artifact = data.artifact || {};

    const isVideo =
      testimonial.type === "video" || artifact.content_type === "video/mp4";
    const videoUrl =
      testimonial.video_url || testimonial.media_url || artifact.asset_url;
    const textContent =
      testimonial.text_content || testimonial.content || artifact.text_content;
    const videoId = `cenphi-v-${
      config._instanceId
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let content = "";

    if (isVideo && videoUrl) {
      // For natural aspect ratio (default), let the video determine its own size
      // For forced aspect ratio, constrain the wrapper
      const wrapperStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? `aspect-ratio: ${config.forceAspectRatio}; min-height: 360px;`
          : "min-height: 200px;"; // Minimum height for loading state

      const videoStyle =
        config.forceAspectRatio && config.forceAspectRatio !== false
          ? "object-fit: cover;"
          : ""; // Natural aspect - use global CSS

      content += `
        <div class="cenphi-video-wrapper" style="${wrapperStyle} border-radius: 6px; overflow: hidden; margin-bottom: 18px;">
          <video id="${videoId}" playsinline controls preload="metadata" ${
        videoStyle ? `style="${videoStyle}"` : ""
      }>
            <source src="${escapeHtml(videoUrl)}" type="video/mp4">
            Your browser does not support video playback.
          </video>
          <div class="cenphi-play-button"></div>
        </div>
      `;
    } else if (textContent) {
      content += `
        <div style="
          padding: 20px 0;
          margin-bottom: 18px;
        ">
          <div style="
            color: #334155;
            font-size: 13px;
            line-height: 1.7;
            font-style: italic;
          ">
            "${escapeHtml(textContent)}"
          </div>
        </div>
      `;
    }

    // Optional description
    if (config.description && !isCarousel) {
      content += `
        <div style="
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
          margin-bottom: 18px;
        ">
          ${escapeHtml(config.description)}
        </div>
      `;
    }

    content += `
      <div style="display: flex; align-items: center; gap: 12px;">
        ${
          config.showAvatar && testimonial.author_avatar
            ? `<img src="${escapeHtml(
                testimonial.author_avatar
              )}" alt="${escapeHtml(
                testimonial.author_name || "Author"
              )}" class="cenphi-avatar" style="width: ${
                style.avatarSize
              }; height: ${style.avatarSize};">`
            : testimonial.author_name
            ? `<div class="cenphi-avatar" style="width: ${
                style.avatarSize
              }; height: ${style.avatarSize}; background: ${
                config.accentColor
              }; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">${getInitials(
                testimonial.author_name
              )}</div>`
            : ""
        }
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${escapeHtml(
            testimonial.author_name || "Anonymous"
          )}</div>
          ${
            testimonial.author_role || testimonial.author_company
              ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(
                  [testimonial.author_role, testimonial.author_company]
                    .filter(Boolean)
                    .join(" • ")
                )}</div>`
              : ""
          }
          ${
            config.showRating && testimonial.rating
              ? `<div class="cenphi-stars" style="margin-top: 4px; font-size: 11px;">${"★".repeat(
                  testimonial.rating
                )}${"☆".repeat(5 - testimonial.rating)}</div>`
              : ""
          }
        </div>
      </div>
    `;

    if (config.showBranding) {
      content += `
        <div style="
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.06);
          text-align: right;
          font-size: 9px;
          color: #94a3b8;
        ">
          via <a href="https://cenphi.io" target="_blank" rel="noopener" style="color: ${config.accentColor}; text-decoration: none; font-weight: 600;">Cenphi</a>
        </div>
      `;
    }

    widget.innerHTML = content;
    container.appendChild(widget);

    setupVideoControls(widget, videoId);
  }

  // Setup video controls with global management
  function setupVideoControls(widget, videoId) {
    const playBtn = widget.querySelector(".cenphi-play-button");
    const video = widget.querySelector(`#${videoId}`);

    if (playBtn && video) {
      GlobalVideoManager.register(video);

      playBtn.addEventListener("click", () => {
        video.play();
        playBtn.style.display = "none";
      });

      video.addEventListener("play", () => {
        playBtn.style.display = "none";
      });

      video.addEventListener("pause", () => {
        if (video.currentTime === 0 || video.ended) {
          playBtn.style.display = "flex";
        }
      });

      video.addEventListener("ended", () => {
        playBtn.style.display = "flex";
      });
    }
  }

  // Error state
  function renderError(container, error, config) {
    const style = embedStyles[config.embedStyle] || embedStyles.cinematic;
    container.innerHTML = `
      <div style="
        padding: 44px 26px;
        text-align: center;
        background: #fef2f2;
        border: 2px solid #fca5a5;
        border-radius: ${style.borderRadius};
        color: #991b1b;
      ">
        <div style="font-size: 42px; margin-bottom: 14px;">⚠️</div>
        <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">Unable to load content</div>
        <div style="font-size: 12px; color: #b91c1c;">${escapeHtml(
          error.message || "Unknown error"
        )}</div>
      </div>
    `;
  }

  // Track events (disabled when disableTracking config is true - used for preview mode)
  function trackEvent(apiUrl, shareId, eventType) {
    if (!apiUrl || !shareId) return;

    const url = `${apiUrl}/api/share/${shareId}/track`;
    let visitorId = localStorage.getItem("cenphi_visitor_id");

    if (!visitorId || !isValidUUID(visitorId)) {
      visitorId = generateUUID();
      localStorage.setItem("cenphi_visitor_id", visitorId);
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        visitor_id: visitorId,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      }),
    }).catch(() => {});
  }

  // Helper functions
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function generateUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  function isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
})();
