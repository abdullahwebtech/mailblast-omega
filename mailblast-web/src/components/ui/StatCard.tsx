'use client';
import { motion } from 'framer-motion';

export function StatCard({ title, value, color, description }: { title: string, value: string, color: string, description?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-[#E8E9EC] rounded-xl p-6 shadow-sm relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-[0.04]" style={{ background: color }} />
      <h3 className="text-[#8D909C] text-[10px] font-bold uppercase tracking-wider mb-3 font-mono">{title}</h3>
      <div className="text-3xl font-bold tracking-tight" style={{ color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</div>
      {description && <div className="text-[10px] text-[#8D909C] mt-2 font-mono uppercase tracking-wider">{description}</div>}
    </motion.div>
  );
}
