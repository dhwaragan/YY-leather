import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export const SplashLoader: React.FC = () => {
  const { isLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setShowSplash(false);
    }
  }, [isLoading, minTimeElapsed]);

  // Split text for bouncy letter animation
  const brandName = "YY LEATHERS".split("");

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle background noise / texture (simulate luxury) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')] mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-6 select-none">
            
            <motion.h1 
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="font-serif text-3xl sm:text-4xl text-neutral-50 tracking-wider"
            >
              Welcome to 
            </motion.h1>

            <div className="flex space-x-1 mt-2 text-gold font-bold uppercase tracking-[0.2em] text-2xl sm:text-4xl" style={{ textShadow: "0 4px 20px rgba(197, 160, 89, 0.4)" }}>
              {brandName.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 15, 
                    stiffness: 300, 
                    delay: 0.1 + index * 0.04 
                  }}
                  className={char === " " ? "ml-4" : ""}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <motion.div 
               initial={{ opacity: 0, scaleX: 0 }}
               animate={{ opacity: 1, scaleX: 1 }}
               transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
               className="w-48 h-[1px] bg-neutral-800 relative overflow-hidden mt-6"
            >
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '100%' }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                 className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent"
               />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
