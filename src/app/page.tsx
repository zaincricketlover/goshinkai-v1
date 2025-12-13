"use client";

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo / Header with Animation */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2
            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-200 to-accent tracking-tight mb-2 drop-shadow-sm"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            伍心会
          </motion.h2>
          <motion.p
            className="text-sm text-gray-400 tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Executive Members Club
          </motion.p>
          <motion.div
            className="mt-4 text-xs text-accent/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            招待制エグゼクティブコミュニティ
          </motion.div>
        </motion.div>

        {/* Forms Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl"
        >
          <div className="flex p-1 mb-6 bg-black/20 rounded-xl">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isLogin ? 'bg-surface-elevated text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setIsLogin(true)}
            >
              ログイン
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${!isLogin ? 'bg-surface-elevated text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setIsLogin(false)}
            >
              新規登録
            </button>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {isLogin ? <LoginForm /> : <RegisterForm />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8 text-xs text-gray-600"
        >
          &copy; 2024 Goshinkai. All rights reserved.
        </motion.div>
      </div>
    </div>
  );
}
