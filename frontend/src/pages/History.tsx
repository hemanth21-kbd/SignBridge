import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function History({ user }: any) {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (user?.id) {
            fetch(`${API_URL}/api/history/${user.id}`)
                .then((res) => res.json())
                .then((data) => setHistory(data))
                .catch((err) => console.error(err));
        }
    }, [user]);

    if (!user) {
        return (
            <div className="flex justify-center mt-20 text-xl font-semibold text-gray-500">
                Please log in to view history.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 pt-10">
            <h2 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-gray-100">Translation History</h2>
            {history.length === 0 ? (
                <div className="p-8 text-center glass-panel text-gray-500">
                    No history found. Start translating to save your conversations.
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-transform hover:-translate-y-1">
                            <div>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${item.type === 'gesture-to-text' ? 'bg-primary-100 text-primary-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {item.type === 'gesture-to-text' ? 'Sign -> Text' : 'Text -> Sign'}
                                </span>
                                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{item.text}</p>
                            </div>
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                {new Date(item.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
