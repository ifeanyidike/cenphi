import React from "react";
import { motion } from "framer-motion";
import { Upload, ArrowRight, Star } from "lucide-react";

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
}

interface PersonalDetailsFormProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-white rounded-lg border border-gray-200 p-4"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Complete Your Submission
      </h3>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Your full name"
          required
          disabled={isSubmitting}
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Email address"
          required
          disabled={isSubmitting}
        />
      </div>

      <input
        type="text"
        value={formData.company}
        onChange={(e) =>
          setFormData({ ...formData, company: e.target.value })
        }
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors mb-3"
        placeholder="Company name (optional)"
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-700">
            Rating:
          </span>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setFormData({ ...formData, rating })}
              className={`transition-colors ${
                rating <= formData.rating ? "text-yellow-400" : "text-gray-300"
              } disabled:opacity-50`}
              disabled={isSubmitting}
            >
              <Star className="h-3 w-3 fill-current" />
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={!formData.name || !formData.email || isSubmitting}
          className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center transition-colors shadow-md disabled:opacity-50 text-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3 mr-1.5" />
              Submit
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PersonalDetailsForm;