import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import UserAvatar from "@/assets/2.jpg";
import UserAvatar2 from "@/assets/3.jpg";

export default function TestimonialSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#2D2D2A] to-[#2D2D2A]/90 text-[#E5DCC5] py-20 px-10 md:px-20 flex flex-col items-center text-center overflow-hidden rounded-2xl shadow-xl mx-4 md:mx-auto max-w-5xl">
      <p className="text-[#C14953] text-lg font-semibold italic">Testimonials Made Easy</p>
      <h2 className="text-4xl md:text-5xl font-bold mt-2 leading-tight">
        The faster, easier way to <span className="text-[#E5DCC5]">collect testimonials</span>
      </h2>
      <p className="text-lg mt-4 max-w-3xl">
        Jump in today and see how easy it is to collect testimonials with our platform.
      </p>

      {/* Animated Avatars */}
      <motion.div 
        className="flex items-center mt-6 space-x-3"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {[...Array(5)].map((_, index) => (
          <motion.img
            key={index}
            src={`/media/avatars/user/${index + 1}.jpg`}
            alt="User Avatar"
            width={50}
            height={50}
            className="rounded-full border-2 border-white shadow-lg transform hover:scale-110 transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          />
        ))}
      </motion.div>

      {/* Call to Action Button */}
      <Button className="mt-8 px-8 py-4 bg-[#C14953] text-white font-semibold rounded-full shadow-lg hover:bg-[#a03d45] transition text-lg">
        Get started for free
      </Button>

      {/* Floating Background Effects */}
      <motion.div
        className="absolute top-1/4 right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 5 }}
      />
      <motion.div
        className="absolute bottom-1/4 left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 5 }}
      />

      {/* Redesigned Testimonial Cards */}
      <motion.div 
        className="relative mt-12 flex flex-col md:flex-row gap-6 items-center justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* First Testimonial */}
        <motion.div
          className="relative bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-white max-w-sm transform rotate-[-3deg] hover:rotate-0 transition border border-white/30"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-3">
            <img src={UserAvatar2} alt="User" className="w-12 h-12 rounded-full border-2 border-[#C14953]" />
            <div>
              <p className="text-lg font-bold">John Doe</p>
              <p className="text-sm text-[#E5DCC5]/80">Verified User</p>
            </div>
          </div>
          <p className="text-xl font-bold mt-4">⭐⭐⭐⭐⭐</p>
          <p className="mt-2 italic">"Absolutely love this platform! Collecting testimonials has never been easier."</p>
        </motion.div>

        {/* Second Testimonial */}
        <motion.div
          className="relative bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-white max-w-sm transform rotate-[3deg] hover:rotate-0 transition border border-white/30"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <img src={UserAvatar} alt="User" className="w-12 h-12 rounded-full border-2 border-[#C14953]" />
            <div>
              <p className="text-lg font-bold">Jane Smith</p>
              <p className="text-sm text-[#E5DCC5]/80">Verified User</p>
            </div>
          </div>
          <p className="text-xl font-bold mt-4">⭐⭐⭐⭐⭐</p>
          <p className="mt-2 italic">"Such a seamless experience. Highly recommend!"</p>
        </motion.div>
      </motion.div>
    </section>
  );
}
