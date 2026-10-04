import { motion } from "framer-motion";
import { Link } from "react-router";
import { Globe2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900"
    >
      <SiteNav />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-[#0066cc]/15 text-[#0066cc]">
            <Globe2 className="size-8 text-[#0066cc]" />
          </span>
          <h1 className="mt-5 text-6xl font-bold tracking-tight text-[#7651c9]">404</h1>
          <p className="mt-4 text-lg text-slate-600">Page not found</p>
          <p className="mt-2 max-w-md text-sm text-slate-500">The page you are looking for may have moved, or it no longer exists.</p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-6 text-sm font-medium text-white hover:bg-[#004a99]"
          >
            Back home
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
