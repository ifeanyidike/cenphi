import { CreditCardIcon, LockIcon, ShieldCheckIcon } from "lucide-react";

// Trust badge component
const TrustBadge = () => {
  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center">
          <LockIcon className="w-4 h-4 text-gray-600 mr-2" />
          <span className="text-xs text-gray-600">Secure Payment</span>
        </div>
        <div className="flex items-center">
          <ShieldCheckIcon className="w-4 h-4 text-gray-600 mr-2" />
          <span className="text-xs text-gray-600">Data Protection</span>
        </div>
        <div className="flex items-center">
          <CreditCardIcon className="w-4 h-4 text-gray-600 mr-2" />
          <span className="text-xs text-gray-600">Trusted Gateway</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBadge;
