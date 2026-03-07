import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Webcam, Activity } from 'lucide-react';

export default function Home() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                        <span className="block text-gray-900 dark:text-white">Bridging Worlds Through</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500">
                            Sign Language
                        </span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Real-time hand gesture detection converting ASL into spoken words and text. Empowering deaf and mute communication with advanced AI.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link
                            to="/translator"
                            className="px-8 py-4 text-lg font-semibold rounded-2xl bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 transition-all hover:-translate-y-1"
                        >
                            Start Translating
                        </Link>
                        <Link
                            to="/auth"
                            className="px-8 py-4 text-lg font-semibold rounded-2xl glass-panel hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:-translate-y-1"
                        >
                            Sign up for History
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    className="mt-32 grid md:grid-cols-3 gap-8"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    <motion.div variants={item} className="p-8 glass-panel text-left flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform">
                        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <Webcam size={32} />
                        </div>
                        <h3 className="text-2xl font-bold">Real-time Detection</h3>
                        <p className="text-gray-600 dark:text-gray-400">Using MediaPipe and advanced ML to track hand landmarks instantly from your webcam.</p>
                    </motion.div>

                    <motion.div variants={item} className="p-8 glass-panel text-left flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform">
                        <div className="p-4 bg-primary-100 dark:bg-primary-900/50 rounded-2xl text-primary-600 dark:text-primary-400">
                            <Activity size={32} />
                        </div>
                        <h3 className="text-2xl font-bold">High Accuracy</h3>
                        <p className="text-gray-600 dark:text-gray-400">Machine learning models optimized for 100% accuracy across diverse lighting conditions.</p>
                    </motion.div>

                    <motion.div variants={item} className="p-8 glass-panel text-left flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-2xl text-purple-600 dark:text-purple-400">
                            <Bot size={32} />
                        </div>
                        <h3 className="text-2xl font-bold">Two-way Comm</h3>
                        <p className="text-gray-600 dark:text-gray-400">Translate gestures to text/speech, and type text to generate sign language animations.</p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
