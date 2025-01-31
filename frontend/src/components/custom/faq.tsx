import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqData = [
  { question: "Can I import testimonials I've already collected?", answer: "Yes, you can easily import testimonials via CSV upload or manually add them." },
  { question: "What information can I collect from my customers?", answer: "You can collect text, video, ratings, and even social media handles for authenticity." },
  { question: "What happens after I collect 15 testimonials?", answer: "You can continue collecting unlimited testimonials and manage them in your dashboard." },
  { question: "Do you offer discounts to educational institutions and nonprofits?", answer: "Yes, we offer special pricing for nonprofits and educational institutions. Contact us for details." },
  { question: "Which payment formats and currencies do you accept?", answer: "We accept major credit cards, PayPal, and bank transfers in multiple currencies." },
  { question: "Can I use this platform on behalf of multiple clients?", answer: "Yes, our agency plan allows you to manage testimonials for multiple clients." }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h2 className="text-4xl font-bold text-[#2D2D2A] text-center mb-6">Frequently Asked Questions</h2>
      <p className="text-center text-[#848FA5] mb-10">Everything you need to know for complete peace of mind.</p>
      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div key={index} className="border border-[#4C4C47] rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full flex justify-between items-center bg-[#E5DCC5] p-4 text-left text-[#2D2D2A] font-medium text-lg hover:bg-[#C14953] hover:text-white transition-all duration-300"
              onClick={() => toggleFAQ(index)}
            >
              {item.question}
              {openIndex === index ? <ChevronUp className="text-[#4C4C47]" /> : <ChevronDown className="text-[#4C4C47]" />}
            </button>
            {openIndex === index && (
              <div className="bg-[#F9F7F1] p-4 text-[#4C4C47] border-t border-[#4C4C47]">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;