// Success page component
import { motion } from "framer-motion";
import { ChevronRightIcon, CheckIcon } from "lucide-react";
import { Plan } from "@/components/pricing/types";
import { Link, useSearchParams } from "react-router-dom";

const SuccessPage = ({ plan }: { plan: Plan }) => {
  const [searchParams] = useSearchParams();
  const workflow = searchParams.get("workflow");
  const query = `plan=${plan.id}`;
  if (workflow) {
    query.concat(`&workflow=${workflow}`);
  }
  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckIcon className="w-8 h-8 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Payment Successful!
      </h2>
      <p className="text-gray-600 mb-8">
        Thank you for subscribing to our {plan.name} plan.
        <br />
        You'll receive a confirmation email shortly.
      </p>

      <div className="max-w-md mx-auto p-6 bg-indigo-50 rounded-2xl border border-indigo-100 mb-8">
        <h3 className="font-semibold text-indigo-800 mb-4">Next Steps</h3>
        <ul className="space-y-3 text-left">
          <li className="flex items-start">
            <CheckIcon className="w-5 h-5 text-indigo-600 mr-2 mt-0.5" />
            <span className="text-sm text-indigo-800">
              Set up your profile and customize your dashboard
            </span>
          </li>
          <li className="flex items-start">
            <CheckIcon className="w-5 h-5 text-indigo-600 mr-2 mt-0.5" />
            <span className="text-sm text-indigo-800">
              Create your first testimonial collection campaign
            </span>
          </li>
          <li className="flex items-start">
            <CheckIcon className="w-5 h-5 text-indigo-600 mr-2 mt-0.5" />
            <span className="text-sm text-indigo-800">
              Integrate with your existing marketing tools
            </span>
          </li>
        </ul>
      </div>

      <Link
        to={workflow ? `/onboarding?${query}` : "/dashboard"}
        className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {workflow ? "Proceed with Onboarding" : "Go to Dashboard"}
        <ChevronRightIcon className="w-4 h-4 ml-2" />
      </Link>
    </motion.div>
  );
};

export default SuccessPage;
