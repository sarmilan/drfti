'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';

export default function Home() {
  const router = useRouter();

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0A0A0F' }}>
        <motion.h1
          className="text-7xl font-bold tracking-tighter"
          style={{ color: '#E94560' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          drfti
        </motion.h1>

        <motion.p
          className="text-lg text-center max-w-sm mt-3"
          style={{ color: '#6B7280' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Practice real conversations before you need them.
        </motion.p>

        <div className="flex flex-col md:flex-row gap-4 mt-16">
          {/* Japanese card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/ja')}
            className="relative w-[200px] aspect-square flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all duration-200"
            style={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{
              borderColor: 'rgba(233,69,96,0.4)',
              boxShadow: '0 0 24px rgba(233,69,96,0.15)',
            }}
          >
            <span className="text-6xl">🇯🇵</span>
            <p className="text-xl font-semibold text-white mt-3">Japanese</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Tokyo · Osaka · Kyoto</p>
          </motion.div>

          {/* French card — coming soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="relative w-[200px] aspect-square flex flex-col items-center justify-center p-8 rounded-2xl opacity-50 cursor-not-allowed"
            style={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              Coming Soon
            </span>
            <span className="text-6xl">🇫🇷</span>
            <p className="text-xl font-semibold text-white mt-3">Français</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Paris · Montréal</p>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  );
}
