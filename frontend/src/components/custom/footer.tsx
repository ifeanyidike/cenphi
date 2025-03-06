// import { Button } from "@/components/ui/button";
// import { Linkedin, Instagram, Twitter, Youtube } from "lucide-react";

// const Footer = () => {
//   const navigation = {
//     "How it Works": [
//       { name: "Overview", href: "#" },
//       { name: "Pricing", href: "#" },
//       { name: "Google Seller Ratings", href: "#" },
//       { name: "Integrations", href: "#" },
//     ],
//     "Reviews Platform": [
//       { name: "Company Reviews", href: "#" },
//       { name: "Product Reviews", href: "#" },
//       { name: "Reputation Manager", href: "#" },
//       { name: "Review Syndication", href: "#" },
//       { name: "Local & In-Store Reviews", href: "#" },
//     ],
//     Features: [
//       { name: "Attributes", href: "#" },
//       { name: "Surveys", href: "#" },
//       { name: "UGC", href: "#" },
//       { name: "AI Assistant", href: "#" },
//       { name: "AI Review Summary", href: "#" },
//       { name: "Review Nuggets", href: "#" },
//       { name: "Invitation Flows", href: "#" },
//       { name: "SMS Invites", href: "#" },
//       { name: "Video First", href: "#" },
//       { name: "Social Proof Banners", href: "#" },
//     ],
//     Resources: [
//       { name: "Support Center", href: "#" },
//       { name: "Product Updates", href: "#" },
//       { name: "Customer Success Stories", href: "#" },
//       { name: "Blog", href: "#" },
//       { name: "Agency Directory", href: "#" },
//       { name: "Podcasts", href: "#" },
//     ],
//     "Our Company": [
//       { name: "About Us", href: "#" },
//       { name: "Contact Us", href: "#" },
//       { name: "Careers", href: "#" },
//       { name: "Become a Partner", href: "#" },
//       { name: "Brand Guidelines", href: "#" },
//       { name: "Impressum", href: "#" },
//     ],
//   };

//   const socialLinks = [
//     { icon: <Linkedin className="w-5 h-5" />, href: "#" },
//     { icon: <Instagram className="w-5 h-5" />, href: "#" },
//     { icon: <Twitter className="w-5 h-5" />, href: "#" },
//     { icon: <Youtube className="w-5 h-5" />, href: "#" },
//   ];

//   return (
//     <footer className="bg-[#2D2D2A] text-[#E5DCC5]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
//         {/* Top section with logo and auth buttons */}
//         <div className="flex flex-col sm:flex-row justify-between items-center pb-12 border-b border-[#E5DCC5]/10">
//           <div className="flex items-center gap-2 mb-4 sm:mb-0">
//             <div className="w-8 h-8 bg-[#C14953] rounded-full" />
//             <span className="text-xl font-bold">CENPHI.io</span>
//           </div>

//           <div className="flex gap-4">
//             <Button
//               variant="ghost"
//               className="text-[#E5DCC5] hover:text-white hover:bg-[#C14953]/20"
//             >
//               Join for free
//             </Button>
//             <Button className="bg-[#C14953] hover:bg-[#C14953]/90 text-white">
//               Login
//             </Button>
//           </div>
//         </div>

//         {/* Main navigation grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-12">
//           {Object.entries(navigation).map(([title, items]) => (
//             <div key={title}>
//               <h3 className="font-semibold mb-4 text-white">{title}</h3>
//               <ul className="space-y-3">
//                 {items.map((item) => (
//                   <li key={item.name}>
//                     <a
//                       href={item.href}
//                       className="text-[#E5DCC5]/70 hover:text-[#C14953] transition-colors duration-200"
//                     >
//                       {item.name}
//                     </a>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         {/* Bottom section with social links and copyright */}
//         <div className="pt-12 border-t border-[#E5DCC5]/10">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//             <div className="flex gap-6">
//               {socialLinks.map((link, index) => (
//                 <a
//                   key={index}
//                   href={link.href}
//                   className="p-2 rounded-full hover:bg-[#C14953]/20 text-[#E5DCC5] hover:text-white transition-colors duration-200"
//                 >
//                   {link.icon}
//                 </a>
//               ))}
//             </div>

//             <div className="flex flex-wrap gap-6 text-sm text-[#E5DCC5]/70">
//               <a href="#" className="hover:text-[#C14953]">
//                 Terms & Conditions
//               </a>
//               <a href="#" className="hover:text-[#C14953]">
//                 Privacy Policy
//               </a>
//               <a href="#" className="hover:text-[#C14953]">
//                 Data Protection
//               </a>
//               <a href="#" className="hover:text-[#C14953]">
//                 Data Request
//               </a>
//             </div>

//             <p className="text-sm text-[#E5DCC5]/50 text-center sm:text-left">
//               © 2024 Cenphi.io | Convert more visitors into sales
//             </p>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

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
    { label: "Features", href: "/features" },
    { label: "Documentation", href: "/docs" },
    { label: "API", href: "/api" },
    { label: "Pricing", href: "/pricing" },
  ];

  const companyLinks: FooterLink[] = [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const resourceLinks: FooterLink[] = [
    { label: "Community", href: "/community" },
    { label: "Support", href: "/support" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy", href: "/privacy" },
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
      <h3 className="text-slate-50 font-semibold tracking-wide">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-slate-400 hover:text-blue-400 transition-colors duration-300 text-sm"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-gradient-to-br from-black to-slate-900 border-t border-slate-700/30 py-8">
      {/* Top section with logo and newsletter */}
      <div className="max-w-7xl mx-auto pt-16 px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-12 border-b border-slate-700/50">
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="ml-3 text-slate-50 font-bold text-2xl">
                cenphi.io
              </span>
            </div>
            <p className="text-slate-400 max-w-md">
              Empowering the future through advanced technology solutions and
              innovative approaches to complex challenges.
            </p>
          </div>

          <div className="lg:ml-auto">
            <h3 className="text-slate-50 font-semibold mb-3">Stay updated</h3>
            <p className="text-slate-400 text-sm mb-4">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 flex-shrink-0"
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
            <div className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 h-full">
              <h3 className="text-slate-50 font-semibold mb-4">
                Have questions?
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Our team is here to help you navigate through any inquiries or
                technical challenges.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 border-t border-slate-700/50">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-6 md:mb-0">
            {socialLinks.map((social) => (
              <a
                key={social.ariaLabel}
                href={social.href}
                aria-label={social.ariaLabel}
                className="text-slate-400 hover:text-blue-400 transition-colors duration-300"
              >
                {social.icon}
              </a>
            ))}
          </div>

          <div className="text-slate-400 text-sm">
            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-2 mb-4 md:mb-0">
              <a
                href="/terms"
                className="hover:text-blue-400 transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="hover:text-blue-400 transition-colors duration-300"
              >
                Privacy
              </a>
              <a
                href="/cookies"
                className="hover:text-blue-400 transition-colors duration-300"
              >
                Cookies
              </a>
              <a
                href="/sitemap"
                className="hover:text-blue-400 transition-colors duration-300"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {currentYear} Cenphi.io. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="h-2 w-2 rounded-full bg-cyan-400 mr-2"></div>
            <span className="text-slate-400 text-xs">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
