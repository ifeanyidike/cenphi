import { Outlet } from "react-router-dom";

const TestimonialCollectionLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default TestimonialCollectionLayout;
