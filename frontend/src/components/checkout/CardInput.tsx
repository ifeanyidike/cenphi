import { CardElement } from "@stripe/react-stripe-js";

// Card input component with Stripe
const CardInput = () => {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Details <span className="text-red-500">*</span>
      </label>
      <div className="p-4 border border-gray-300 rounded-xl bg-white/90 backdrop-blur-sm">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default CardInput;
