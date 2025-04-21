import { Testimonial } from "@/types/testimonial"; // Import your type definitions

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

// Comprehensive testimonial dataset with 20 records covering all types and formats
const testimonialDatasets: Testimonial[] = [
  {
    id: "uuid-001",
    workspace_id: "acme-corp1",
    testimonial_type: "customer",
    format: "text",
    status: "approved",
    language: "en",
    rating: 5.0,
    source: "Point of Sale",
    title: "How Company 1 Inc. Enhanced Their Workflow",
    content: "Company 1 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full text transcript describing the use case and improvements...",
    customer_profile: {
      workspace_id: "acme-corp", // Add workspace_id property
      id: "customer-uuid-001",
      external_id: "customer-001",
      name: "Aja Ogonnaya Edward",
      avatar_url: avatars.avatar1,
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
      updated_at:  new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-1-inc.-story.mp4",
      "/media/thumbnails/company-1-inc.-1.jpg",
      "/media/thumbnails/company-1-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-1-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: "2024-12-16",
    published: true,
    is_featured: false,
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
    sentiment: {
      score: 0.87,
      label: "positive",
      count: 8,
      keywords: [
        "transformed",
        "boosted",
        "improved"
      ]
    }
  },
  {
    id: "uuid-002",
    workspace_id: "acme-corp2",
    testimonial_type: "customer",
    format: "text",
    status: "pending",
    language: "en",
    rating: 5.0,
    title: "How Company 2 Inc. Enhanced Their Workflow",
    content: "Company 2 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full text transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-002",
      workspace_id: "acme-corp2",
      external_id: "customer-002",
      name: "User 2",
      avatar_url: avatars.avatar2,
      company: "Company 2 Inc.",
      industry: "Energy",
      location: "San Francisco, CA",
      title: "CTO",
      email: "user2@company2inc.com",
      social_profiles: {
        linkedin: "user2",
        twitter: "@innovator"
      },
      custom_fields: {
        customer_since: "2023",
        plan: "Basic",
        usage_level: "Moderate",
        region: "CA"
      },
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-2-inc.-story.mp4",
      "/media/thumbnails/company-2-inc.-1.jpg",
      "/media/thumbnails/company-2-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-2-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: "2024-12-16",
    published: true,
    is_featured: false,
    published_at: "2025-04-01",
    scheduled_publish_at:"2025-04-01",
    view_count: 3228,
    share_count: 65,
    conversion_count: 42,
    created_at: new Date("2024-12-15"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    sentiment: {
      score: 0.98,
      label: "positive",
      count: 11,
      keywords: [
        "improved",
        "streamlined",
        "efficient"
      ]
    }
  },
  {
      id: "uuid-003",
      workspace_id: "acme-corp3",
      testimonial_type: "customer",
      format: "audio",
      status: "featured",
      language: "en",
      rating: 5.0,
      title: "How Company 3 Inc. Enhanced Their Workflow",
      content: "Company 3 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
      summary: "Highly satisfied with the solution!",
      transcript: "Full audio transcript describing the use case and improvements...",
      customer_profile: {
          id: "customer-uuid-003",
          workspace_id: "acme-corp3",
          external_id: "customer-003",
          name: "User 3",
          avatar_url: avatars.avatar3,
          company: "Company 3 Inc.",
          industry: "Finance",
          location: "Boston, MA",
          title: "Sales Director",
          email: "user3@company3inc.com",
          social_profiles: {
              linkedin: "user3",
              twitter: "@innovator"
          },
          custom_fields: {
              customer_since: "2023",
              plan: "Enterprise",
              usage_level: "Low",
              region: "MA"
          },
          created_at: new Date("2024-12-15"),
          updated_at: new Date("2025-01-09")
      },
      media_urls: [
          "/media/videos/testimonials/company-3-inc.-story.mp4",
          "/media/thumbnails/company-3-inc.-1.jpg",
          "/media/thumbnails/company-3-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-3-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: "2024-12-16",
      published: true,
      is_featured: false,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 4003,
      share_count: 60,
      conversion_count: 14,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
          verified_by: "admin",
          verification_date: new Date("2024-12-16"),
          verification_notes: "Verified by email confirmation."
      },
      sentiment: {
          score: 0.88,
          label: "positive",
          count: 11,
          keywords: [
              "transformed",
              "improved",
              "efficient"
          ]
      }
  },
  {
      id: "uuid-004",
      workspace_id: "acme-corp4",
      testimonial_type: "customer",
      format: "audio",
      status: "rejected",
      language: "en",
      rating: 1.0,
      title: "How Company 4 Inc. Enhanced Their Workflow",
      content: "poor service",
      summary: "Wasted our time!",
      transcript: "bad audio transcription",
      customer_profile: {
        id: "customer-uuid-004",
        workspace_id: "acme-corp4",
        external_id: "customer-004",
        name: "User 4",
        avatar_url: avatars.avatar4,
        company: "Company 4 Inc.",
        industry: "Retail",
        location: "San Francisco, CA",
        title: "Sales Director",
        email: "user4@company4inc.com",
        social_profiles: {
          linkedin: "user4",
          twitter: "@salespro"
        },
        custom_fields: {
          customer_since: "2022",
          plan: "Enterprise",
          usage_level: "Low",
          region: "CA"
        },
        created_at: new Date("2024-12-15"),
        updated_at: new Date("2025-01-09")
      },
      media_urls: [
        "/media/videos/testimonials/company-4-inc.-story.mp4",
        "/media/thumbnails/company-4-inc.-1.jpg",
        "/media/thumbnails/company-4-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-4-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: new Date("2024-12-16"),
      published: true,
      is_featured: false,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 1483,
      share_count: 143,
      conversion_count: 40,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
        verified_by: "admin",
        verification_date: new Date("2024-12-16"),
        verification_notes: "Verified by email confirmation."
      },
      sentiment: {
        score: 0.1,
        label: "negative",
        count: 1,
        keywords: [
          "hurrable",
          "annoying",
          "bad"
        ]
      }
    },
  {
      id: "uuid-005",
      workspace_id: "acme-corp5",
      testimonial_type: "customer",
      format: "video",
      status: "pending",
      language: "en",
      rating: 5.0,
      title: "How Company 5 Inc. Enhanced Their Workflow",
      content: "Company 5 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
      summary: "Highly satisfied with the solution!",
      transcript: "Full video transcript describing the use case and improvements...",
      customer_profile: {
        id: "customer-uuid-005",
        workspace_id: "acme-corp5",
        external_id: "customer-005",
        name: "User 5",
        avatar_url: avatars.avatar5,
        company: "Company 5 Inc.",
        industry: "Finance",
        location: "San Francisco, CA",
        title: "CTO",
        email: "user5@company5inc.com",
        social_profiles: {
          linkedin: "user5",
          twitter: "@visionary"
        },
        custom_fields: {
          customer_since: "2021",
          plan: "Pro",
          usage_level: "Low",
          region: "CA"
        },
        created_at: new Date("2024-12-15"),
        updated_at: new Date("2025-01-09")
      },
      media_urls: [
        "/media/videos/testimonials/company-5-inc.-story.mp4",
        "/media/thumbnails/company-5-inc.-1.jpg",
        "/media/thumbnails/company-5-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-5-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: new Date("2024-12-16"),
      published: true,
      is_featured: true,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 4221,
      share_count: 181,
      conversion_count: 19,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
        verified_by: "admin",
        verification_date: new Date("2024-12-16"),
        verification_notes: "Verified by email confirmation."
      },
      sentiment: {
        score: 0.96,
        label: "positive",
        count: 8,
        keywords: [
          "transformed",
          "efficient",
          "boosted"
        ]
      }
    },
  {
    id: "uuid-006",
    workspace_id: "acme-corp6",
    testimonial_type: "customer",
    format: "image",
    status: "approved",
    language: "en",
    rating: 5.0,
    title: "How Company 6 Inc. Enhanced Their Workflow",
    content: "Company 6 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full image transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-006",
      workspace_id: "acme-corp6",
      external_id: "customer-006",
      name: "User 6",
      avatar_url: "avatars.avatar6",
      company: "Company 6 Inc.",
      industry: "Technology",
      location: "Austin, TX",
      title: "CTO",
      email: "user6@company6inc.com",
      social_profiles: {
        linkedin: "user6",
        twitter: "@innovator"
      },
      custom_fields: {
        customer_since: "2024",
        plan: "Enterprise",
        usage_level: "High",
        region: "TX"
      },
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-6-inc.-story.mp4",
      "/media/thumbnails/company-6-inc.-1.jpg",
      "/media/thumbnails/company-6-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-6-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: new Date("2024-12-16"),
    published: true,
    is_featured: false,
    published_at: new Date("2025-04-01"),
    scheduled_publish_at: new Date("2025-04-01"),
    view_count: 917,
    share_count: 133,
    conversion_count: 14,
    created_at: new Date("2024-12-15"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    sentiment: {
      score: 0.96,
      label: "positive",
      count: 14,
      keywords: [
        "transformed",
        "improved",
        "efficient"
      ]
    }
  },
  {
    id: "uuid-007",
    workspace_id: "acme-corp7",
    testimonial_type: "customer",
    format: "text",
    status: "approved",
    language: "en",
    rating: 5.0,
    title: "How Company 7 Inc. Enhanced Their Workflow",
    content: "Company 7 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full text transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-007",
      workspace_id: "acme-corp7",
      external_id: "customer-007",
      name: "User 7",
      avatar_url: "avatars.avatar7",
      company: "Company 7 Inc.",
      industry: "Education",
      location: "Chicago, IL",
      title: "Sales Director",
      email: "user7@company7inc.com",
      social_profiles: {
        linkedin: "user7",
        twitter: "@techguru"
      },
      custom_fields: {
        customer_since: "2018",
        plan: "Basic",
        usage_level: "Low",
        region: "IL"
      },
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-7-inc.-story.mp4",
      "/media/thumbnails/company-7-inc.-1.jpg",
      "/media/thumbnails/company-7-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-7-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: new Date("2024-12-16"),
    published: true,
    is_featured: false,
    published_at: new Date("2025-04-01"),
    scheduled_publish_at: new Date("2025-04-01"),
    view_count: 2986,
    share_count: 105,
    conversion_count: 16,
    created_at: new Date("2024-12-15"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    sentiment: {
      score: 0.88,
      label: "positive",
      count: 8,
      keywords: [
        "transformed",
        "boosted",
        "streamlined"
      ]
    }
  },
  {
    id: "uuid-008",
    workspace_id: "acme-corp8",
    testimonial_type: "customer",
    format: "text",
    status: "approved",
    language: "en",
    rating: 5.0,
    title: "How Company 8 Inc. Enhanced Their Workflow",
    content: "Company 8 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full text transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-008",
      workspace_id: "acme-corp8",
      external_id: "customer-008",
      name: "User 8",
      avatar_url: "avatars.avatar8",
      company: "Company 8 Inc.",
      industry: "Education",
      location: "Austin, TX",
      title: "CTO",
      email: "user8@company8inc.com",
      social_profiles: {
        linkedin: "user8",
        twitter: "@salespro"
      },
      custom_fields: {
        customer_since: "2020",
        plan: "Pro",
        usage_level: "High",
        region: "TX"
      },
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-8-inc.-story.mp4",
      "/media/thumbnails/company-8-inc.-1.jpg",
      "/media/thumbnails/company-8-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-8-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: new Date( "2024-12-16"),
    published: true,
    is_featured: false,
    published_at: new Date("2025-04-01"),
    scheduled_publish_at: new Date("2025-04-01"),
    view_count: 4861,
    share_count: 121,
    conversion_count: 41,
    created_at: new Date("2024-12-15"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    sentiment: {
      score: 0.88,
      label: "positive",
      count: 15,
      keywords: [
        "transformed",
        "efficient",
        "improved"
      ]
    }
  },
  {
      id: "uuid-009",
      workspace_id: "acme-corp9",
      testimonial_type: "customer",
      format: "audio",
      status: "scheduled",
      language: "en",
      rating: 5.0,
      title: "How Company 9 Inc. Enhanced Their Workflow",
      content: "Company 9 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
      summary: "Highly satisfied with the solution!",
      transcript: "Full audio transcript describing the use case and improvements...",
      customer_profile: {
        id: "customer-uuid-009",
        workspace_id: "acme-corp9",
        external_id: "customer-009",
        name: "User 9",
        avatar_url: "avatars.avatar9",
        company: "Company 9 Inc.",
        industry: "Finance",
        location: "San Francisco, CA",
        title: "Marketing Manager",
        email: "user9@company9inc.com",
        social_profiles: {
          linkedin: "user9",
          twitter: "@techguru"
        },
        custom_fields: {
          customer_since: "2019",
          plan: "Enterprise",
          usage_level: "High",
          region: "CA"
        },
        created_at: new Date("2024-12-15"),
        updated_at: new Date("2025-01-09")
      },
      media_urls: [
        "/media/videos/testimonials/company-9-inc.-story.mp4",
        "/media/thumbnails/company-9-inc.-1.jpg",
        "/media/thumbnails/company-9-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-9-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: new Date("2024-12-16"),
      published: true,
      is_featured: false,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 3369,
      share_count: 39,
      conversion_count: 14,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
        verified_by: "admin",
        verification_date: new Date("2024-12-16"),
        verification_notes: "Verified by email confirmation."
      },
      sentiment: {
        score: 0.92,
        label: "positive",
        count: 15,
        keywords: [
          "transformed",
          "efficient",
          "improved"
        ]
      }
    },
  {
      id: "uuid-010",
      workspace_id: "acme-corp10",
      testimonial_type: "customer",
      format: "image",
      status: "featured",
      language: "en",
      rating: 5.0,
      title: "How Company 10 Inc. Enhanced Their Workflow",
      content: "Company 10 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
      summary: "Highly satisfied with the solution!",
      transcript: "Full image transcript describing the use case and improvements...",
      customer_profile: {
        id: "customer-uuid-010",
        workspace_id: "acme-corp10",
        external_id: "customer-010",
        name: "User 10",
        avatar_url: "avatars.avatar10",
        company: "Company 10 Inc.",
        industry: "Technology",
        location: "New York, NY",
        title: "CEO",
        email: "user10@company10inc.com",
        social_profiles: {
          linkedin: "user10",
          twitter: "@innovator"
        },
        custom_fields: {
          customer_since: "2018",
          plan: "Enterprise",
          usage_level: "High",
          region: "NY"
        },
        created_at: new Date("2024-12-15"),
        updated_at: new Date("2025-01-09")
      },
      media_urls: [
        "/media/videos/testimonials/company-10-inc.-story.mp4",
        "/media/thumbnails/company-10-inc.-1.jpg",
        "/media/thumbnails/company-10-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-10-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: new Date("2024-12-16"),
      published: true,
      is_featured: true,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 3487,
      share_count: 128,
      conversion_count: 35,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
        verified_by: "admin",
        verification_date: "2024-12-16",
        verification_notes: "Verified by email confirmation."
      },
      sentiment: {
        score: 0.9,
        label: "positive",
        count: 7,
        keywords: [
          "boosted",
          "improved",
          "transformed"
        ]
      }
    },
  {
      id: "uuid-011",
      workspace_id: "acme-corp11",
      testimonial_type: "customer",
      format: "text",
      status: "rejected",
      language: "en",
      rating: 5.0,
      title: "How Company 11 Inc. Enhanced Their Workflow",
      content: "Company 11 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
      summary: "Highly satisfied with the solution!",
      transcript: "Full text transcript describing the use case and improvements...",
      customer_profile: {
        id: "customer-uuid-011",
        workspace_id: "acme-corp11",
        external_id: "customer-011",
        name: "User 11",
        avatar_url: "avatars.avatar11",
        company: "Company 11 Inc.",
        industry: "Energy",
        location: "New York, NY",
        title: "Product Lead",
        email: "user11@company11inc.com",
        social_profiles: {
          linkedin: "user11",
          twitter: "@salespro"
        },
        custom_fields: {
          customer_since: "2019",
          plan: "Enterprise",
          usage_level: "High",
          region: "NY"
        },
        created_at: new Date("2024-12-15"),
        updated_at: new Date("2025-01-09")
      },
      media_urls: [
        "/media/videos/testimonials/company-11-inc.-story.mp4",
        "/media/thumbnails/company-11-inc.-1.jpg",
        "/media/thumbnails/company-11-inc.-2.jpg"
      ],
      media_url: "/media/videos/testimonials/company-11-inc.-story.mp4",
      collection_method: "direct_link",
      verification_method: "email",
      verification_status: "verified",
      verified_at: new Date("2024-12-16"),
      published: true,
      is_featured: false,
      published_at: new Date("2025-04-01"),
      scheduled_publish_at: new Date("2025-04-01"),
      view_count: 3824,
      share_count: 80,
      conversion_count: 32,
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09"),
      verification_data: {
        verified_by: "admin",
        verification_date: new Date("2024-12-16"),
        verification_notes: "Verified by email confirmation."
      },
      sentiment: {
        score: 0.97,
        label: "positive",
        count: 7,
        keywords: [
          "transformed",
          "boosted",
          "efficient"
        ]
      }
    },
  {
    id: "uuid-012",
    workspace_id: "acme-corp12",
    testimonial_type: "customer",
    format: "image",
    status: "pending",
    language: "en",
    rating: 5.0,
    title: "How Company 12 Inc. Enhanced Their Workflow",
    content: "Company 12 Inc. saw a massive improvement in efficiency and user satisfaction after implementation.",
    summary: "Highly satisfied with the solution!",
    transcript: "Full image transcript describing the use case and improvements...",
    customer_profile: {
      id: "customer-uuid-012",
      workspace_id: "acme-corp12",
      external_id: "customer-012",
      name: "User 12",
      avatar_url: "avatars.avatar12",
      company: "Company 12 Inc.",
      industry: "Energy",
      location: "San Francisco, CA",
      title: "Sales Director",
      email: "user12@company12inc.com",
      social_profiles: {
        linkedin: "user12",
        twitter: "@bizdev"
      },
      custom_fields: {
        customer_since: "2020",
        plan: "Enterprise",
        usage_level: "Low",
        region: "CA"
      },
      created_at: new Date("2024-12-15"),
      updated_at: new Date("2025-01-09")
    },
    media_urls: [
      "/media/videos/testimonials/company-12-inc.-story.mp4",
      "/media/thumbnails/company-12-inc.-1.jpg",
      "/media/thumbnails/company-12-inc.-2.jpg"
    ],
    media_url: "/media/videos/testimonials/company-12-inc.-story.mp4",
    collection_method: "direct_link",
    verification_method: "email",
    verification_status: "verified",
    verified_at: "2024-12-16",
    published: true,
    is_featured: false,
    published_at: new Date("2025-04-01"),
    scheduled_publish_at: new Date("2025-04-01"),
    view_count: 3354,
    share_count: 191,
    conversion_count: 14,
    created_at: new Date("2024-12-15"),
    updated_at: new Date("2025-01-09"),
    verification_data: {
      verified_by: "admin",
      verification_date: new Date("2024-12-16"),
      verification_notes: "Verified by email confirmation."
    },
    sentiment: {
      score: 0.97,
      label: "positive",
      count: 14,
      keywords: [
        "transformed",
        "streamlined",
        "improved"
      ]
    }
  },
  
]
export default testimonialDatasets;

export const sentimentSummary = [
  { label: "Positive", count: 50, percentage: 50 },
  { label: "Neutral", count: 17, percentage: 34 },
  { label: "Negative", count: 10, percentage: 20 }
];
