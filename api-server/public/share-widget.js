(function () {
  "use strict";

  // Widget namespace
  window.CenphiShareWidget = window.CenphiShareWidget || {};

  // Default configuration
  const defaultConfig = {
    apiUrl: "https://api.cenphi.com",
    variant: "premium", // premium, modern, minimal, cinematic
    theme: "light", // light, dark, auto
    autoplay: false,
    showBranding: true,
    width: "100%",
    maxWidth: "720px",
    borderRadius: "16px",
    enableAnimations: true,
    showSocialShare: true,
    accentColor: "#3b82f6",
  };

  // Premium variant styles - Award-winning design
  const variantStyles = {
    premium: {
      shadow:
        "0 20px 60px -12px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08)",
      borderRadius: "20px",
      padding: "0",
      border: "1px solid rgba(0, 0, 0, 0.06)",
      background: "#ffffff",
      overlay:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)",
    },
    modern: {
      shadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
      borderRadius: "16px",
      padding: "0",
      border: "none",
      background: "linear-gradient(to bottom, #ffffff, #fafbfc)",
      overlay: "none",
    },
    minimal: {
      shadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      borderRadius: "12px",
      padding: "0",
      border: "1px solid #e5e7eb",
      background: "#ffffff",
      overlay: "none",
    },
    cinematic: {
      shadow: "0 30px 80px rgba(0, 0, 0, 0.3)",
      borderRadius: "8px",
      padding: "0",
      border: "none",
      background: "linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)",
      overlay:
        "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
    },
  };

  // Initialize widget
  CenphiShareWidget.init = function (options) {
    const config = Object.assign({}, defaultConfig, options);
    console.log("options", options);
    console.log("default config", defaultConfig);

    if (!config.shareId) {
      console.error("CenphiShareWidget: shareId is required");
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

    // Inject global styles once
    injectGlobalStyles(config);

    // Fetch widget configuration
    fetchWidgetConfig(config)
      .then((data) => renderWidget(container, data, config))
      .catch((err) => renderError(container, err));
  };

  // Inject global CSS styles - Premium design system
  function injectGlobalStyles(config) {
    if (document.getElementById("cenphi-widget-styles")) return;

    const style = document.createElement("style");
    style.id = "cenphi-widget-styles";
    style.textContent = `
      @keyframes cenphi-fade-in {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes cenphi-fade-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes cenphi-scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes cenphi-shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }

      @keyframes cenphi-pulse-ring {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.3; }
        100% { transform: scale(1.2); opacity: 0; }
      }

      @keyframes cenphi-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
      }

      .cenphi-widget-container * {
        box-sizing: border-box;
      }

      .cenphi-widget-animated {
        animation: cenphi-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .cenphi-video-wrapper {
        position: relative;
        overflow: hidden;
      }

      .cenphi-video-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 50%),
                    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.15), transparent 50%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .cenphi-video-wrapper:hover::before {
        opacity: 1;
      }

      .cenphi-play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(59, 130, 246, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
      }

      .cenphi-play-button::before {
        content: '';
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: ${config.accentColor};
        opacity: 0.2;
        animation: cenphi-pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
      }

      .cenphi-play-button:hover {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2), 0 0 0 8px rgba(59, 130, 246, 0.2);
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      }

      .cenphi-play-button:active {
        transform: translate(-50%, -50%) scale(1.05);
      }

      .cenphi-play-button::after {
        content: '';
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 14px 0 14px 24px;
        border-color: transparent transparent transparent ${config.accentColor};
        margin-left: 5px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .cenphi-social-share {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .cenphi-social-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
        color: #64748b;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-size: 18px;
        border: 1px solid rgba(0, 0, 0, 0.04);
        position: relative;
        overflow: hidden;
      }

      .cenphi-social-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .cenphi-social-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
      }

      .cenphi-social-btn:hover::before {
        opacity: 1;
      }

      .cenphi-social-btn:active {
        transform: translateY(-1px);
      }

      .cenphi-skeleton {
        background: linear-gradient(90deg, #f0f0f0 0px, #f8f8f8 40px, #f0f0f0 80px);
        background-size: 1000px;
        animation: cenphi-shimmer 2s infinite;
      }

      .cenphi-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        color: #3b82f6;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .cenphi-gradient-text {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      @media (prefers-color-scheme: dark) {
        .cenphi-auto-theme .cenphi-social-btn {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Fetch widget configuration from API
  async function fetchWidgetConfig(config) {
    console.log("config", config);
    const url = `${config.apiUrl}/widget/config/${config.shareId}`;

    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load content");
      }
      return response.json();
    });
  }

  // Render widget based on share type
  function renderWidget(container, data, config) {
    container.innerHTML = "";
    container.className =
      "cenphi-widget-container" +
      (config.theme === "auto" ? " cenphi-auto-theme" : "");
    container.style.cssText = `
      width: ${config.width};
      max-width: ${config.maxWidth};
      margin: 0 auto;
    `;

    if (data.share_type === "testimonial" && data.testimonial) {
      renderTestimonialWidget(
        container,
        data.testimonial,
        data.branding,
        data.description,
        config
      );
    } else if (data.share_type === "artifact" && data.artifact) {
      renderArtifactWidget(
        container,
        data.artifact,
        data.branding,
        data.description,
        config
      );
    }

    // Track view event
    trackEvent(config.apiUrl, data.share_id, "view");
  }

  // Render testimonial widget - Premium design
  function renderTestimonialWidget(
    container,
    testimonial,
    branding,
    description,
    config
  ) {
    const style = variantStyles[config.variant] || variantStyles.premium;
    const isDark = config.variant === "cinematic";
    const accentColor =
      (branding && branding.primary_color) || config.accentColor;

    const widget = document.createElement("div");
    widget.className =
      "cenphi-testimonial-widget" +
      (config.enableAnimations ? " cenphi-widget-animated" : "");
    widget.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${style.background};
      border-radius: ${style.borderRadius};
      box-shadow: ${style.shadow};
      border: ${style.border};
      overflow: hidden;
      position: relative;
      backdrop-filter: blur(20px);
    `;

    // Overlay effect for premium variant
    if (style.overlay && style.overlay !== "none") {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: ${style.overlay};
        pointer-events: none;
        z-index: 0;
      `;
      widget.appendChild(overlay);
    }

    const content = document.createElement("div");
    content.style.cssText = "position: relative; z-index: 1;";

    // Description section (if present)
    const descriptionHTML = description
      ? `
      <div style="padding: 20px 32px 16px; border-bottom: 1px solid ${
        isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
      };">
        <p style="font-size: 14px; line-height: 1.6; color: ${
          isDark ? "#d1d5db" : "#475569"
        }; margin: 0; white-space: pre-line;">${escapeHtml(description)}</p>
      </div>
    `
      : "";

    // Video or text content
    let mediaHTML = "";
    if (
      testimonial.type === "video" &&
      (testimonial.video_url || testimonial.media_url)
    ) {
      const videoUrl = testimonial.video_url || testimonial.media_url;
      const videoId = "video-" + Math.random().toString(36).substr(2, 9);
      mediaHTML = `
        <div class="cenphi-video-wrapper" style="position: relative; padding-bottom: 56.25%; background: linear-gradient(135deg, ${
          isDark ? "#0a0a0a" : "#1e293b"
        } 0%, ${isDark ? "#1a1a1a" : "#334155"} 100%);">
          <video
            id="${videoId}"
            ${config.autoplay ? "autoplay muted" : ""}
            playsinline
            controls
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
          >
            <source src="${videoUrl}" type="video/mp4">
          </video>
          ${
            !config.autoplay
              ? `
            <div class="cenphi-play-button" onclick="document.getElementById('${videoId}').play(); this.style.display='none'; window.CenphiShareWidget.trackPlay('${config.shareId}', '${config.apiUrl}');"></div>
          `
              : ""
          }
        </div>
      `;
    } else if (testimonial.text_content || testimonial.content) {
      const textContent = testimonial.text_content || testimonial.content;
      mediaHTML = `
        <div style="padding: 40px 32px; font-size: 17px; line-height: 1.8; color: ${
          isDark ? "#e5e7eb" : "#1e293b"
        }; font-weight: 400; position: relative;">
          <div style="position: absolute; top: 28px; left: 28px; font-size: 72px; color: ${
            isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.08)"
          }; line-height: 1; font-family: Georgia, serif; font-weight: 700;">"</div>
          <div style="position: relative; z-index: 1; padding-left: 12px; font-style: italic;">
            ${escapeHtml(textContent)}
          </div>
          <div style="position: absolute; bottom: 32px; right: 32px; font-size: 72px; color: ${
            isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.08)"
          }; line-height: 1; font-family: Georgia, serif; font-weight: 700; transform: rotate(180deg);">"</div>
        </div>
      `;
    }

    // Rating stars
    const ratingHTML = testimonial.rating
      ? `
      <div style="margin-top: 10px; display: flex; gap: 3px; align-items: center;">
        ${renderStars(testimonial.rating, isDark, accentColor)}
        <span style="margin-left: 6px; font-size: 13px; color: ${
          isDark ? "#9ca3af" : "#64748b"
        }; font-weight: 600;">${testimonial.rating}.0</span>
      </div>
    `
      : "";

    // Author info - Premium design
    const authorHTML = `
      <div style="padding: 28px 32px; border-top: 1px solid ${
        isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
      }; background: ${
      isDark
        ? "rgba(255,255,255,0.02)"
        : "linear-gradient(to bottom, rgba(248, 250, 252, 0.5), rgba(248, 250, 252, 0.8))"
    }; backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; gap: 18px;">
          ${
            testimonial.author_avatar
              ? `<img src="${testimonial.author_avatar}" alt="${
                  testimonial.author_name || "Author"
                }" style="width: 64px; height: 64px; border-radius: 16px; object-fit: cover; border: 3px solid ${
                  isDark ? "rgba(255,255,255,0.1)" : "#fff"
                }; box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink: 0;">`
              : `<div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; color: #fff; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); flex-shrink: 0;">${getInitials(
                  testimonial.author_name
                )}</div>`
          }
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; color: ${
              isDark ? "#f9fafb" : "#0f172a"
            }; font-size: 16px; margin-bottom: 3px; letter-spacing: -0.01em;">${escapeHtml(
      testimonial.author_name || "Anonymous"
    )}</div>
            ${
              testimonial.author_role ||
              testimonial.author_title ||
              testimonial.author_company
                ? `<div style="color: ${
                    isDark ? "#94a3b8" : "#64748b"
                  }; font-size: 14px; margin-bottom: 6px; font-weight: 500;">${escapeHtml(
                    [
                      testimonial.author_role || testimonial.author_title,
                      testimonial.author_company,
                    ]
                      .filter(Boolean)
                      .join(" at ")
                  )}</div>`
                : ""
            }
            ${ratingHTML}
          </div>
        </div>
        ${
          config.showSocialShare
            ? `
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid ${
            isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
          };">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
              <div style="font-size: 13px; color: ${
                isDark ? "#94a3b8" : "#64748b"
              }; font-weight: 600; letter-spacing: 0.3px;">SHARE THIS</div>
              <div class="cenphi-social-share">
                ${renderSocialButtons(
                  config.shareId,
                  config.apiUrl,
                  testimonial,
                  isDark
                )}
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    // Branding footer - Elegant
    const brandingHTML = config.showBranding
      ? `
      <div style="padding: 16px 32px; text-align: center; background: ${
        isDark
          ? "rgba(0,0,0,0.2)"
          : "linear-gradient(to bottom, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 1))"
      }; font-size: 12px; color: ${
          isDark ? "#94a3b8" : "#94a3b8"
        }; border-top: 1px solid ${
          isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
        };">
        <span style="opacity: 0.7; font-weight: 500;">Powered by</span> <a href="https://cenphi.com" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: 700; transition: opacity 0.2s; margin-left: 4px;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">Cenphi</a>
      </div>
    `
      : "";

    content.innerHTML = descriptionHTML + mediaHTML + authorHTML + brandingHTML;
    widget.appendChild(content);
    container.appendChild(widget);
  }

  // Render artifact widget - Premium design
  function renderArtifactWidget(
    container,
    artifact,
    branding,
    description,
    config
  ) {
    const style = variantStyles[config.variant] || variantStyles.premium;
    const isDark = config.variant === "cinematic";
    const accentColor =
      (branding && branding.primary_color) || config.accentColor;

    const widget = document.createElement("div");
    widget.className =
      "cenphi-artifact-widget" +
      (config.enableAnimations ? " cenphi-widget-animated" : "");
    widget.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${style.background};
      border-radius: ${style.borderRadius};
      box-shadow: ${style.shadow};
      border: ${style.border};
      overflow: hidden;
      position: relative;
      backdrop-filter: blur(20px);
    `;

    // Overlay effect
    if (style.overlay && style.overlay !== "none") {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: ${style.overlay};
        pointer-events: none;
        z-index: 0;
      `;
      widget.appendChild(overlay);
    }

    const content = document.createElement("div");
    content.style.cssText = "position: relative; z-index: 1;";

    // Description section (if present)
    const descriptionHTML = description
      ? `
      <div style="padding: 20px 32px 16px; border-bottom: 1px solid ${
        isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
      };">
        <p style="font-size: 14px; line-height: 1.6; color: ${
          isDark ? "#d1d5db" : "#475569"
        }; margin: 0; white-space: pre-line;">${escapeHtml(description)}</p>
      </div>
    `
      : "";

    let contentHTML = "";

    // Video artifact
    if (
      artifact.asset_url &&
      (artifact.content_type || "").startsWith("video/")
    ) {
      const videoId = "video-" + Math.random().toString(36).substr(2, 9);
      contentHTML = `
        <div class="cenphi-video-wrapper" style="position: relative; padding-bottom: 56.25%; background: linear-gradient(135deg, ${
          isDark ? "#0a0a0a" : "#1e293b"
        } 0%, ${isDark ? "#1a1a1a" : "#334155"} 100%);">
          <video
            id="${videoId}"
            ${config.autoplay ? "autoplay muted" : ""}
            playsinline
            controls
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
          >
            <source src="${artifact.asset_url}" type="${artifact.content_type}">
          </video>
          ${
            !config.autoplay
              ? `
            <div class="cenphi-play-button" onclick="document.getElementById('${videoId}').play(); this.style.display='none'; window.CenphiShareWidget.trackPlay('${config.shareId}', '${config.apiUrl}');"></div>
          `
              : ""
          }
        </div>
      `;
    }
    // Text content artifact
    else if (artifact.text_content) {
      contentHTML = `
        <div style="padding: 40px 32px; font-size: 16px; line-height: 1.8; color: ${
          isDark ? "#e5e7eb" : "#334155"
        }; font-weight: 400;">
          ${escapeHtml(artifact.text_content)}
        </div>
      `;
    }
    // Image artifact
    else if (
      artifact.asset_url &&
      (artifact.content_type || "").startsWith("image/")
    ) {
      contentHTML = `
        <div style="background: ${
          isDark ? "#000" : "#f8fafc"
        }; position: relative; overflow: hidden;">
          <img src="${
            artifact.asset_url
          }" alt="Content" style="width: 100%; height: auto; display: block;">
        </div>
      `;
    }

    // Metadata footer - Premium
    const metaHTML = `
      <div style="padding: 24px 32px; background: ${
        isDark
          ? "rgba(255,255,255,0.02)"
          : "linear-gradient(to bottom, rgba(248, 250, 252, 0.5), rgba(248, 250, 252, 0.9))"
      }; border-top: 1px solid ${
      isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
    }; backdrop-filter: blur(10px);">
        <div style="font-size: 13px; color: ${
          isDark ? "#94a3b8" : "#64748b"
        }; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          ${
            artifact.processing_type
              ? `<span class="cenphi-badge">${artifact.processing_type.replace(
                  /_/g,
                  " "
                )}</span>`
              : ""
          }
          ${
            artifact.platform
              ? `<span style="padding: 6px 14px; background: ${
                  isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"
                }; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${
                  isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"
                };">${artifact.platform}</span>`
              : ""
          }
        </div>
        ${
          config.showSocialShare
            ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${
            isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
          };">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
              <div style="font-size: 13px; color: ${
                isDark ? "#94a3b8" : "#64748b"
              }; font-weight: 600; letter-spacing: 0.3px;">SHARE THIS</div>
              <div class="cenphi-social-share">
                ${renderSocialButtons(
                  config.shareId,
                  config.apiUrl,
                  null,
                  isDark
                )}
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    // Branding
    const brandingHTML = config.showBranding
      ? `
      <div style="padding: 16px 32px; text-align: center; background: ${
        isDark
          ? "rgba(0,0,0,0.2)"
          : "linear-gradient(to bottom, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 1))"
      }; font-size: 12px; color: ${
          isDark ? "#94a3b8" : "#94a3b8"
        }; border-top: 1px solid ${
          isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
        };">
        <span style="opacity: 0.7; font-weight: 500;">Powered by</span> <a href="https://cenphi.com" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: 700; transition: opacity 0.2s; margin-left: 4px;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">Cenphi</a>
      </div>
    `
      : "";

    content.innerHTML = descriptionHTML + contentHTML + metaHTML + brandingHTML;
    widget.appendChild(content);
    container.appendChild(widget);
  }

  // Render error state - Premium
  function renderError(container, error) {
    container.innerHTML = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
        padding: 48px 40px;
        text-align: center;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border: 1px solid #fca5a5;
        border-radius: 20px;
        color: #991b1b;
        box-shadow: 0 20px 60px -12px rgba(239, 68, 68, 0.15);
      ">
        <div style="font-size: 40px; margin-bottom: 16px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">⚠️</div>
        <div style="font-weight: 700; font-size: 17px; margin-bottom: 8px; letter-spacing: -0.01em;">Unable to load content</div>
        <div style="font-size: 14px; color: #b91c1c; font-weight: 500;">${escapeHtml(
          error.message || "Unknown error"
        )}</div>
      </div>
    `;
  }

  // Render social sharing buttons - Premium
  function renderSocialButtons(shareId, apiUrl, testimonial, isDark) {
    const shareUrl = encodeURIComponent(window.location.href);
    const text =
      testimonial && testimonial.content
        ? encodeURIComponent(testimonial.content.substring(0, 100) + "...")
        : encodeURIComponent("Check out this content");

    return `
      <a href="https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}" target="_blank" class="cenphi-social-btn" onclick="window.CenphiShareWidget.trackShare('${shareId}', '${apiUrl}', 'twitter')" title="Share on Twitter">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" class="cenphi-social-btn" onclick="window.CenphiShareWidget.trackShare('${shareId}', '${apiUrl}', 'linkedin')" title="Share on LinkedIn">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="cenphi-social-btn" onclick="window.CenphiShareWidget.trackShare('${shareId}', '${apiUrl}', 'facebook')" title="Share on Facebook">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <button class="cenphi-social-btn" onclick="navigator.clipboard.writeText(window.location.href); window.CenphiShareWidget.trackShare('${shareId}', '${apiUrl}', 'copy'); const btn = this; const originalHTML = btn.innerHTML; btn.innerHTML='<svg width=\\'18\\' height=\\'18\\' fill=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path d=\\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\\'/></svg>'; btn.style.background=\\'linear-gradient(135deg, #10b981 0%, #059669 100%)\\'; btn.style.color=\\'#fff\\'; setTimeout(() => { btn.innerHTML = originalHTML; btn.style.background = \\'\\'; btn.style.color = \\'\\'}, 2000)" title="Copy link" style="border: none; cursor: pointer;">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      </button>
    `;
  }

  // Track play event
  CenphiShareWidget.trackPlay = function (shareId, apiUrl) {
    trackEvent(apiUrl, shareId, "play");
  };

  // Track share event
  CenphiShareWidget.trackShare = function (shareId, apiUrl, platform) {
    trackEvent(apiUrl, shareId, "share_" + platform);
  };

  // Track events
  function trackEvent(apiUrl, shareId, eventType) {
    const url = `${apiUrl}/api/share/${shareId}/track`;

    // Get or create visitor ID (proper UUID format)
    let visitorId = localStorage.getItem("cenphi_visitor_id");
    if (!visitorId || !isValidUUID(visitorId)) {
      visitorId = generateUUID();
      localStorage.setItem("cenphi_visitor_id", visitorId);
    }

    const referrer = document.referrer || null;
    const userAgent = navigator.userAgent || null;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        visitor_id: visitorId,
        referrer: referrer,
        user_agent: userAgent,
      }),
    }).catch((err) => console.error("Failed to track event:", err));
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
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function renderStars(rating, isDark, accentColor) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        `<span style="color: ${
          filled
            ? "#fbbf24"
            : isDark
            ? "rgba(251, 191, 36, 0.2)"
            : "rgba(251, 191, 36, 0.3)"
        }; font-size: 18px; filter: ${
          filled ? "drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3))" : "none"
        }; transition: all 0.2s ease;">★</span>`
      );
    }
    return stars.join("");
  }

  function generateUUID() {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback to manual UUID generation
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
