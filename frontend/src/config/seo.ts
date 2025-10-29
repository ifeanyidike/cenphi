// SEO Configuration for different pages

export const defaultSEO = {
  title: "Cenphi - AI-Powered Video Testimonial Platform | Turn Customer Stories into Growth",
  description:
    "Cenphi helps businesses collect, manage, and leverage video testimonials with AI. Automatically generate clips, social posts, and marketing content from customer stories. Boost trust and conversions with authentic video reviews.",
  keywords:
    "video testimonials, customer testimonials, video reviews, AI video editing, social proof, customer stories, testimonial management, video marketing, UGC content, user generated content, testimonial software",
  image: "/og-image.jpg",
  url: "/",
};

export const pageSEO = {
  home: {
    title: "Cenphi - Turn Customer Video Testimonials into Marketing Gold with AI",
    description:
      "Collect authentic video testimonials from your customers and let AI transform them into viral clips, social media posts, and marketing content. Boost trust, increase conversions, and grow your business with the power of social proof.",
    keywords:
      "video testimonials, customer testimonials, AI video editing, video marketing, social proof, customer reviews, testimonial software, UGC platform, video testimonial tool, customer success stories",
    url: "/",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Cenphi",
      url: "https://cenphi.com",
      logo: "https://cenphi.com/logo.png",
      description:
        "AI-powered video testimonial platform that helps businesses collect, manage, and leverage customer stories",
      sameAs: [
        "https://twitter.com/cenphi",
        "https://linkedin.com/company/cenphi",
        "https://facebook.com/cenphi",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: "support@cenphi.com",
      },
    },
  },

  pricing: {
    title: "Pricing Plans - Affordable Video Testimonial Management | Cenphi",
    description:
      "Choose the perfect plan for your business. Start free and scale as you grow. Get unlimited video testimonials, AI editing, social media automation, and analytics. No credit card required to start.",
    keywords:
      "cenphi pricing, testimonial software pricing, video testimonial plans, testimonial management cost, affordable testimonial software, free trial",
    url: "/pricing",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Pricing",
      description: "Cenphi pricing plans for video testimonial management",
      url: "https://cenphi.com/pricing",
    },
  },

  whyCenphi: {
    title: "Why Choose Cenphi? - The Ultimate Video Testimonial Platform",
    description:
      "Discover why businesses trust Cenphi to manage their video testimonials. AI-powered editing, seamless collection, social media automation, and powerful analytics. See what makes us different.",
    keywords:
      "why cenphi, testimonial platform benefits, video testimonial features, customer testimonial software, testimonial management benefits",
    url: "/why-Cenphi",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Why Cenphi",
      description: "Learn why Cenphi is the best choice for video testimonial management",
      url: "https://cenphi.com/why-Cenphi",
    },
  },

  login: {
    title: "Login to Your Account | Cenphi",
    description:
      "Access your Cenphi dashboard to manage video testimonials, create content, and track analytics.",
    keywords: "cenphi login, sign in, testimonial dashboard access",
    url: "/login",
    noindex: true,
  },

  signup: {
    title: "Sign Up for Free - Start Collecting Video Testimonials | Cenphi",
    description:
      "Create your free Cenphi account and start collecting video testimonials today. No credit card required. Get started in minutes.",
    keywords:
      "cenphi signup, create account, free trial, video testimonial software registration",
    url: "/signup",
  },

  dashboard: {
    title: "Dashboard - Manage Your Video Testimonials | Cenphi",
    description: "Access your testimonial dashboard to view, manage, and analyze all your customer video testimonials.",
    keywords: "testimonial dashboard, manage testimonials, video testimonial analytics",
    url: "/dashboard",
    noindex: true,
  },

  contentHub: {
    title: "Content Hub - AI-Generated Marketing Content | Cenphi",
    description:
      "View and manage all your AI-generated marketing content from customer testimonials. Social posts, video clips, and more.",
    keywords: "content hub, ai generated content, marketing content, video clips, social posts",
    url: "/content-hub",
    noindex: true,
  },

  analytics: {
    title: "Analytics - Track Your Testimonial Performance | Cenphi",
    description:
      "Analyze the performance of your video testimonials and shared content. Track views, engagement, and conversions.",
    keywords: "testimonial analytics, video analytics, engagement tracking, conversion tracking",
    url: "/analytics",
    noindex: true,
  },

  publicShare: {
    title: "Shared Video Testimonial",
    description: "View this authentic customer video testimonial shared via Cenphi.",
    keywords: "shared testimonial, customer review, video testimonial",
    // URL will be dynamic: /share/:shareId/view
  },

  collection: {
    title: "Share Your Story | Cenphi",
    description:
      "We'd love to hear about your experience! Record a quick video testimonial and help others discover what makes us special.",
    keywords: "record testimonial, share feedback, customer story, video review",
    url: "/collect",
  },
};

// Helper function to get SEO data for a page
export const getSEOData = (pageName: keyof typeof pageSEO) => {
  return pageSEO[pageName] || defaultSEO;
};
