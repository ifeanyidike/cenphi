import {
  AnalysisType,
  Testimonial,
  TestimonialAnalysis,
} from "@/types/testimonial";
import { makeAutoObservable, runInAction } from "mobx";

export class AnalysisManager {
  activeAnalysis: AnalysisType | null = null;
  isAnalyzing: boolean = false;
  // store raw analysis data or API responses
  analysisResults: Record<AnalysisType, any> = {} as Record<AnalysisType, any>;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveAnalysis(type: AnalysisType | null) {
    this.activeAnalysis = type;
  }

  getTranscript(testimonial: Testimonial) {
    if (testimonial.format === "video" || testimonial.format === "audio") {
      return testimonial.transcript || "";
    }
    return testimonial.content || "";
  }

  /**
   * Runs or retrieves analysis for a given testimonial.
   * If Testimonial has existing analyses, use them; otherwise, mock or fetch.
   */
  async runAnalysis(type: AnalysisType, testimonial: Testimonial) {
    if (!testimonial) return;
    this.isAnalyzing = true;

    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      runInAction(() => {
        // Try to find existing analysis of this type
        const existing: TestimonialAnalysis | undefined =
          testimonial.analyses?.find(
            (a) => a.analysis_type === type
          ) as TestimonialAnalysis;

        if (existing) {
          // Use stored analysis_data if available, else use full object
          this.analysisResults[type] = existing.analysis_data ?? existing;
        } else {
          // Fallback to mock analysis
          switch (type) {
            case "sentiment":
              this.analysisResults[type] = {
                score: 0.75,
                label: "positive",
                breakdown: { positive: 0.82, negative: 0.07, neutral: 0.11 },
              };
              break;

            case "key_insights":
              this.analysisResults[type] = [
                "Customer emphasizes exceptional quality",
                "Service speed was highlighted multiple times",
                "Price-to-value ratio mentioned positively",
                "Likely to generate referrals based on enthusiasm",
              ];
              break;

            case "transcript":
              // Pull transcript/text from testimonial based on format

              const transcript = this.getTranscript(testimonial);

              this.analysisResults[type] = {
                transcript,
                confidence: 0.94,
                speakerSegments: [
                  {
                    speaker: "Customer",
                    start: 0,
                    end: transcript.length,
                    text: transcript,
                  },
                ],
              };
              break;

            case "engagement":
              this.analysisResults[type] = {
                overallScore: 87,
                metrics: {
                  viewCompletion: 0.89,
                  shareRate: 0.12,
                  conversionImpact: 0.34,
                  audienceRetention: 0.76,
                },
                trends: { weekly: "+12%", monthly: "+8%" },
              };
              break;

            default:
              this.analysisResults[type] = {
                message: "Analysis complete",
                timestamp: new Date().toISOString(),
              };
          }
        }

        this.isAnalyzing = false;
      });
    } catch (error) {
      runInAction(() => {
        this.analysisResults[type] = {
          error: "Analysis failed",
          details: error,
        };
        this.isAnalyzing = false;
      });
    }
  }

  clearAnalysis() {
    this.activeAnalysis = null;
    this.analysisResults = {} as Record<AnalysisType, any>;
  }
}
