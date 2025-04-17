// stores/widgetStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import { WidgetSettings, WidgetTemplate } from "@/types/export-widget";
import { Testimonial } from "@/types/testimonial";

export class WidgetManager {
  widgets: WidgetSettings[] = [];
  activeWidgetId: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  processingStep:
    | "idle"
    | "creating"
    | "updating"
    | "generating"
    | "deploying" = "idle";

  // Premium widget templates with refined defaults
  widgetTemplates: WidgetTemplate[] = [
    {
      id: "spotlight-testimonial",
      type: "spotlight",
      name: "Spotlight Testimonial",
      description:
        "Feature your best testimonial with an elegant spotlight design. Perfect for showcasing social proof on landing pages.",
      thumbnail: "/thumbnails/spotlight.png",
      previewImage: "/previews/spotlight.jpg",
      bestFor: ["Landing Pages", "Featured Sections", "Hero Areas"],
      premium: true,
      popularityScore: 95,
      defaultCustomizations: {
        theme: "premium",
        darkMode: false,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        position: "center",
        autoRotate: false,
        highlightColor: "#8b5cf6",
        fontStyle: "modern",
        width: "full",
        border: true,
        shadow: "xl",
        layout: "standard",
        textAlign: "left",
      },
    },
    {
      id: "video-testimonial",
      type: "video-player",
      name: "Video Testimonial",
      description:
        "A professional video player designed specifically for video testimonials with custom controls and branding options.",
      thumbnail: "/thumbnails/video-player.png",
      previewImage: "/previews/video-player.jpg",
      bestFor: ["Video Testimonials", "Case Studies", "Product Pages"],
      premium: true,
      popularityScore: 92,
      defaultCustomizations: {
        theme: "dark",
        darkMode: true,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "zoom",
        position: "center",
        autoRotate: false,
        highlightColor: "#6366f1",
        fontStyle: "modern",
        width: "full",
        border: false,
        shadow: "lg",
        layout: "expanded",
        textAlign: "left",
      },
    },
    {
      id: "testimonial-carousel",
      type: "carousel",
      name: "Testimonial Carousel",
      description:
        "Showcase multiple testimonials in an elegant, animated carousel with customizable controls and transitions.",
      thumbnail: "/thumbnails/carousel.png",
      previewImage: "/previews/carousel.jpg",
      bestFor: ["Multiple Testimonials", "Homepage", "Social Proof Sections"],
      premium: true,
      popularityScore: 88,
      defaultCustomizations: {
        theme: "modern",
        darkMode: false,
        rounded: "lg",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "slide",
        position: "center",
        autoRotate: true,
        highlightColor: "#10b981",
        fontStyle: "modern",
        width: "full",
        border: true,
        shadow: "md",
        layout: "compact",
        textAlign: "center",
      },
    },
    {
      id: "quote-block",
      type: "quote-block",
      name: "Elegant Quote Block",
      description:
        "A sophisticated, typography-focused design for highlighting powerful testimonial quotes.",
      thumbnail: "/thumbnails/quote-block.png",
      previewImage: "/previews/quote-block.jpg",
      bestFor: ["Text Testimonials", "Press Mentions", "Formal Sites"],
      premium: false,
      popularityScore: 85,
      defaultCustomizations: {
        theme: "elegant",
        darkMode: false,
        rounded: "md",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "fade",
        position: "center",
        autoRotate: false,
        highlightColor: "#4f46e5",
        fontStyle: "serif",
        width: "full",
        border: true,
        shadow: "md",
        layout: "standard",
        textAlign: "left",
      },
    },
    {
      id: "floating-bubble",
      type: "floating-bubble",
      name: "Floating Bubble",
      description:
        "A non-intrusive, floating testimonial bubble that appears on scroll or time delay. Great for conversion focus.",
      thumbnail: "/thumbnails/floating-bubble.png",
      previewImage: "/previews/floating-bubble.jpg",
      bestFor: ["Subtle Promotion", "Checkout Pages", "Long-form Content"],
      premium: true,
      popularityScore: 82,
      defaultCustomizations: {
        theme: "minimal",
        darkMode: false,
        rounded: "xl",
        showAvatar: true,
        showRating: true,
        showCompany: true,
        animation: "slide",
        position: "bottom-right",
        autoRotate: true,
        highlightColor: "#4f46e5",
        fontStyle: "modern",
        width: "sm",
        border: false,
        shadow: "lg",
        layout: "compact",
        textAlign: "left",
      },
    },
  ];

