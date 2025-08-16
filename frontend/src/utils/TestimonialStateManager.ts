// utils/TestimonialStateManager.ts
import { Testimonial } from "@/types/testimonial";

/**
 * Manages testimonial selection state across different pages/components
 * Uses URL params and localStorage for persistence across page refreshes
 */
export class TestimonialStateManager {
  private static readonly STORAGE_KEY = "ai_studio_selected_testimonials";
  private static readonly URL_PARAM = "testimonials";

  /**
   * Save selected testimonials to localStorage and URL
   */
  static saveSelectedTestimonials(testimonialIds: string[]): void {
    try {
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(testimonialIds));

      // Update URL params without navigation
      const url = new URL(window.location.href);
      if (testimonialIds.length > 0) {
        url.searchParams.set(this.URL_PARAM, testimonialIds.join(","));
      } else {
        url.searchParams.delete(this.URL_PARAM);
      }

      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      console.error("Failed to save selected testimonials:", error);
    }
  }

  /**
   * Load selected testimonials from URL params or localStorage
   */
  static loadSelectedTestimonials(): string[] {
    try {
      // First try URL params (takes precedence)
      const urlParams = new URLSearchParams(window.location.search);
      const urlTestimonials = urlParams.get(this.URL_PARAM);

      if (urlTestimonials) {
        const ids = urlTestimonials.split(",").filter((id) => id.trim());
        // Save to localStorage for consistency
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
        return ids;
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load selected testimonials:", error);
      return [];
    }
  }

  /**
   * Clear all selected testimonials
   */
  static clearSelectedTestimonials(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete(this.URL_PARAM);
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      console.error("Failed to clear selected testimonials:", error);
    }
  }

  /**
   * Navigate to AI Studio with selected testimonials
   */
  static navigateToAIStudio(testimonialIds: string[]): void {
    this.saveSelectedTestimonials(testimonialIds);

    // Construct AI Studio URL with testimonials
    const url = new URL("/studio", window.location.origin);
    if (testimonialIds.length > 0) {
      url.searchParams.set(this.URL_PARAM, testimonialIds.join(","));
    }

    window.location.href = url.toString();
  }

  /**
   * Get testimonials data by IDs from the workspace manager
   */
  static getTestimonialsByIds(
    testimonialIds: string[],
    allTestimonials: Testimonial[]
  ): Testimonial[] {
    if (!testimonialIds.length || !allTestimonials.length) return [];

    return allTestimonials.filter((testimonial) =>
      testimonialIds.includes(testimonial.id)
    );
  }

  /**
   * Update testimonial selection (add/remove)
   */
  static toggleTestimonialSelection(testimonialId: string): string[] {
    const current = this.loadSelectedTestimonials();
    let updated: string[];

    if (current.includes(testimonialId)) {
      updated = current.filter((id) => id !== testimonialId);
    } else {
      updated = [...current, testimonialId];
    }

    this.saveSelectedTestimonials(updated);
    return updated;
  }

  /**
   * Select all testimonials
   */
  static selectAllTestimonials(testimonialIds: string[]): void {
    this.saveSelectedTestimonials(testimonialIds);
  }

  /**
   * Check if testimonial is selected
   */
  static isTestimonialSelected(testimonialId: string): boolean {
    const selected = this.loadSelectedTestimonials();
    return selected.includes(testimonialId);
  }
}
