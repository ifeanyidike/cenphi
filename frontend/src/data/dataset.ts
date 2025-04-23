import { Testimonial, TestimonialAnalysis } from "@/types/testimonial"; // Import your type definitions
import { Avatar } from "antd";

// Sample avatar URLs
const avatars = {
  avatar1: "/media/avatars/user/1.jpg",
  avatar2: "/media/avatars/user/2.jpg",
  avatar3: "/media/avatars/user/3.jpg",
  avatar4: "/media/avatars/user/4.jpg",
  avatar5: "/media/avatars/user/5.jpg",
  avatar6: "/media/avatars/user/1.jpg",
  avatar7: "/media/avatars/user/2.jpg",
  avatar8: "/media/avatars/user/3.jpg",
  avatar9: "/media/avatars/user/4.jpg",
  avatar10: "/media/avatars/user/5.jpg",
  placeholder: "/api/placeholder/50/50"
};

// Comprehensive testimonial dataset with correct analysis structure
const testimonialDatasets: Testimonial[] = [
  {
    id: "uuid-001",
    workspace_id: "acme-corp1",
    testimonial_type: "customer", // TestimonialType
    format: "text", // ContentFormat
    status: "approved", // ContentStatus
    language: "en",
    rating: 5.0,
    collection_method: "api", // CollectionMethod
    title: "How Company 1 Inc. Enhanced Their Workflow",
    content: "Company 1 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full text transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-001",
      workspace_id: "acme-corp",
      external_id: "customer-001",
      name: "Aja Ogonnaya Edward",
      avatar_url: "/avatars/avatar1.jpg",
      company: "Company 1 Inc.",
      industry: "Education",
      location: "Chicago, IL",
      title: "CTO",
      email: "user1@company1inc.com",
      social_profiles: {
        linkedin: "user1",
        twitter: "@techguru"
      },
      custom_fields: {
        customer_since: "2023",
        plan: "Enterprise",
        usage_level: "Low",
        region: "IL"
      },
      created_at: new Date("2025-04-01"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-1-inc.-story.mp4",
      "/media/thumbnails/company-1-inc.-1.jpg",
      "/media/thumbnails/company-1-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-1-inc.-story.mp4",
    verification_method: "email", // VerificationType
    verification_status: "verified",
    verified_at: new Date("2024-12-16"),
    published: true,
    published_at: new Date("2025-04-01"),
    scheduled_publish_at: new Date("2025-04-01"),
    view_count: 3228,
    share_count: 65,
    conversion_count: 42,
    created_at: new Date("2025-04-01"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    engagement_metrics: {
      click_rate: 0.12,
      share_rate: 0.05,
      avg_view_time: 145,
      completion_rate: 0.78
    },
    // correctly structured analyses array following TestimonialAnalysis type
    analyses: [
      {
        id: "analysis-sentiment-001",
        testimonial_id: "uuid-001",
        analysis_type: "sentiment", // AnalysisType
        sentiment_score: 0.87, // Direct sentiment_score property
        analysis_data: {
          sentiment: {
            label: "positive", // Sentiment type
            score: 0.87,
            count: 8,
            keywords: [
              "transformed",
              "boosted",
              "improved"
            ]
          }
        },
        created_at: new Date("2025-01-09")
      },
      {
        id: "analysis-narrative-001",
        testimonial_id: "uuid-001",
        analysis_type: "narrative", // AnalysisType
        narrative_score: 0.92,
        analysis_data: {
          story_elements: {
            problem_statement: true,
            solution_presented: true,
            results_described: true
          },
          key_themes: ["efficiency", "workflow improvement", "satisfaction"],
          narrative_strength: "strong"
        },
        created_at: new Date("2025-01-09")
      }
    ]
  },
  // Additional testimonials with similar structure
{
  id: "uuid-010",
  workspace_id: "Mumbai-corp10",
  testimonial_type: "customer",
  format: "audio",  
  status: "scheduled",
  language: "FR",
  rating: 3.0,
  collection_method: "email",
  title: "How Company 1 Inc. Enhanced Their Workflow",
  content: "Company 1 Inc. saw a massive improvement in efficiency and user satisfaction after implementation. The platform was incredibly intuitive and our team adapted to it within days, not weeks. Customer service was also outstanding throughout the onboarding process.",
  summary: "Highly satisfied with the solution!",
  transcript: "Full text transcript describing the use case and improvements...",
  customer_profile: {
    id: "customer-uuid-010",
    workspace_id: "Mumbai-corp",
    external_id: "customer-010",
    name: "Jennet Okoronkwo Benjamin",
    avatar_url: avatars.avatar4,
    company: "Company 1 Inc.",
    industry: "Engineering",
    location: "New York, IL",
    title: "Admin",
    email: "user1@company10inc.com",
    social_profiles: {
      linkedin: "user10",
      twitter: "@techguru"
    },
    custom_fields: {
      customer_since: "2024",
      plan: "basic",
      usage_level: "High",
      region: "NY"
    },
    created_at: new Date("2025-04-01"),
    updated_at: new Date("2025-01-09")
  },
  media_urls: [
    "/media/videos/testimonials/company-1-inc.-story.mp4",
    "/media/thumbnails/company-1-inc.-1.jpg"
  ],
  media_url: "/media/videos/testimonials/company-1-inc.-story.mp4",
  verification_method: "email",
  verification_status: "verified",
  verified_at: new Date("2024-12-16"),
  published: true,
  published_at: new Date("2025-04-01"),
  scheduled_publish_at: new Date("2025-04-01"),
  view_count: 3228,
  share_count: 65,
  conversion_count: 42,
  created_at: new Date("2025-04-01"),
  updated_at: new Date("2025-01-09"),
  verification_data: {
    verified_by: "admin",
    verification_date: new Date("2024-12-16"),
    verification_notes: "Verified by email confirmation."
  },
  engagement_metrics: {
    click_rate: 0.12,
    share_rate: 0.05,
    avg_view_time: 145,
    completion_rate: 0.78
  },
  analyses: [
    {
      id: "analysis-sentiment-001",
      testimonial_id: "uuid-001",
      analysis_type: "sentiment",
      sentiment_score: 0.87,
      analysis_data: {
        sentiment: {
          label: "positive",
          score: 0.87,
          count: 8,
          keywords: [
            "transformed",
            "boosted",
            "improved",
            "intuitive"
          ]
        }
      },
      created_at: new Date("2025-01-09")
    }
  ]
},

// Additional entries
{
  id: "uuid-002",
  workspace_id: "acme-corp2",
  testimonial_type: "customer",
  format: "video",
  status: "approved",
  language: "en",
  rating: 4.8,
  collection_method: "interview",
  title: "GlobalTech's Digital Transformation Journey",
  content: "The implementation was seamless and our productivity increased by 35% in the first quarter alone. The analytics dashboard gives us insights we never had before, allowing us to make data-driven decisions quickly.",
  summary: "Dramatic productivity increase after implementation",
  transcript: "Detailed transcript of the video testimonial covering their implementation experience...",
  customer_profile: {
    id: "customer-uuid-002",
    workspace_id: "acme-corp",
    external_id: "customer-002",
    name: "Sarah Chen",
    avatar_url: "/avatars/avatar2.jpg",
    company: "GlobalTech Solutions",
    industry: "Technology",
    location: "San Francisco, CA",
    title: "Director of Operations",
    email: "schen@globaltech.com",
    social_profiles: {
      linkedin: "sarahchen",
      twitter: "@schen_tech"
    },
    custom_fields: {
      customer_since: "2024",
      plan: "Professional",
      usage_level: "Medium",
      region: "CA"
    },
    created_at: new Date("2024-07-15"),
    updated_at: new Date("2025-01-12")
  },
  media_urls: [
    "/media/videos/testimonials/globaltech-case-study.mp4",
    "/media/thumbnails/globaltech-thumb.jpg"
  ],
  media_url: "/media/videos/testimonials/globaltech-case-study.mp4",
  verification_method: "order_verification",
  verification_status: "verified",
  verified_at: new Date("2024-12-20"),
  published: true,
  published_at: new Date("2025-01-15"),
  scheduled_publish_at: new Date("2025-01-15"),
  view_count: 2145,
  share_count: 87,
  conversion_count: 31,
  created_at: new Date("2024-12-10"),
  updated_at: new Date("2025-01-15"),
  verification_data: {
    verified_by: "manager",
    verification_date: new Date("2024-12-20"),
    verification_notes: "Verified via video call with client."
  },
  engagement_metrics: {
    click_rate: 0.18,
    share_rate: 0.08,
    avg_view_time: 210,
    completion_rate: 0.82
  },
  analyses: [
    {
      id: "analysis-sentiment-002",
      testimonial_id: "uuid-002",
      analysis_type: "sentiment",
      sentiment_score: 0.92,
      analysis_data: {
        sentiment: {
          label: "very positive",
          score: 0.92,
          count: 10,
          keywords: [
            "seamless",
            "increased",
            "insights",
            "data-driven"
          ]
        }
      },
      created_at: new Date("2025-01-16")
    }
  ]
},

{
  id: "uuid-003",
  workspace_id: "acme-corp3",
  testimonial_type: "partner",
  format: "audio",
  status: "approved",
  language: "es",
  rating: 4.5,
  collection_method: "survey",
  title: "Grupo Innova: Aumentando La Eficiencia",
  content: "La integración con nuestros sistemas existentes fue sorprendentemente fácil. El equipo de soporte siempre estuvo disponible para resolver cualquier problema que surgiera durante la implementación.",
  summary: "Integración fácil con soporte excepcional",
  transcript: "Transcripción completa de la entrevista sobre la experiencia de integración...",
  customer_profile: {
    id: "customer-uuid-003",
    workspace_id: "acme-corp",
    external_id: "partner-001",
    name: "Miguel Hernandez",
    avatar_url: "/avatars/avatar3.jpg",
    company: "Grupo Innova",
    industry: "Manufacturing",
    location: "Mexico City, Mexico",
    title: "Chief Innovation Officer",
    email: "mhernandez@grupoinnova.mx",
    social_profiles: {
      linkedin: "miguelhernandez",
      twitter: "@mhernandez_innov"
    },
    custom_fields: {
      customer_since: "2023",
      plan: "Enterprise",
      usage_level: "High",
      region: "LATAM"
    },
    created_at: new Date("2023-09-01"),
    updated_at: new Date("2024-12-05")
  },
  media_urls: [
    "/media/audio/testimonials/grupo-innova-testimonio.mp3",
    "/media/thumbnails/grupo-innova-logo.jpg"
  ],
  media_url: "/media/audio/testimonials/grupo-innova-testimonio.mp3",
  verification_method: "phone",
  verification_status: "verified",
  verified_at: new Date("2024-11-30"),
  published: true,
  published_at: new Date("2024-12-07"),
  scheduled_publish_at: new Date("2024-12-07"),
  view_count: 1547,
  share_count: 43,
  conversion_count: 18,
  created_at: new Date("2024-11-15"),
  updated_at: new Date("2024-12-07"),
  verification_data: {
    verified_by: "admin",
    verification_date: new Date("2024-11-30"),
    verification_notes: "Verified through phone call with partner."
  },
  engagement_metrics: {
    click_rate: 0.09,
    share_rate: 0.04,
    avg_view_time: 165,
    completion_rate: 0.72
  },
  analyses: [
    {
      id: "analysis-sentiment-003",
      testimonial_id: "uuid-003",
      analysis_type: "sentiment",
      sentiment_score: 0.81,
      analysis_data: {
        sentiment: {
          label: "positive",
          score: 0.81,
          count: 6,
          keywords: [
            "sorprendentemente",
            "fácil",
            "siempre",
            "resolver"
          ]
        }
      },
      created_at: new Date("2024-12-08")
    }
  ]
},

{
  id: "uuid-004",
  workspace_id: "acme-corp4",
  testimonial_type: "customer",
  format: "text",
  status: "approved",
  language: "en",
  rating: 5.0,
  collection_method: "email",
  title: "How Nordic Health Revolutionized Patient Care",
  content: "The AI-powered analytics have completely transformed how we approach patient care. We're now able to identify trends and potential issues days before they would have been noticed previously. The ROI has been tremendous both financially and in terms of patient outcomes.",
  summary: "Game-changing analytics for healthcare",
  transcript: "Complete email exchange discussing the implementation and results...",
  customer_profile: {
    id: "customer-uuid-004",
    workspace_id: "acme-corp",
    external_id: "customer-004",
    name: "Lars Johansson",
    avatar_url: "/avatars/avatar4.jpg",
    company: "Nordic Health Systems",
    industry: "Healthcare",
    location: "Stockholm, Sweden",
    title: "Head of Technology",
    email: "l.johansson@nordichealth.se",
    social_profiles: {
      linkedin: "larsjohansson",
      twitter: "@ljohanssonhealth"
    },
    custom_fields: {
      customer_since: "2022",
      plan: "Enterprise",
      usage_level: "Very High",
      region: "Nordics"
    },
    created_at: new Date("2022-06-15"),
    updated_at: new Date("2025-02-20")
  },
  media_urls: [
    "/media/case-studies/nordic-health-study.pdf",
    "/media/thumbnails/nordic-health-logo.jpg"
  ],
  media_url: "/media/case-studies/nordic-health-study.pdf",
  verification_method: "email",
  verification_status: "verified",
  verified_at: new Date("2025-02-15"),
  published: true,
  published_at: new Date("2025-02-22"),
  scheduled_publish_at: new Date("2025-02-22"),
  view_count: 4327,
  share_count: 112,
  conversion_count: 58,
  created_at: new Date("2025-01-30"),
  updated_at: new Date("2025-02-22"),
  verification_data: {
    verified_by: "director",
    verification_date: new Date("2025-02-15"),
    verification_notes: "Verified with written approval from customer."
  },
  engagement_metrics: {
    click_rate: 0.22,
    share_rate: 0.11,
    avg_view_time: 230,
    completion_rate: 0.85
  },
  analyses: [
    {
      id: "analysis-sentiment-004",
      testimonial_id: "uuid-004",
      analysis_type: "sentiment",
      sentiment_score: 0.95,
      analysis_data: {
        sentiment: {
          label: "very positive",
          score: 0.95,
          count: 12,
          keywords: [
            "transformed",
            "tremendous",
            "revolutionized",
            "game-changing"
          ]
        }
      },
      created_at: new Date("2025-02-23")
    }
  ]
},

{
  id: "uuid-005",
  workspace_id: "acme-corp5",
  testimonial_type: "customer",
  format: "video",
  status: "pending",
  language: "fr",
  rating: 4.2,
  collection_method: "interview",
  title: "L'Expérience de Groupe Finance avec Notre Plateforme",
  content: "L'intégration a nécessité plus de temps que prévu, mais une fois terminée, les résultats ont dépassé nos attentes. Notre équipe apprécie particulièrement la fonction de reporting automatisée.",
  summary: "Résultats impressionnants malgré une intégration complexe",
  transcript: "Transcription complète de l'interview vidéo...",
  customer_profile: {
    id: "customer-uuid-005",
    workspace_id: "acme-corp",
    external_id: "customer-005",
    name: "Sophie Dubois",
    avatar_url: "/avatars/avatar5.jpg",
    company: "Groupe Finance Paris",
    industry: "Financial Services",
    location: "Paris, France",
    title: "CFO",
    email: "s.dubois@groupefinance.fr",
    social_profiles: {
      linkedin: "sophiedubois",
      twitter: "@sdubois_finance"
    },
    custom_fields: {
      customer_since: "2024",
      plan: "Professional",
      usage_level: "Medium",
      region: "Europe"
    },
    created_at: new Date("2024-08-10"),
    updated_at: new Date("2025-03-05")
  },
  media_urls: [
    "/media/videos/testimonials/groupe-finance-interview.mp4",
    "/media/thumbnails/groupe-finance-thumb.jpg"
  ],
  media_url: "/media/videos/testimonials/groupe-finance-interview.mp4",
  verification_method: "employee_verification",
  verification_status: "pending",
  verified_at: new Date("2025-04-23"),
  published: false,
  published_at: new Date("2025-03-10"),
  scheduled_publish_at: new Date("2025-04-10"),
  view_count: 0,
  share_count: 0,
  conversion_count: 0,
  created_at: new Date("2025-03-01"),
  updated_at: new Date("2025-03-05"),
  verification_data: {
    verified_by: null,
    verification_date: null,
    verification_notes: "Waiting for final approval from client."
  },
  engagement_metrics: {
    click_rate: 0,
    share_rate: 0,
    avg_view_time: 0,
    completion_rate: 0
  },
  analyses: [
    {
      id: "analysis-sentiment-005",
      testimonial_id: "uuid-005",
      analysis_type: "sentiment",
      sentiment_score: 0.71,
      analysis_data: {
        sentiment: {
          label: "moderately positive",
          score: 0.71,
          count: 5,
          keywords: [
            "dépassé",
            "attentes",
            "apprécie",
            "impressionnants"
          ]
        }
      },
      created_at: new Date("2025-03-06")
    }
  ]
},

{
  id: "uuid-006",
  workspace_id: "acme-corp6",
  testimonial_type: "case_study",
  format: "video",
  status: "approved",
  language: "en",
  rating: 4.9,
  collection_method: "screen_recording",
  title: "Australian Energy: A Complete Digital Transformation",
  content: "This comprehensive case study details how Australian Energy transformed their operations through our platform, resulting in a 27% reduction in operational costs and a 40% improvement in customer satisfaction scores within 6 months.",
  summary: "Dramatic operational improvements for major utility company",
  transcript: "Full case study document with detailed metrics and ROI analysis...",
  customer_profile: {
    id: "customer-uuid-006",
    workspace_id: "acme-corp",
    external_id: "customer-006",
    name: "David Miller",
    avatar_url: "/avatars/avatar6.jpg",
    company: "Australian Energy Corporation",
    industry: "Utilities",
    location: "Sydney, Australia",
    title: "Digital Transformation Director",
    email: "d.miller@ausenergy.com.au",
    social_profiles: {
      linkedin: "davidmiller",
      twitter: "@dmiller_energy"
    },
    custom_fields: {
      customer_since: "2023",
      plan: "Enterprise Plus",
      usage_level: "Very High",
      region: "ANZ"
    },
    created_at: new Date("2023-05-20"),
    updated_at: new Date("2025-03-15")
  },
  media_urls: [
    "/media/case-studies/australian-energy-full-case.pdf",
    "/media/presentations/australian-energy-slides.pptx",
    "/media/thumbnails/australian-energy-thumb.jpg"
  ],
  media_url: "/media/case-studies/australian-energy-full-case.pdf",
  verification_method: "social_login",
  verification_status: "verified",
  verified_at: new Date("2025-03-10"),
  published: true,
  published_at: new Date("2025-03-15"),
  scheduled_publish_at: new Date("2025-03-15"),
  view_count: 2876,
  share_count: 135,
  conversion_count: 62,
  created_at: new Date("2025-02-20"),
  updated_at: new Date("2025-03-15"),
  verification_data: {
    verified_by: "executive",
    verification_date: new Date("2025-03-10"),
    verification_notes: "Approved by customer's executive team with written confirmation."
  },
  engagement_metrics: {
    click_rate: 0.24,
    share_rate: 0.12,
    avg_view_time: 310,
    completion_rate: 0.68
  },
  analyses: [
    {
      id: "analysis-sentiment-006",
      testimonial_id: "uuid-006",
      analysis_type: "sentiment",
      sentiment_score: 0.93,
      analysis_data: {
        sentiment: {
          label: "very positive",
          score: 0.93,
          count: 14,
          keywords: [
            "transformed",
            "improvement",
            "reduction",
            "dramatic"
          ]
        }
      },
      created_at: new Date("2025-03-16")
    }
  ]
},

{
  id: "uuid-007",
  workspace_id: "acme-corp7",
  testimonial_type: "customer",
  format: "text",
  status: "rejected",
  language: "en",
  rating: 3.2,
  collection_method: "survey",
  title: "MediaMax's Implementation Experience",
  content: "While the platform has some strong features, we encountered several challenges during implementation. The onboarding could be improved, and some promised features were not as robust as initially presented.",
  summary: "Mixed implementation experience with room for improvement",
  transcript: "Complete survey response with detailed feedback...",
  customer_profile: {
    id: "customer-uuid-007",
    workspace_id: "acme-corp",
    external_id: "customer-007",
    name: "Alex Johnson",
    avatar_url: "/avatars/avatar7.jpg",
    company: "MediaMax Productions",
    industry: "Media & Entertainment",
    location: "Los Angeles, CA",
    title: "IT Director",
    email: "ajohnson@mediamax.com",
    social_profiles: {
      linkedin: "alexjohnson",
      twitter: "@aj_mediatech"
    },
    custom_fields: {
      customer_since: "2024",
      plan: "Advanced",
      usage_level: "Low",
      region: "West"
    },
    created_at: new Date("2024-11-10"),
    updated_at: new Date("2025-01-25")
  },
  media_urls: [ "/media/presentations/australian-energy-slides.pptx"],
  media_url:  "/media/presentations/australian-energy-slides.pptx",
  verification_method: "email",
  verification_status: "unverified",
  verified_at: new Date("2025-01-20"),
  published: false,
  published_at: new Date("2025-01-20"),
  scheduled_publish_at: new Date("2025-01-20"),
  view_count: 0,
  share_count: 0,
  conversion_count: 0,
  created_at: new Date("2025-01-20"),
  updated_at: new Date("2025-01-25"),
  verification_data: {
    verified_by: null,
    verification_date: null,
    verification_notes: "Rejected due to negative sentiment; customer being contacted for follow-up."
  },
  engagement_metrics: {
    click_rate: 0,
    share_rate: 0,
    avg_view_time: 0,
    completion_rate: 0
  },
  analyses: [
    {
      id: "analysis-sentiment-007",
      testimonial_id: "uuid-007",
      analysis_type: "sentiment",
      sentiment_score: 0.35,
      analysis_data: {
        sentiment: {
          label: "negative",
          score: 0.35,
          count: 5,
          keywords: [
            "challenges",
            "improved",
            "not as robust",
            "room for improvement"
          ]
        }
      },
      created_at: new Date("2025-01-26")
    }
  ]
},

{
  id: "uuid-008",
  workspace_id: "acme-corp8",
  testimonial_type: "partner",
  format: "video",
  status: "approved",
  language: "de",
  rating: 4.7,
  collection_method: "interview",
  title: "Wie Deutsche Technik AG Ihre Effizienz Steigerte",
  content: "Die Partnerschaft hat es uns ermöglicht, unsere Dienstleistungen zu erweitern und neue Märkte zu erschließen. Die API-Integration war nahtlos und die Schulungsressourcen waren hervorragend.",
  summary: "Erfolgreiche Partnerschaft mit exzellenter technischer Integration",
  transcript: "Vollständige Transkription des Partnerinterviews auf der Tech-Konferenz...",
  customer_profile: {
    id: "customer-uuid-008",
    workspace_id: "acme-corp",
    external_id: "partner-002",
    name: "Thomas Müller",
    avatar_url: "/avatars/avatar8.jpg",
    company: "Deutsche Technik AG",
    industry: "Technology",
    location: "Munich, Germany",
    title: "CTO",
    email: "t.mueller@deutschetechnik.de",
    social_profiles: {
      linkedin: "thomasmueller",
      twitter: "@tmueller_tech"
    },
    custom_fields: {
      customer_since: "2023",
      plan: "Partner Elite",
      usage_level: "High",
      region: "DACH"
    },
    created_at: new Date("2023-10-15"),
    updated_at: new Date("2025-02-28")
  },
  media_urls: [
    "/media/videos/testimonials/deutsche-technik-interview.mp4",
    "/media/thumbnails/deutsche-technik-thumb.jpg"
  ],
  media_url: "/media/videos/testimonials/deutsche-technik-interview.mp4",
  verification_method: "phone",
  verification_status: "verified",
  verified_at: new Date("2025-02-25"),
  published: true,
  published_at: new Date("2025-03-01"),
  scheduled_publish_at: new Date("2025-03-01"),
  view_count: 1876,
  share_count: 54,
  conversion_count: 29,
  created_at: new Date("2025-02-20"),
  updated_at: new Date("2025-03-01"),
  verification_data: {
    verified_by: "partner_manager",
    verification_date: new Date("2025-02-25"),
    verification_notes: "Recorded live at TechConnect Berlin 2025."
  },
  engagement_metrics: {
    click_rate: 0.16,
    share_rate: 0.07,
    avg_view_time: 185,
    completion_rate: 0.79
  },
  analyses: [
    {
      id: "analysis-sentiment-008",
      testimonial_id: "uuid-008",
      analysis_type: "sentiment",
      sentiment_score: 0.89,
      analysis_data: {
        sentiment: {
          label: "very positive",
          score: 0.89,
          count: 7,
          keywords: [
            "nahtlos",
            "hervorragend",
            "erfolgreiche",
            "exzellenter"
          ]
        }
      },
      created_at: new Date("2025-03-02")
    }
  ]
},

{
  id: "uuid-009",
  workspace_id: "acme-corp9",
  testimonial_type: "customer",
  format: "audio",
  status: "approved",
  language: "en",
  rating: 4.6,
  collection_method: "website",
  title: "EcoRetail's Sustainability Transformation",
  content: "The analytics platform helped us identify wasteful practices we weren't even aware of. Within three months, we reduced our carbon footprint by 22% while simultaneously improving our operational efficiency.",
  summary: "Sustainability and efficiency improvements through data analytics",
  transcript: "Full podcast interview transcript discussing sustainability initiatives...",
  customer_profile: {
    id: "customer-uuid-009",
    workspace_id: "acme-corp",
    external_id: "customer-009",
    name: "Emma Green",
    avatar_url: "/avatars/avatar9.jpg",
    company: "EcoRetail Solutions",
    industry: "Retail",
    location: "Portland, OR",
    title: "Sustainability Director",
    email: "e.green@ecoretail.com",
    social_profiles: {
      linkedin: "emmagreen",
      twitter: "@egreen_eco"
    },
    custom_fields: {
      customer_since: "2024",
      plan: "Professional",
      usage_level: "Medium",
      region: "Northwest"
    },
    created_at: new Date("2024-09-05"),
    updated_at: new Date("2025-03-20")
  },
  media_urls: [
    "/media/audio/testimonials/ecoretail-podcast-interview.mp3",
    "/media/thumbnails/ecoretail-logo.jpg"
  ],
  media_url: "/media/audio/testimonials/ecoretail-podcast-interview.mp3",
  verification_method: "employee_verification",
  verification_status: "verified",
  verified_at: new Date("2025-03-15"),
  published: true,
  published_at: new Date("2025-03-22"),
  scheduled_publish_at: new Date("2025-03-22"),
  view_count: 1221,
  share_count: 86,
  conversion_count: 23,
  created_at: new Date("2025-03-10"),
  updated_at: new Date("2025-03-22"),
  verification_data: {
    verified_by: "content_team",
    verification_date: new Date("2025-03-15"),
    verification_notes: "Extracted from Tech for Good podcast episode #87."
  },
  engagement_metrics: {
    click_rate: 0.15,
    share_rate: 0.09,
    avg_view_time: 175,
    completion_rate: 0.81
  },
  analyses: [
    {
      id: "analysis-sentiment-009",
      testimonial_id: "uuid-009",
      analysis_type: "sentiment",
      sentiment_score: 0.88,
      analysis_data: {
        sentiment: {
          label: "very positive",
          score: 0.88,
          count: 9,
          keywords: [
            "reduced",
            "improved",
            "transformation",
            "efficiency"
          ]
        }
      },
      created_at: new Date("2025-03-23")
    }
  ]
}
  ];
  
  export default testimonialDatasets;

export const sentimentSummary = [
  { label: "Positive", count: 50, percentage: 50 },
  { label: "Neutral", count: 17, percentage: 34 },
  { label: "Negative", count: 10, percentage: 20 }
];
