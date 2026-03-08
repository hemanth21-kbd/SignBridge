import { useState, useRef, useEffect } from 'react';
import { Webcam, Type, Save, Volume2, RefreshCw } from 'lucide-react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import * as tf from '@tensorflow/tfjs';

export default function Translator({ user }: any) {
    const [mode, setMode] = useState<'gesture-to-text' | 'text-to-gesture'>('gesture-to-text');
    const [output, setOutput] = useState('');
    const [input, setInput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [language, setLanguage] = useState('en-US');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null);
    const [lstmModel, setLstmModel] = useState<tf.LayersModel | null>(null);
    const requestRef = useRef<number>(0);
    const isTranslatingRef = useRef(false);
    const lastVideoTimeRef = useRef(-1);
    const sequenceRef = useRef<number[][]>([]);
    
    // Actions that your LSTM model was trained on. Keep strictly in the same order as collect_data.py
    const actions = ['hello', 'how are you', 'what are you doing', 'i love you', 'goodbye'];

    useEffect(() => {
        async function initAI() {
            // 1. Initialize MediaPipe Gesture Recognizer (used to extract keypoints & static letters)
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
                const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: '/gesture_recognizer.task', // Use custom dataset task if available
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numHands: 2,
                });
                setRecognizer(gestureRecognizer);
            } catch (err) {
                console.warn("Static AI failed to load model. Ensure /gesture_recognizer.task exists.", err);
            }

            // 2. Initialize TensorFlow.js LSTM Model
            try {
                // Load TFJS model from public/tfjs_model directory (trained via Python)
                const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
                setLstmModel(loadedModel);
                console.log("LSTM Sentence Model loaded successfully");
            } catch (err) {
                console.warn("LSTM Model not found. Did you forget to copy tfjs_model into /public? Dynamic sentences are inactive until model builds.");
            }
        }
        initAI();
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
            sequenceRef.current = []; // Reset sequence cleanly
        }
    };

    const extractKeypoints = (results: any) => {
        // Create two 21x3 arrays for left and right hands, defaulting to 0
        let lh = new Float32Array(63).fill(0);
        let rh = new Float32Array(63).fill(0);

        if (results.landmarks && results.handednesses) {
            results.landmarks.forEach((landmarkList: any, idx: number) => {
                const handName = results.handednesses[idx][0].categoryName;
                const arr = new Float32Array(63);
                landmarkList.forEach((lm: any, i: number) => {
                    arr[i*3] = lm.x;
                    arr[i*3+1] = lm.y;
                    arr[i*3+2] = lm.z;
                });
                
                // MediaPipe on webcam is mirrored by default
                if (handName === 'Left') {
                    lh = arr;
                } else {
                    rh = arr;
                }
            });
        }
        
        // Combine arrays: [left hand array (63 points), right hand array (63 points)] = 126 total
        const keypoints = new Float32Array(126);
        keypoints.set(lh, 0);
        keypoints.set(rh, 63);
        return Array.from(keypoints);
    };

    const speakText = (textToSpeak: string = output) => {
        if (!textToSpeak) return;
        
        // 1. Cancel ongoing speech to prevent overlap
        window.speechSynthesis.cancel();
        
        // 2. Setup the voice
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language;
        utterance.rate = 0.9;  // Make it sound natural and conversational
        utterance.pitch = 1.0; 
        
        // 3. Speak the sentence!
        window.speechSynthesis.speak(utterance);
    };

    const predictWebcam = () => {
        if (!videoRef.current || !canvasRef.current || !recognizer) return;

        const startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
            lastVideoTimeRef.current = videoRef.current.currentTime;
            
            try {
                const results = recognizer.recognizeForVideo(videoRef.current, startTimeMs);

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    if (canvasRef.current.width !== videoRef.current.videoWidth) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                    ctx.save();
                    
                    // We can clear, but let's not draw anything if we're not using MediaPipe for sentences anymore,
                    // BUT we still want skeleton for single letters.
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // --- DRAW WIREFRAME SKELETON ---
                    if (results.landmarks) {
                        for (const landmarks of results.landmarks) {
                            ctx.strokeStyle = '#4f46e5';
                            ctx.lineWidth = 2;

                            const connections = [
                                [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                                [0, 5], [5, 6], [6, 7], [7, 8], // Index
                                [5, 9], [9, 10], [10, 11], [11, 12], // Middle
                                [9, 13], [13, 14], [14, 15], [15, 16], // Ring
                                [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky/Palm
                            ];

                            ctx.beginPath();
                            for (const [start, end] of connections) {
                                const p1 = landmarks[start];
                                const p2 = landmarks[end];
                                ctx.moveTo(p1.x * canvasRef.current.width, p1.y * canvasRef.current.height);
                                ctx.lineTo(p2.x * canvasRef.current.width, p2.y * canvasRef.current.height);
                            }
                            ctx.stroke();

                            ctx.fillStyle = '#10b981';
                            for (const point of landmarks) {
                                ctx.beginPath();
                                ctx.arc(point.x * canvasRef.current.width, point.y * canvasRef.current.height, 4, 0, 2 * Math.PI);
                                ctx.fill();
                            }
                        }
                    }
                    ctx.restore();

                    // --- LSTM SEQUENCE PREDICTION LOGIC (Full Sentences) ---
                    if (lstmModel && results.landmarks && results.landmarks.length > 0) {
                        // Extract 126 coordinate numbers for current frame
                        const keypoints = extractKeypoints(results);
                        sequenceRef.current.push(keypoints);
                        
                        // Sequence must be exactly 30 frames
                        if (sequenceRef.current.length > 30) {
                            sequenceRef.current.shift();
                        }

                        if (sequenceRef.current.length === 30) {
                            // Convert the standard JS array to a 3D Tensor array
                            const sequenceData = tf.tensor([sequenceRef.current]) as tf.Tensor3D;
                            const prediction = lstmModel.predict(sequenceData) as tf.Tensor;
                            const resArray = prediction.dataSync(); // Confidences for all 5 actions
                            
                            // Get the most confident action
                            const maxVal = Math.max(...Array.from(resArray));
                            const predictedActionIdx = resArray.indexOf(maxVal);

                            // Minimum confidence of 85% to trigger a complex sentence recognition
                            if (maxVal > 0.85) {
                                const predictedSentence = actions[predictedActionIdx];
                                
                                setOutput(prev => {
                                    // Make sure we didn't just read this exact action so we don't spam 
                                    if (prev.endsWith(predictedSentence)) return prev;
                                    
                                    const newText = prev + (prev.length > 0 ? ' • ' : '') + predictedSentence;
                                    speakText(predictedSentence); // Auto-read aloud via text-to-speech API
                                    return newText;
                                });
                                // We hit a match! Clear the sequence buffer so it can cleanly capture the next new action
                                sequenceRef.current = [];
                            }
                        }
                    } 
                    // --- MEDIA-PIPE STATIC FALLBACK (Single Letters) ---
                    else if (results.gestures.length > 0) {
                        for (const handGestures of results.gestures) {
                            if (handGestures.length > 0) {
                                const categoryName = handGestures[0].categoryName;
                                const categoryScore = parseFloat((handGestures[0].score * 100).toFixed(2));

                                if (categoryScore > 75 && categoryName !== 'None') {
                                    const mappedName = categoryName.replace('_', ' ');
                                    setOutput(prev => {
                                        // Avoid duplicating the last word
                                        const words = prev.trim().split(' ');
                                        if (words[words.length - 1] === mappedName) return prev;
                                        
                                        const newText = prev + (prev.length > 0 ? ' ' : '') + mappedName;
                                        // Speak the new gesture out loud!
                                        speakText(mappedName);
                                        return newText;
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (isTranslatingRef.current) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const handleRecordAndTranslate = async () => {
        if (!videoRef.current) return;
        
        setIsRecording(true);
        setOutput('Recording video frames...');
        const frames: string[] = [];
        const captureInterval = 300; // ms between frames
        const totalFrames = 8; // approx 2.4 seconds
        
        const captureFrame = () => {
            if (!videoRef.current) return;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoRef.current.videoWidth;
            tempCanvas.height = videoRef.current.videoHeight;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                frames.push(tempCanvas.toDataURL('image/jpeg', 0.5)); // 50% quality JPEG to save bandwidth
            }
        };

        let frameCount = 0;
        captureFrame(); // init immediately
        frameCount++;

        const timer = setInterval(async () => {
            captureFrame();
            frameCount++;
            
            if (frameCount >= totalFrames) {
                clearInterval(timer);
                setIsRecording(false);
                
                // Now send to backend
                try {
                    setOutput('Analyzing with Gemini AI...');
                    const res = await fetch('http://localhost:5000/api/translate/video', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ frames })
                    });
                    const data = await res.json();
                    
                    if (data.text) {
                        setOutput(data.text);
                        speakText(data.text);
                    } else if (data.error) {
                        setOutput('Error: ' + data.error + (data.details ? ' (' + data.details + ')' : ''));
                    }
                } catch (err) {
                    console.error(err);
                    setOutput('Translation failed. Is backend running with GEMINI_API_KEY?');
                }
            }
        }, captureInterval);
    };

    const handleSpeak = () => {
         speakText(mode === 'gesture-to-text' ? output : input);
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
                                style={{ transform: 'scaleX(-1)' }}
                            ></canvas>
                            {!isTranslating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                    <Webcam size={48} className="mb-4 opacity-50 group-hover:scale-110 transition-transform" />
                                    <p>Click "Start Camera" to track gestures</p>
                                </div>
                            )}
                            {isTranslating && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                                    <button
                                        onClick={handleRecordAndTranslate}
                                        disabled={isRecording}
                                        className={`px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all ${
                                            isRecording 
                                                ? 'bg-red-500 text-white animate-pulse' 
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                                        {isRecording ? 'Recording...' : 'Translate Sentence (Gemini AI)'}
                                    </button>
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
                                    onClick={() => { setOutput(''); sequenceRef.current = []; }}
                                    className="px-4 py-2 flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition text-sm font-semibold"
                                >
                                    <RefreshCw size={16} /> Clear
                                </button>
                                <button
                                    onClick={handleSpeak}
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
