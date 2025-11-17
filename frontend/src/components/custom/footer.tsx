import React from "react";
import { FaTwitter, FaGithub, FaLinkedinIn, FaDiscord } from "react-icons/fa";

type FooterLink = {
  label: string;
  href: string;
};

type SocialLink = {
  icon: React.ReactNode;
  href: string;
  ariaLabel: string;
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const productLinks: FooterLink[] = [
    { label: "AI Content Hub", href: "/studio?tab=content" },
    { label: "Video Processing", href: "/studio?tab=video" },
    { label: "Analytics", href: "/studio?tab=analytics" },
    { label: "Pricing", href: "/pricing" },
  ];

  const companyLinks: FooterLink[] = [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Customers", href: "/customers" },
    { label: "Partners", href: "/partners" },
  ];

  const resourceLinks: FooterLink[] = [
    { label: "Help Center", href: "/help" },
    { label: "API Docs", href: "/docs/api" },
    { label: "Guides", href: "/guides" },
    { label: "Community", href: "/community" },
  ];

  const socialLinks: SocialLink[] = [
    {
      icon: <FaTwitter size={20} />,
      href: "https://twitter.com/cenphi",
      ariaLabel: "Twitter",
    },
    {
      icon: <FaGithub size={20} />,
      href: "https://github.com/cenphi",
      ariaLabel: "GitHub",
    },
    {
      icon: <FaLinkedinIn size={20} />,
      href: "https://linkedin.com/company/cenphi",
      ariaLabel: "LinkedIn",
    },
    {
      icon: <FaDiscord size={20} />,
      href: "https://discord.gg/cenphi",
      ariaLabel: "Discord",
    },
  ];

  const renderFooterLinks = (title: string, links: FooterLink[]) => (
    <div className="flex flex-col space-y-3">
      <h3 className="text-gray-900 font-semibold tracking-wide text-sm uppercase">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-sm"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-gradient-to-b from-gray-100 to-gray-200 border-t-2 border-gray-300 py-8 mt-16">
      {/* Top section with logo and newsletter */}
      <div className="max-w-7xl mx-auto pt-12 px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 pb-12 border-b border-gray-300">
          {/* Logo and description - takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <div>
                <span className="text-gray-900 font-bold text-2xl block">
                  cenphi.io
                </span>
                <span className="text-gray-600 text-xs">AI-Powered Testimonial Platform</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Transform customer testimonials into revenue-driving marketing content with AI-powered video processing, content generation, and analytics.
            </p>
          </div>

          {/* Newsletter - takes 3 columns */}
          <div className="lg:col-span-3 lg:ml-auto max-w-md">
            <h3 className="text-gray-900 font-semibold mb-2 text-sm uppercase tracking-wide">Stay updated</h3>
            <p className="text-gray-600 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white border-2 border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm flex-1"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 flex-shrink-0 text-sm shadow-sm hover:shadow-md"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Middle section with links */}
      <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8">
          {renderFooterLinks("Product", productLinks)}
          {renderFooterLinks("Company", companyLinks)}
          {renderFooterLinks("Resources", resourceLinks)}

          <div className="col-span-2 xl:col-span-3">
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 h-full">
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">
                Have questions?
              </h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Our team is here to help you navigate through any inquiries or
                technical challenges.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Contact our support team
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section with social links and copyright */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 border-t border-gray-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.ariaLabel}
                href={social.href}
                aria-label={social.ariaLabel}
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-110"
              >
                {social.icon}
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm">
            <a
              href="/terms"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="/security"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
            >
              Security
            </a>
            <a
              href="/compliance"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
            >
              GDPR
            </a>
          </div>
        </div>

        {/* Copyright and Company Info */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-gray-500 text-sm">
              © {currentYear} Cenphi.io. All rights reserved.
            </p>
          </div>

          {/* Company Registration Info */}
          <div className="flex flex-col md:flex-row items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                🇺🇸 U.S. Company
              </div>
              <span>Registered in Delaware</span>
            </div>
            <span className="hidden md:inline text-gray-400">|</span>
            <div className="text-center md:text-left">
              <p className="text-gray-600">
                1090 El Rancho Dr, Billings, MT 59105, United States
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
