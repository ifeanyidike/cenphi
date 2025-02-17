import React from "react";
import { Outlet } from "react-router-dom";

const TestimonialCollectionLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="container mx-auto flex-grow px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default TestimonialCollectionLayout;
