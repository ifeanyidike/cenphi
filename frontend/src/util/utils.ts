export const getBadgeColor = (status: string): string => {
    switch (status) {
      case "New":
        return "text-purple-600 bg-purple-50";
      case "Replied":
        return "text-blue-600 bg-blue-50";
      case "Verified":
        return "text-green-600 bg-green-50";
      case "Featured":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };