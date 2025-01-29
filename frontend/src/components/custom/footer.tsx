import React from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  const navigation = {
    'How it Works': [
      { name: 'Overview', href: '#' },
      { name: 'Pricing', href: '#' },
      { name: 'Google Seller Ratings', href: '#' },
      { name: 'Integrations', href: '#' }
    ],
    'Reviews Platform': [
      { name: 'Company Reviews', href: '#' },
      { name: 'Product Reviews', href: '#' },
      { name: 'Reputation Manager', href: '#' },
      { name: 'Review Syndication', href: '#' },
      { name: 'Local & In-Store Reviews', href: '#' }
    ],
    'Features': [
      { name: 'Attributes', href: '#' },
      { name: 'Surveys', href: '#' },
      { name: 'UGC', href: '#' },
      { name: 'AI Assistant', href: '#' },
      { name: 'AI Review Summary', href: '#' },
      { name: 'Review Nuggets', href: '#' },
      { name: 'Invitation Flows', href: '#' },
      { name: 'SMS Invites', href: '#' },
      { name: 'Video First', href: '#' },
      { name: 'Social Proof Banners', href: '#' }
    ],
    'Resources': [
      { name: 'Support Center', href: '#' },
      { name: 'Product Updates', href: '#' },
      { name: 'Customer Success Stories', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Agency Directory', href: '#' },
      { name: 'Podcasts', href: '#' }
    ],
    'Our Company': [
      { name: 'About Us', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Become a Partner', href: '#' },
      { name: 'Brand Guidelines', href: '#' },
      { name: 'Impressum', href: '#' }
    ]
  };

  const socialLinks = [
    { icon: <Linkedin className="w-5 h-5" />, href: '#' },
    { icon: <Instagram className="w-5 h-5" />, href: '#' },
    { icon: <Twitter className="w-5 h-5" />, href: '#' },
    { icon: <Youtube className="w-5 h-5" />, href: '#' }
  ];

  return (
    <footer className="bg-[#2D2D2A] text-[#E5DCC5]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Top section with logo and auth buttons */}
        <div className="flex justify-between items-center pb-12 border-b border-[#E5DCC5]/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C14953] rounded-full" />
            <span className="text-xl font-bold">CENPHI.io</span>
          </div>
          
          <div className="flex gap-4">
            <Button variant="ghost" className="text-[#E5DCC5] hover:text-white hover:bg-[#C14953]/20">
             Join for free
            </Button>
            <Button className="bg-[#C14953] hover:bg-[#C14953]/90 text-white">
              Login
            </Button>
          </div>
        </div>

        {/* Main navigation grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-12">
          {Object.entries(navigation).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-semibold mb-4 text-white">{title}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href}
                      className="text-[#E5DCC5]/70 hover:text-[#C14953] transition-colors duration-200"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section with social links and copyright */}
        <div className="pt-12 border-t border-[#E5DCC5]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6">
              {socialLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href}
                  className="p-2 rounded-full hover:bg-[#C14953]/20 text-[#E5DCC5] hover:text-white transition-colors duration-200"
                >
                  {link.icon}
                </a>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-[#E5DCC5]/70">
              <a href="#" className="hover:text-[#C14953]">Terms & Conditions</a>
              <a href="#" className="hover:text-[#C14953]">Privacy Policy</a>
              <a href="#" className="hover:text-[#C14953]">Data Protection</a>
              <a href="#" className="hover:text-[#C14953]">Data Request</a>
            </div>
            
            <p className="text-sm text-[#E5DCC5]/50">
              © 2024 Cenphi.io | Convert more visitors into sales
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;