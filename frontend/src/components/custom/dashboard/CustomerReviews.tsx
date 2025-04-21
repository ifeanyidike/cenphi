import { useState } from "react";
import { Filter, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ViewToggle } from "@/components/custom/dashboard/ViewToggle";
import { ReviewCardView } from "./ReviewCardView";
import { ReviewListView } from "./ReviewListView";
import { Testimonial } from "@/types/testimonial";

export const CustomerReviews = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const [viewMode, setViewMode] = useState("card"); 

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            Your Customers
          </CardTitle>
          <div className="flex space-x-2">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {viewMode === "card" ? (
          <ReviewCardView testimonials={testimonials} />
        ) : (
          <ReviewListView testimonials={testimonials} />
        )}
      </CardContent>
    </Card>
  );
};