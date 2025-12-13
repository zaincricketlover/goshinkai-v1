"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Button } from './Button';
import { Badge } from './Badge';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    rankBadge: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, name, rankBadge }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Confetti
                        width={typeof window !== 'undefined' ? window.innerWidth : 400}
                        height={typeof window !== 'undefined' ? window.innerHeight : 600}
                        recycle={false}
                        numberOfPieces={150}
                        colors={['#C9A962', '#E5D4A1', '#FFD700', '#B08D45']}
                    />

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                            className="text-center max-w-md"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <Badge rank={rankBadge as any} size="lg" />
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="text-3xl font-bold text-white mb-2"
                            >
                                {name}様
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 }}
                                className="text-xl text-accent mb-8"
                            >
                                お待ちしておりました
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                                className="text-gray-400 text-sm mb-8"
                            >
                                伍心会へようこそ。<br />
                                選ばれしメンバーのためのネットワークへ。
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.3 }}
                            >
                                <Button variant="gold" onClick={onClose} className="px-12">
                                    はじめる
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
