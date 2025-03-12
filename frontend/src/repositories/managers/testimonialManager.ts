import { WorkspaceRepository } from "../workspaceRepository";
import { Testimonial } from "@/types/testimonial";
import { MembersManager } from "./memberManager";

export class TestimonialManager {
  testimonials: Testimonial[] | null = null;
  loading_testimonials = true;

  private workspaceRepository: WorkspaceRepository;
  private membersManager: MembersManager;

  constructor(workspaceRepository: WorkspaceRepository) {
    this.workspaceRepository = workspaceRepository;
    this.membersManager = workspaceRepository.membersManager;
  }

  async getTestimonials() {
    const workspaceID = this.membersManager.member?.workspace_id;

    const url = `${this.workspaceRepository.server}/${workspaceID}/testimonials`;
    const { token } = await this.workspaceRepository.getFirebaseToken();

    this.loading_testimonials = true;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const testimonials = (await response.json()) as Testimonial[];
        this.testimonials = testimonials;
        return testimonials;
      }
      console.log("response", await response.json());
      throw new Error("could not get testimonials");
    } catch (error) {
      throw error;
    } finally {
      this.loading_testimonials = false;
    }
  }
}