  constructor() {
    makeAutoObservable(this);
    this.loadWidgets();
  }

  setActiveWidget(widgetId: string | null) {
    this.activeWidgetId = widgetId;
  }

  getActiveWidget(): WidgetSettings | null {
    if (!this.activeWidgetId) return null;
    return (
      this.widgets.find((widget) => widget.id === this.activeWidgetId) || null
    );
  }

  getTemplateById(templateId: string): WidgetTemplate | null {
    return (
      this.widgetTemplates.find((template) => template.id === templateId) ||
      null
    );
  }

  getWidgetById(widgetId: string): WidgetSettings | null {
    return this.widgets.find((widget) => widget.id === widgetId) || null;
  }

  getWidgetsByTestimonialId(testimonialId: string): WidgetSettings[] {
    return this.widgets.filter(
      (widget) => widget.testimonialId === testimonialId
    );
  }

  async loadWidgets() {
    this.isLoading = true;
    this.error = null;

    try {
      // In a real application, we would fetch from an API
      // For now, just using mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      runInAction(() => {
        // Mock widgets data with improved structure
        this.widgets = [
          {
            id: "widget-spotlight-1",
            name: "Homepage Hero Spotlight",
            type: "spotlight",
            testimonialId: "testimonial-video-1",
            customizations: {
              theme: "premium",
              darkMode: false,
              rounded: "xl",
              showAvatar: true,
              showRating: true,
              showCompany: true,
              animation: "zoom",
              position: "center",
              autoRotate: false,
              highlightColor: "#8b5cf6",
              fontStyle: "modern",
              width: "full",
              border: true,
              shadow: "xl",
              layout: "standard",
              textAlign: "left",
            },
            usageStats: {
              views: 14253,
              clicks: 2342,
              conversions: 568,
              lastUpdated: new Date().toISOString(),
              conversionRate: 24.2,
              avgEngagementTime: 42,
            },
            embedLocations: ["homepage", "about-us"],
            created: "2025-03-15T12:34:56Z",
            lastModified: "2025-04-05T09:12:34Z",
            version: 3,
          },
          {
            id: "widget-video-1",
            name: "Case Study Video Testimonial",
            type: "video-player",
            testimonialId: "testimonial-video-2",
            customizations: {
              theme: "dark",
              darkMode: true,
              rounded: "lg",
              showAvatar: true,
              showRating: true,
              showCompany: true,
              animation: "zoom",
              position: "center",
              autoRotate: false,
              highlightColor: "#6366f1",
              fontStyle: "modern",
              width: "full",
              border: false,
              shadow: "lg",
              layout: "expanded",
              textAlign: "left",
            },
            usageStats: {
              views: 9872,
              clicks: 1654,
              conversions: 387,
              lastUpdated: new Date().toISOString(),
              conversionRate: 23.4,
              avgEngagementTime: 89,
            },
            embedLocations: ["case-studies", "product-page"],
            created: "2025-03-18T15:24:36Z",
            lastModified: "2025-04-03T11:22:14Z",
            version: 2,
          },
          {
            id: "widget-carousel-1",
            name: "Testimonial Wall Carousel",
            type: "carousel",
            testimonialId: "testimonial-collection-1",
            customizations: {
              theme: "modern",
              darkMode: false,
              rounded: "lg",
              showAvatar: true,
              showRating: true,
              showCompany: true,
              animation: "slide",
              position: "center",
              autoRotate: true,
              highlightColor: "#10b981",
              fontStyle: "modern",
              width: "full",
              border: true,
              shadow: "md",
              layout: "compact",
              textAlign: "center",
            },
            usageStats: {
              views: 18329,
              clicks: 3247,
              conversions: 729,
              lastUpdated: new Date().toISOString(),
              conversionRate: 22.5,
              avgEngagementTime: 56,
            },
            embedLocations: ["testimonials-page", "pricing-page"],
            created: "2025-03-10T09:43:21Z",
            lastModified: "2025-04-07T14:35:47Z",
            version: 5,
          },
        ];

        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Unknown error occurred";
        this.isLoading = false;
      });
    }
  }

  async createWidget(
    testimonial: Testimonial,
    templateId: string,
    name: string
  ) {
    this.isLoading = true;
    this.processingStep = "creating";

    try {
      // Get template for the widget type
      const template = this.getTemplateById(templateId);

      if (!template) {
        throw new Error(`No template found for widget: ${templateId}`);
      }

      // In a real app, we would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 700));

      const newWidget: WidgetSettings = {
        id: `widget-${templateId}-${Date.now()}`,
        name,
        type: template.type,
        testimonialId: testimonial.id,
        customizations: { ...template.defaultCustomizations },
        usageStats: {
          views: 0,
          clicks: 0,
          conversions: 0,
          lastUpdated: new Date().toISOString(),
          conversionRate: 0,
          avgEngagementTime: 0,
        },
        embedLocations: [],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
      };

      runInAction(() => {
        this.widgets.push(newWidget);
        this.activeWidgetId = newWidget.id;
        this.isLoading = false;
        this.processingStep = "idle";
      });

      return newWidget;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Unknown error occurred";
        this.isLoading = false;
        this.processingStep = "idle";
      });
      throw error;
    }
  }

  async updateWidget(widgetId: string, updates: Partial<WidgetSettings>) {
    this.isLoading = true;
    this.processingStep = "updating";

    try {
      // In a real app, we would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 700));

      runInAction(() => {
        const widgetIndex = this.widgets.findIndex((w) => w.id === widgetId);

        if (widgetIndex !== -1) {
          // Update the widget with the new values, ensuring proper type handling
          const currentWidget = this.widgets[widgetIndex];

          this.widgets[widgetIndex] = {
            ...currentWidget,
            ...updates,
            // Ensure nested objects are merged correctly
            customizations: {
              ...currentWidget.customizations,
              ...(updates.customizations || {}),
            },
            usageStats: {
              ...currentWidget.usageStats,
              lastUpdated: new Date().toISOString(),
              ...(updates.usageStats || {}),
            },
            // Increment version
            version: (currentWidget.version || 1) + 1,
            lastModified: new Date().toISOString(),
          };
        }

        this.isLoading = false;
        this.processingStep = "idle";
      });
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Unknown error occurred";
        this.isLoading = false;
        this.processingStep = "idle";
      });
      throw error;
    }
  }

  async deleteWidget(widgetId: string) {
    this.isLoading = true;

    try {
      // In a real app, we would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 700));

      runInAction(() => {
        this.widgets = this.widgets.filter((w) => w.id !== widgetId);

        if (this.activeWidgetId === widgetId) {
          this.activeWidgetId = null;
        }

        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Unknown error occurred";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async addEmbedLocation(widgetId: string, location: string) {
    const widget = this.getWidgetById(widgetId);

    if (widget && !widget.embedLocations.includes(location)) {
      await this.updateWidget(widgetId, {
        embedLocations: [...widget.embedLocations, location],
      });
    }
  }

  async removeEmbedLocation(widgetId: string, location: string) {
    const widget = this.getWidgetById(widgetId);

    if (widget) {
      await this.updateWidget(widgetId, {
        embedLocations: widget.embedLocations.filter((loc) => loc !== location),
      });
    }
  }

  // Generate embed code for a widget with improved formatting and options
  generateEmbedCode(
    widgetId: string,
    options: { format?: "html" | "react" | "script" } = {}
  ) {
    const widget = this.getWidgetById(widgetId);
    const format = options.format || "html";

    if (!widget) return "";

    if (format === "react") {
      return `import { TestimonialWidget } from '@yourcompany/testimonial-widgets';

export default function YourComponent() {
  return (
    <TestimonialWidget
      widgetId="${widget.id}"
      type="${widget.type}"
      testimonialId="${widget.testimonialId}"
      theme="${widget.customizations.theme}"
      darkMode={${widget.customizations.darkMode}}
      rounded="${widget.customizations.rounded}"
      showAvatar={${widget.customizations.showAvatar}}
      showRating={${widget.customizations.showRating}}
      showCompany={${widget.customizations.showCompany}}
      animation="${widget.customizations.animation}"
      position="${widget.customizations.position}"
      autoRotate={${widget.customizations.autoRotate}}
      highlightColor="${widget.customizations.highlightColor}"
      fontStyle="${widget.customizations.fontStyle}"
      width="${widget.customizations.width}"
      border={${widget.customizations.border}}
      shadow="${widget.customizations.shadow}"
      ${widget.customizations.layout ? `layout="${widget.customizations.layout}"` : ""}
      ${widget.customizations.textAlign ? `textAlign="${widget.customizations.textAlign}"` : ""}
    />
  );
}`;
    } else if (format === "script") {
      return `<script>
  (function(w, d, s, o) {
    var j = d.createElement(s); j.async = true; j.src = 'https://cdn.yourdomain.com/testimonial-widgets.js';
    var p = d.getElementsByTagName(s)[0]; p.parentNode.insertBefore(j, p);
    w.TestimonialWidgetConfig = w.TestimonialWidgetConfig || {};
    w.TestimonialWidgetConfig['${widget.id}'] = o;
  })(window, document, 'script', ${JSON.stringify({
    widgetId: widget.id,
    type: widget.type,
    testimonialId: widget.testimonialId,
    customizations: widget.customizations,
  })});
</script>
<div id="testimonial-widget-${widget.id}"></div>`;
    } else {
      // Default HTML format
      return `<div 
  class="testimonial-widget"
  data-widget-id="${widget.id}"
  data-widget-type="${widget.type}"
  data-testimonial-id="${widget.testimonialId}"
  data-theme="${widget.customizations.theme}"
  data-dark-mode="${widget.customizations.darkMode}"
  data-rounded="${widget.customizations.rounded}"
  data-show-avatar="${widget.customizations.showAvatar}"
  data-show-rating="${widget.customizations.showRating}"
  data-show-company="${widget.customizations.showCompany}"
  data-animation="${widget.customizations.animation}"
  data-position="${widget.customizations.position}"
  data-auto-rotate="${widget.customizations.autoRotate}"
  data-highlight-color="${widget.customizations.highlightColor}"
  data-font-style="${widget.customizations.fontStyle}"
  data-width="${widget.customizations.width}"
  data-border="${widget.customizations.border}"
  data-shadow="${widget.customizations.shadow}"
  ${widget.customizations.layout ? `data-layout="${widget.customizations.layout}"` : ""}
  ${widget.customizations.textAlign ? `data-text-align="${widget.customizations.textAlign}"` : ""}
>
</div>
<script src="https://cdn.yourdomain.com/testimonial-widgets.js"></script>`;
    }
  }

  // Analytics methods
  async logWidgetView(widgetId: string) {
    const widget = this.getWidgetById(widgetId);

    if (widget) {
      await this.updateWidget(widgetId, {
        usageStats: {
          ...widget.usageStats,
          views: widget.usageStats.views + 1,
        },
      });
    }
  }

  async logWidgetClick(widgetId: string) {
    const widget = this.getWidgetById(widgetId);

    if (widget) {
      await this.updateWidget(widgetId, {
        usageStats: {
          ...widget.usageStats,
          clicks: widget.usageStats.clicks + 1,
        },
      });
    }
  }

  async logWidgetConversion(widgetId: string) {
    const widget = this.getWidgetById(widgetId);

    if (widget) {
      const newConversions = widget.usageStats.conversions + 1;
      const conversionRate =
        widget.usageStats.views > 0
          ? (newConversions / widget.usageStats.views) * 100
          : 0;

      await this.updateWidget(widgetId, {
        usageStats: {
          ...widget.usageStats,
          conversions: newConversions,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
        },
      });
    }
  }
}
