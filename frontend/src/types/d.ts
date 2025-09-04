// Complete filter options
export const filterOptions = [
    {
      title: "Status",
      options: [
        { id: "status-new", value: "pending", label: "Pending" },
        { id: "status-replied", value: "approved", label: "Approved" },
        { id: "status-verified", value: "scheduled", label: "Scheduled" },
        { id: "status-verified", value: "archived", label: "Archived" },
        { id: "status-verified", value: "rejected", label: "Rejected" },
        { id: "status-featured", value: "featured", label: "Featured" },
      ],
    },
    {
      title: "Rating",
      options: [
        { id: "rating-5", value: "5", label: "5 Stars" },
        { id: "rating-4", value: "4", label: "4 Stars" },
        { id: "rating-3", value: "3", label: "3 Stars" },
        { id: "rating-2", value: "2", label: "2 Stars" },
        { id: "rating-1", value: "1", label: "1 Star" },
      ],
    },
    {
      title: "Time",
      options: [
        { id: "time-today", value: "Today", label: "Today" },
        { id: "time-week", value: "Week", label: "This Week" },
        { id: "time-month", value: "Month", label: "This Month" },
        { id: "time-year", value: "Year", label: "This Year" },
      ],
    },
    {
      title: "Media Type",
      options: [
        { id: "media-text", value: "Text", label: "Text Only" },
        { id: "media-image", value: "Image", label: "With Images" },
        { id: "media-video", value: "Video", label: "With Videos" },
        { id: "media-audio", value: "Audio", label: "With Audio" },
      ],
    },
  ];



  // Approved filter options
export const statusFilterOptions = [
       {
      title: "Rating",
      options: [
        { id: "rating-5", value: "5", label: "5 Stars" },
        { id: "rating-4", value: "4", label: "4 Stars" },
        { id: "rating-3", value: "3", label: "3 Stars" },
        { id: "rating-2", value: "2", label: "2 Stars" },
        { id: "rating-1", value: "1", label: "1 Star" },
      ],
    },
    {
      title: "Time",
      options: [
        { id: "time-today", value: "Today", label: "Today" },
        { id: "time-week", value: "Week", label: "This Week" },
        { id: "time-month", value: "Month", label: "This Month" },
        { id: "time-year", value: "Year", label: "This Year" },
      ],
    },
    // {
    //   title: "Media Type",
    //   options: [
    //     { id: "media-text", value: "Text", label: "Text Only" },
    //     { id: "media-image", value: "Image", label: "With Images" },
    //     { id: "media-video", value: "Video", label: "With Videos" },
    //     { id: "media-audio", value: "Audio", label: "With Audio" },
    //   ],
    // },
  ];




 export const sampleData = [
    { id: 1, type: 'text', content: 'The service was excellent and the staff was very friendly!', sentiment: 'positive', score: 0.92, date: '2025-04-05' },
    { id: 2, type: 'audio', content: 'audio_review_123.mp3', sentiment: 'neutral', score: 0.48, date: '2025-04-07' },
    { id: 3, type: 'image', content: 'product_review.jpg', sentiment: 'positive', score: 0.85, date: '2025-04-08' },
    { id: 4, type: 'video', content: 'video_feedback.mp4', sentiment: 'negative', score: 0.23, date: '2025-04-09' },
    { id: 5, type: 'text', content: 'The quality was poor and it arrived damaged.', sentiment: 'negative', score: 0.18, date: '2025-04-10' },
    { id: 6, type: 'text', content: 'It was okay but could be improved in several areas.', sentiment: 'neutral', score: 0.52, date: '2025-04-10' },
  ];


  export const sentimentSummary = [
    { name: 'Positive', count: 120, percentage: 60 },
    { name: 'Neutral', count: 60, percentage: 30 },
    { name: 'Negative', count: 20, percentage: 10 }
  ];