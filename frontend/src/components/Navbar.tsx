import { Link } from 'react-router-dom';
import { Moon, Sun, HandMetal, History, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ darkMode, setDarkMode, user, onLogout }: any) {
    return (
        <nav className="sticky top-0 z-50 w-full glass-panel rounded-none border-t-0 border-x-0 !shadow-sm dark:bg-gray-900/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <motion.div whileHover={{ rotate: 15 }} className="bg-primary-500 text-white p-2 rounded-xl">
                            <HandMetal size={24} />
                        </motion.div>
                        <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                            SignBridge
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <Link to="/translator" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                            Translator
                        </Link>
                        {user && (
                            <Link to="/history" className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
                                <History size={16} />
                                <span>History</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all focus:outline-none"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium hidden sm:block">Hello, {user.name}</span>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg transition-transform focus:scale-95 text-sm font-semibold"
                            >
                                <LogIn size={16} />
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
