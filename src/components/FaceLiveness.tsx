"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, RotateCcw, Loader2, AlertCircle } from "lucide-react";

type Direction = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN";

const CHALLENGES: { dir: Direction; label: string; instruction: string }[] = [
    { dir: "CENTER", label: "มองตรงกล้อง", instruction: "มองตรงกล้อง" },
    { dir: "LEFT", label: "หันซ้าย", instruction: "ค่อยๆ หันหน้าไปทางซ้าย" },
    { dir: "RIGHT", label: "หันขวา", instruction: "ค่อยๆ หันหน้าไปทางขวา" },
    { dir: "UP", label: "เงยหน้า", instruction: "ค่อยๆ เงยหน้าขึ้น" },
    { dir: "DOWN", label: "ก้มหน้า", instruction: "ค่อยๆ ก้มหน้าลง" },
];

// Final step: look straight to capture photo
const FINAL_STEP_LABEL = "มองตรงกล้องเพื่อจับภาพ";
const HOLD_MS = 800; // hold each pose for 0.8s to confirm
const FINAL_HOLD_MS = 1500; // hold center for 1.5s for final capture

interface FaceLivenessProps {
    onComplete: (faceImage: string) => void;
    onSkip?: () => void;
}

export default function FaceLiveness({ onComplete }: FaceLivenessProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(CHALLENGES.length).fill(false));
    const [capturingFinal, setCapturingFinal] = useState(false); // after all challenges, capturing center
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState("");

    // AI State
    const [apiReady, setApiReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [progressStatus, setProgressStatus] = useState("กำลังโหลดโมเดล AI...");
    const [holdProgress, setHoldProgress] = useState(0); // 0-100

    const stepRef = useRef(currentStep);
    const completedRef = useRef(completedSteps);
    const capturingFinalRef = useRef(false);
    const detectingRef = useRef(false);
    const holdStartRef = useRef<number | null>(null);

    useEffect(() => {
        stepRef.current = currentStep;
        completedRef.current = completedSteps;
        capturingFinalRef.current = capturingFinal;
    }, [currentStep, completedSteps, capturingFinal]);

    // 1. Load Face-API script from CDN
    useEffect(() => {
        if (typeof window !== "undefined" && !(window as any).faceapi) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js";
            script.async = true;
            script.onload = () => setApiReady(true);
            document.body.appendChild(script);
        } else if ((window as any).faceapi) {
            setApiReady(true);
        }

        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 2. Load Models
    useEffect(() => {
        if (!apiReady) return;
        const loadModels = async () => {
            try {
                const faceapi = (window as any).faceapi;
                const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setProgressStatus("พร้อมแล้ว กรุณากดปุ่มเปิดกล้อง");
            } catch (err) {
                console.error("Failed to load models:", err);
                setError("ไม่สามารถโหลดระบบตรวจจับใบหน้าได้ กรุณารีเฟรชหน้าเว็บ");
            }
        };
        loadModels();
    }, [apiReady]);

    const startCamera = useCallback(async () => {
        if (!modelsLoaded) return;
        try {
            setError("");
            setProgressStatus("กำลังเปิดกล้อง...");
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            setStream(mediaStream);
        } catch (err) {
            console.error(err);
            setError("ไม่สามารถเปิดกล้องได้ กรุณาให้สิทธิ์เข้าถึงหรือใช้เบราว์เซอร์อื่น");
        }
    }, [modelsLoaded]);

    useEffect(() => {
        if (stream && videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = async () => {
                try {
                    await videoRef.current?.play();
                    startDetection();
                } catch (e) {
                    console.error("Video play failed", e);
                    setError("เกิดข้อผิดพลาดในการเปิดกล้อง");
                }
            };
        }
    }, [stream]); // eslint-disable-line react-hooks/exhaustive-deps

    const stopCamera = useCallback(() => {
        detectingRef.current = false;
        setDetecting(false);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
    }, [stream]);

    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);
    };

    // 3. AI Detection Loop
    const startDetection = () => {
        if (detectingRef.current || !videoRef.current) return;
        detectingRef.current = true;
        setDetecting(true);
        setProgressStatus(CHALLENGES[0].instruction);
        detectFace();
    };

    const detectFace = async () => {
        const video = videoRef.current;
        const faceapi = (window as any).faceapi;

        if (!video || !faceapi || video.paused || video.ended || !detectingRef.current) {
            detectingRef.current = false;
            setDetecting(false);
            return;
        }

        try {
            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.4
            })).withFaceLandmarks();

            if (detection) {
                const landmarks = detection.landmarks;
                const nose = landmarks.getNose()[3]; // Tip
                const leftEye = landmarks.getLeftEye()[0]; // Outer
                const rightEye = landmarks.getRightEye()[3]; // Outer
                const jawBottom = landmarks.getJawOutline()[8]; // Chin
                const noseBridge = landmarks.getNose()[0]; // Bridge top

                // Calculate yaw (left/right)
                const leftDist = nose.x - leftEye.x;
                const rightDist = rightEye.x - nose.x;
                const yawRatio = leftDist / rightDist;

                // Calculate pitch (up/down) using nose bridge vs nose tip
                const eyeMidY = (leftEye.y + rightEye.y) / 2;
                const noseToEyesDist = nose.y - eyeMidY;
                const faceHeight = jawBottom.y - noseBridge.y;
                const pitchRatio = faceHeight > 0 ? noseToEyesDist / faceHeight : 0.5;

                const isCenter = yawRatio > 0.65 && yawRatio < 1.4 && pitchRatio > 0.3 && pitchRatio < 0.65;
                const isLeft = yawRatio > 1.4;
                const isRight = yawRatio < 0.65;
                const isUp = pitchRatio < 0.3;
                const isDown = pitchRatio > 0.65;

                // Check if we're in the final capture phase
                if (capturingFinalRef.current) {
                    if (isCenter) {
                        if (!holdStartRef.current) holdStartRef.current = Date.now();
                        const elapsed = Date.now() - holdStartRef.current;
                        const progress = Math.min(100, (elapsed / FINAL_HOLD_MS) * 100);
                        setHoldProgress(progress);

                        if (elapsed >= FINAL_HOLD_MS) {
                            // Capture!
                            setProgressStatus("สำเร็จ! กำลังบันทึกภาพ...");
                            const frame = captureFrame();
                            setFinished(true);
                            stopCamera();
                            if (frame) onComplete(frame);
                            return;
                        } else {
                            setProgressStatus("ค้างหน้าตรงไว้... กำลังจับภาพ");
                        }
                    } else {
                        holdStartRef.current = null;
                        setHoldProgress(0);
                        setProgressStatus("กรุณามองตรงกล้องเพื่อจับภาพ");
                    }
                } else {
                    // Challenge phase
                    const currentChallenge = CHALLENGES[stepRef.current]?.dir;
                    let pass = false;

                    if (currentChallenge === "CENTER" && isCenter) pass = true;
                    if (currentChallenge === "LEFT" && isLeft) pass = true;
                    if (currentChallenge === "RIGHT" && isRight) pass = true;
                    if (currentChallenge === "UP" && isUp) pass = true;
                    if (currentChallenge === "DOWN" && isDown) pass = true;

                    if (pass) {
                        if (!holdStartRef.current) holdStartRef.current = Date.now();
                        const elapsed = Date.now() - holdStartRef.current;
                        const progress = Math.min(100, (elapsed / HOLD_MS) * 100);
                        setHoldProgress(progress);

                        if (elapsed >= HOLD_MS) {
                            // This step passed!
                            holdStartRef.current = null;
                            setHoldProgress(0);
                            const stepToMark = stepRef.current;
                            const newCompleted = [...completedRef.current];
                            newCompleted[stepToMark] = true;
                            setCompletedSteps(newCompleted);

                            if (stepToMark >= CHALLENGES.length - 1) {
                                // All challenges done → go to final capture
                                setCapturingFinal(true);
                                setProgressStatus(FINAL_STEP_LABEL);
                            } else {
                                const nextStep = stepToMark + 1;
                                setCurrentStep(nextStep);
                                setProgressStatus(CHALLENGES[nextStep].instruction);
                            }
                        } else {
                            setProgressStatus("เยี่ยมมาก! ค้างไว้...");
                        }
                    } else {
                        holdStartRef.current = null;
                        setHoldProgress(0);
                        if (currentChallenge) {
                            const challenge = CHALLENGES[stepRef.current];
                            setProgressStatus(challenge?.instruction || "");
                        }
                    }
                }
            } else {
                holdStartRef.current = null;
                setHoldProgress(0);
                setProgressStatus("ไม่พบใบหน้า กรุณาอยู่ในกรอบและมีแสงสว่างเพียงพอ");
            }
        } catch (err) {
            // Ignore detection errors during frame drops
        }

        // Loop
        setTimeout(detectFace, 120);
    };

    const handleReset = () => {
        setCurrentStep(0);
        setCompletedSteps(new Array(CHALLENGES.length).fill(false));
        setCapturingFinal(false);
        setFinished(false);
        setHoldProgress(0);
        holdStartRef.current = null;
        startCamera();
    };

    // ====== Render ======

    if (finished) {
        return (
            <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-success">ยืนยันตัวตนเรียบร้อยแล้ว</p>
                <p className="text-xs text-muted-foreground">ระบบได้บันทึกภาพใบหน้าของคุณแล้ว</p>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" /> สแกนใหม่
                </Button>
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="text-center space-y-3 py-4 bg-muted/20 border border-border/50 rounded-xl p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-semibold">ระบบ AI สแกนใบหน้าอัตโนมัติ</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    ระบบจะตรวจสอบการมีชีวิตโดยให้หันหน้าตามคำสั่ง (ซ้าย ขวา บน ล่าง) จากนั้นจะถ่ายภาพใบหน้าตรงอัตโนมัติ
                    (ข้อมูลประมวลผลบนเบราว์เซอร์ของคุณ ปลอดภัย 100%)
                </p>
                {error && <p className="text-xs text-destructive flex justify-center items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

                {!apiReady || !modelsLoaded ? (
                    <div className="flex flex-col items-center gap-2 mt-4 text-xs text-primary font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" /> {progressStatus}
                    </div>
                ) : (
                    <Button onClick={startCamera} size="sm" className="mt-4 shadow-md w-full sm:w-auto">
                        <Camera className="w-4 h-4 mr-2" /> เริ่มสแกนใบหน้า
                    </Button>
                )}
            </div>
        );
    }

    const totalSteps = CHALLENGES.length + 1; // challenges + final capture
    const currentProgress = capturingFinal ? CHALLENGES.length : currentStep;

    return (
        <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-1.5">
                {CHALLENGES.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div
                            className={`transition-all rounded-full ${completedSteps[i]
                                ? "w-6 h-2 bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                                : !capturingFinal && i === currentStep
                                    ? "w-8 h-2 bg-primary shadow-[0_0_6px_rgba(37,99,235,0.4)]"
                                    : "w-2 h-2 bg-muted-foreground/30"
                                }`}
                        />
                    </div>
                ))}
                {/* Final capture dot */}
                <div className={`transition-all rounded-full ${finished
                    ? "w-6 h-2 bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                    : capturingFinal
                        ? "w-8 h-2 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                        : "w-2 h-2 bg-muted-foreground/30"
                    }`}
                />
            </div>

            {/* Camera Frame */}
            <div
                className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 bg-black rounded-full overflow-hidden border-4 shadow-xl transition-colors duration-300"
                style={{
                    borderColor: capturingFinal
                        ? `hsl(${40 + 80 * holdProgress / 100}, 80%, 50%)`
                        : holdProgress > 0
                            ? `hsl(${120 * holdProgress / 100}, 70%, 50%)`
                            : 'hsl(220, 70%, 50%)'
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="48" fill="none"
                        stroke={capturingFinal ? "#f59e0b" : holdProgress > 80 ? "#22c55e" : "#3b82f6"}
                        strokeWidth="2.5"
                        strokeDasharray={`${holdProgress * 3.01} 301`}
                        strokeLinecap="round"
                        className="transition-all duration-75"
                        transform="rotate(-90 50 50)"
                    />
                </svg>

                {/* Direction Arrow Overlay */}
                {!capturingFinal && !completedSteps[currentStep] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`text-white/40 text-5xl font-bold transition-opacity ${holdProgress > 0 ? 'opacity-0' : 'opacity-100'}`}>
                            {CHALLENGES[currentStep]?.dir === "LEFT" && "←"}
                            {CHALLENGES[currentStep]?.dir === "RIGHT" && "→"}
                            {CHALLENGES[currentStep]?.dir === "UP" && "↑"}
                            {CHALLENGES[currentStep]?.dir === "DOWN" && "↓"}
                            {CHALLENGES[currentStep]?.dir === "CENTER" && "●"}
                        </div>
                    </div>
                )}

                {/* Capture flash effect */}
                {capturingFinal && holdProgress > 90 && (
                    <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none" />
                )}

                {/* Status Text */}
                <div className="absolute inset-x-0 bottom-[15%] flex justify-center">
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                        <p className={`text-xs font-bold tracking-wide transition-colors ${capturingFinal ? 'text-amber-400'
                                : holdProgress > 60 ? 'text-green-400'
                                    : 'text-white'
                            }`}>
                            {progressStatus}
                        </p>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Step Label */}
            <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                    {capturingFinal
                        ? "✓ ตรวจสอบการมีชีวิตสำเร็จ — กรุณามองตรงเพื่อจับภาพ"
                        : `ขั้นตอนที่ ${currentStep + 1}/${CHALLENGES.length}: ${CHALLENGES[currentStep]?.label}`
                    }
                </p>
            </div>
        </div>
    );
}
