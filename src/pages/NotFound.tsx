import { motion } from "framer-motion";
import { Link } from "react-router";
import { SiteNav } from "@/components/SiteNav";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-slate-50 text-slate-900"
    >

      
      <SiteNav />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-[#7651c9] mb-4">404</h1>
              <p className="text-lg text-slate-600">Page not found</p>
              <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#0066cc] px-4 text-sm font-medium text-white hover:bg-[#004a99]">Back home</Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
