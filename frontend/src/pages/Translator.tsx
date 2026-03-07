import { useState, useRef, useEffect } from 'react';
import { Webcam, Type, Save, Volume2, RefreshCw } from 'lucide-react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export default function Translator({ user }: any) {
    const [mode, setMode] = useState<'gesture-to-text' | 'text-to-gesture'>('gesture-to-text');
    const [output, setOutput] = useState('');
    const [input, setInput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [language, setLanguage] = useState('en-US');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null);
    const requestRef = useRef<number>(0);
    const isTranslatingRef = useRef(false);
    const lastVideoTimeRef = useRef(-1);

    useEffect(() => {
        async function loadModel() {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    // Changing this to point to the local custom 1-Lakh model file. 
                    // Make sure you place the generated `gesture_recognizer.task` into the SignBridge/frontend/public folder!
                    modelAssetPath: '/gesture_recognizer.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 2,
            });
            setRecognizer(gestureRecognizer);
        }
        loadModel();
    }, []);

    const startCamera = async () => {
        if (navigator.mediaDevices.getUserMedia && videoRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
                isTranslatingRef.current = true;
                setIsTranslating(true);
                predictWebcam();
            });
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            isTranslatingRef.current = false;
            setIsTranslating(false);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    };

    const predictWebcam = () => {
        if (!videoRef.current || !recognizer || !canvasRef.current) return;

        const startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
            lastVideoTimeRef.current = videoRef.current.currentTime;
            const results = recognizer.recognizeForVideo(videoRef.current, startTimeMs);

            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Adjust canvas to match video dimensions
                if (canvasRef.current.width !== videoRef.current.videoWidth) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                }
                ctx.save();
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                // Draw hand landmarks
                if (results.landmarks) {
                    for (const landmarks of results.landmarks) {
                        // Draw connections (simple lines between points)
                        ctx.strokeStyle = '#4f46e5';
                        ctx.lineWidth = 2;

                        // Hand connections map
                        const connections = [
                            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                            [0, 5], [5, 6], [6, 7], [7, 8], // Index
                            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
                            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
                            [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm
                        ];

                        ctx.beginPath();
                        for (const [start, end] of connections) {
                            const p1 = landmarks[start];
                            const p2 = landmarks[end];
                            ctx.moveTo(p1.x * canvasRef.current.width, p1.y * canvasRef.current.height);
                            ctx.lineTo(p2.x * canvasRef.current.width, p2.y * canvasRef.current.height);
                        }
                        ctx.stroke();

                        // Draw joints
                        ctx.fillStyle = '#10b981';
                        for (const point of landmarks) {
                            ctx.beginPath();
                            ctx.arc(point.x * canvasRef.current.width, point.y * canvasRef.current.height, 4, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }
                ctx.restore();

                if (results.gestures.length > 0) {
                    const categoryName = results.gestures[0][0].categoryName;
                    const categoryScore = parseFloat((results.gestures[0][0].score * 100).toFixed(2));

                    // Format the name a bit nicer
                    const mappedName = categoryName.replace('_', ' ');

                    // For demo purposes, we append known gestures if confidence > 85
                    if (categoryScore > 75 && categoryName !== 'None') {
                        setOutput(prev => {
                            if (prev.endsWith(mappedName)) return prev;
                            const newText = prev + (prev.length > 0 ? ' ' : '') + mappedName;
                            return newText;
                        });
                    }
                }
            }
        }
        if (isTranslatingRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(output || input);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
    };

    const saveHistory = async () => {
        if (!user || (!output && !input)) return;
        try {
            await fetch('http://localhost:5000/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    text: mode === 'gesture-to-text' ? output : input,
                    type: mode
                }),
            });
            alert('Saved to history');
        } catch (err) {
            alert('Error saving history');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8 mb-20 mt-4">
            {/* Tab Switcher */}
            <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur p-1 rounded-2xl w-fit shadow-inner">
                <button
                    onClick={() => setMode('gesture-to-text')}
                    className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all ${mode === 'gesture-to-text' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/40'
                        }`}
                >
                    <Webcam size={20} />
                    Gesture to Text
                </button>
                <button
                    onClick={() => setMode('text-to-gesture')}
                    className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all ${mode === 'text-to-gesture' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/40'
                        }`}
                >
                    <Type size={20} />
                    Text to Gesture
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Area */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">{mode === 'gesture-to-text' ? 'Camera Feed' : 'Enter Text'}</h2>
                        {mode === 'gesture-to-text' && (
                            <button
                                onClick={isTranslating ? stopCamera : startCamera}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:scale-95 ${isTranslating ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {isTranslating ? 'Stop Camera' : 'Start Camera'}
                            </button>
                        )}
                    </div>

                    {mode === 'gesture-to-text' ? (
                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-inner group">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover mirror-x"
                                style={{ transform: 'scaleX(-1)' }}
                            ></video>
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            ></canvas>
                            {!isTranslating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                    <Webcam size={48} className="mb-4 opacity-50 group-hover:scale-110 transition-transform" />
                                    <p>Click "Start Camera" to track gestures</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type words or letters here to see animation..."
                                className="flex-1 p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition h-64"
                            ></textarea>
                        </div>
                    )}
                </div>

                {/* Output Area */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">{mode === 'gesture-to-text' ? 'Translation Output' : 'ASL Animation'}</h2>
                        <div className="flex space-x-2">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent text-sm border-gray-300 dark:border-gray-600 rounded-lg outline-none"
                            >
                                <option value="en-US">English (US)</option>
                                <option value="hi-IN">Hindi (HI)</option>
                            </select>
                        </div>
                    </div>

                    {mode === 'gesture-to-text' ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 overflow-y-auto min-h-[16rem]">
                                <p className="text-2xl lg:text-3xl font-medium tracking-wide">
                                    {output || <span className="text-gray-400 italic">Translation will appear here...</span>}
                                </p>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 justify-end">
                                <button
                                    onClick={() => setOutput('')}
                                    className="px-4 py-2 flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition text-sm font-semibold"
                                >
                                    <RefreshCw size={16} /> Clear
                                </button>
                                <button
                                    onClick={speakText}
                                    className="px-4 py-2 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition text-sm font-semibold shadow-lg shadow-indigo-500/30"
                                >
                                    <Volume2 size={16} /> Speak
                                </button>
                                {user && (
                                    <button
                                        onClick={saveHistory}
                                        className="px-4 py-2 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition text-sm font-semibold shadow-lg shadow-primary-500/30"
                                    >
                                        <Save size={16} /> Save
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 min-h-[16rem]">
                            {input ? (
                                <div className="flex items-center gap-4 flex-wrap justify-center">
                                    {input.toUpperCase().split('').map((char, i) => (
                                        char.trim() ? (
                                            <div key={i} className="flex flex-col items-center animate-pulse duration-1000">
                                                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center text-4xl font-bold shadow-inner">
                                                    {char}
                                                </div>
                                                <span className="mt-2 text-xs font-bold text-gray-500">Letter {char}</span>
                                            </div>
                                        ) : <div key={i} className="w-8"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic">Animations will load based on your text...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
