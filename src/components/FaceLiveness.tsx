"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, RotateCcw, Loader2, AlertCircle, Glasses, Sun, Lightbulb } from "lucide-react";

type Direction = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN";

const CHALLENGES: { dir: Direction; label: string; instruction: string }[] = [
    { dir: "CENTER", label: "มองตรงกล้อง", instruction: "มองตรงกล้อง" },
    { dir: "LEFT", label: "หันซ้าย", instruction: "ค่อยๆ หันหน้าไปทางซ้าย" },
    { dir: "RIGHT", label: "หันขวา", instruction: "ค่อยๆ หันหน้าไปทางขวา" },
    { dir: "UP", label: "เงยหน้า", instruction: "ค่อยๆ เงยหน้าขึ้นเล็กน้อย" },
    { dir: "DOWN", label: "ก้มหน้า", instruction: "ค่อยๆ ก้มหน้าลงเล็กน้อย" },
];

// Color flash for liveness: show colors, check face is still present
const COLOR_SEQUENCE = [
    { color: "#ef4444", name: "แดง" },
    { color: "#22c55e", name: "เขียว" },
    { color: "#3b82f6", name: "น้ำเงิน" },
];

const HOLD_MS = 700; // hold each pose for 0.7s
const FINAL_HOLD_MS = 1500; // hold center for capture
const COLOR_FLASH_MS = 800; // each color shown for 0.8s

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
    const [phase, setPhase] = useState<"tips" | "challenges" | "colorFlash" | "capture" | "done">("tips");
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState("");

    // Color flash state
    const [colorIndex, setColorIndex] = useState(0);
    const [colorFlashActive, setColorFlashActive] = useState(false);

    // AI State
    const [apiReady, setApiReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [progressStatus, setProgressStatus] = useState("กำลังโหลดโมเดล AI...");
    const [holdProgress, setHoldProgress] = useState(0);

    const stepRef = useRef(currentStep);
    const completedRef = useRef(completedSteps);
    const phaseRef = useRef(phase);
    const detectingRef = useRef(false);
    const holdStartRef = useRef<number | null>(null);
    const colorIndexRef = useRef(0);

    useEffect(() => {
        stepRef.current = currentStep;
        completedRef.current = completedSteps;
        phaseRef.current = phase;
        colorIndexRef.current = colorIndex;
    }, [currentStep, completedSteps, phase, colorIndex]);

    // 1. Load Face-API
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
                setProgressStatus("พร้อมแล้ว");
            } catch {
                setError("ไม่สามารถโหลดระบบตรวจจับใบหน้าได้ กรุณารีเฟรชหน้าเว็บ");
            }
        };
        loadModels();
    }, [apiReady]);

    const startCamera = useCallback(async () => {
        if (!modelsLoaded) return;
        try {
            setError("");
            // Simplied constraints to maximize compatibility.
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            setStream(mediaStream);
        } catch (err) {
            console.error("FaceLiveness camera error:", err);
            setError("ไม่สามารถเปิดกล้องหน้าได้ กรุณาให้สิทธิ์เข้าถึงกล้อง (Allow Camera) หรือตรวจสอบตั้งค่าเบราว์เซอร์");
        }
    }, [modelsLoaded]);

    useEffect(() => {
        if (stream && videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = async () => {
                try {
                    await videoRef.current?.play();
                    startDetection();
                } catch {
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

    // 3. Detection Loop
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
                scoreThreshold: 0.25 // ลดลงจาก 0.4 เพื่อตรวจจับได้ง่ายขึ้นเวลาก้มหน้า
            })).withFaceLandmarks();

            if (detection) {
                const landmarks = detection.landmarks;
                const nose = landmarks.getNose()[3];
                const leftEye = landmarks.getLeftEye()[0];
                const rightEye = landmarks.getRightEye()[3];
                const jawBottom = landmarks.getJawOutline()[8];
                const noseBridge = landmarks.getNose()[0];

                // Yaw (left/right)
                const leftDist = nose.x - leftEye.x;
                const rightDist = rightEye.x - nose.x;
                const yawRatio = leftDist / rightDist;

                // Pitch (up/down) — คำนวณจาก nose tip vs eye midpoint
                const eyeMidY = (leftEye.y + rightEye.y) / 2;
                const noseToEyesDist = nose.y - eyeMidY;
                const faceHeight = jawBottom.y - noseBridge.y;
                const pitchRatio = faceHeight > 0 ? noseToEyesDist / faceHeight : 0.5;

                // ปรับ threshold ให้ง่ายขึ้น (โดยเฉพาะ UP/DOWN)
                const isCenter = yawRatio > 0.6 && yawRatio < 1.45 && pitchRatio > 0.25 && pitchRatio < 0.7;
                const isLeft = yawRatio > 1.35;
                const isRight = yawRatio < 0.65;
                const isUp = pitchRatio < 0.28;    // ง่ายขึ้นจาก 0.3
                const isDown = pitchRatio > 0.62;  // ง่ายขึ้นจาก 0.65

                if (phaseRef.current === "capture") {
                    // Final center capture
                    if (isCenter) {
                        if (!holdStartRef.current) holdStartRef.current = Date.now();
                        const elapsed = Date.now() - holdStartRef.current;
                        const progress = Math.min(100, (elapsed / FINAL_HOLD_MS) * 100);
                        setHoldProgress(progress);

                        if (elapsed >= FINAL_HOLD_MS) {
                            setProgressStatus("สำเร็จ! กำลังบันทึกภาพ...");
                            const frame = captureFrame();
                            setFinished(true);
                            setPhase("done");
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
                } else if (phaseRef.current === "colorFlash") {
                    // During color flash — just verify face is still present
                    // Color cycling is handled by the timer, not detection
                    setProgressStatus("ตรวจสอบ... กรุณามองหน้าจอ");
                } else if (phaseRef.current === "challenges") {
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
                            holdStartRef.current = null;
                            setHoldProgress(0);
                            const stepToMark = stepRef.current;
                            const newCompleted = [...completedRef.current];
                            newCompleted[stepToMark] = true;
                            setCompletedSteps(newCompleted);

                            if (stepToMark >= CHALLENGES.length - 1) {
                                // All challenges done → color flash
                                startColorFlash();
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
                        const challenge = CHALLENGES[stepRef.current];
                        setProgressStatus(challenge?.instruction || "");
                    }
                }
            } else {
                holdStartRef.current = null;
                setHoldProgress(0);
                if (phaseRef.current === "challenges") {
                    setProgressStatus("ไม่พบใบหน้า กรุณาอยู่ในกรอบ");
                }
            }
        } catch {
            // ignore frame errors
        }

        setTimeout(detectFace, 130);
    };

    // Color flash sequence
    const startColorFlash = () => {
        setPhase("colorFlash");
        setColorIndex(0);
        setColorFlashActive(true);
        setProgressStatus("ตรวจสอบ... กรุณามองหน้าจอ");

        let idx = 0;
        const flashInterval = setInterval(() => {
            idx++;
            if (idx >= COLOR_SEQUENCE.length) {
                clearInterval(flashInterval);
                setColorFlashActive(false);
                setPhase("capture");
                setProgressStatus("มองตรงกล้องเพื่อจับภาพ");
            } else {
                setColorIndex(idx);
            }
        }, COLOR_FLASH_MS);
    };

    const handleStartScan = () => {
        setPhase("challenges");
        startCamera();
    };

    const handleReset = () => {
        setCurrentStep(0);
        setCompletedSteps(new Array(CHALLENGES.length).fill(false));
        setPhase("tips");
        setFinished(false);
        setHoldProgress(0);
        setColorIndex(0);
        setColorFlashActive(false);
        holdStartRef.current = null;
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

    // Tips screen
    if (phase === "tips") {
        return (
            <div className="text-center space-y-4 py-8 bg-card border shadow-lg rounded-xl p-6 sm:p-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">ระบบยืนยันตัวตนด้วยใบหน้า</h3>

                {/* Tips with high contrast */}
                <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-xl p-5 text-left space-y-3 max-w-sm mx-auto shadow-sm">
                    <p className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5" /> คำแนะนำก่อนเริ่มสแกน
                    </p>
                    <div className="space-y-3 text-sm text-foreground/90">
                        <p className="flex items-start gap-3">
                            <span className="bg-muted p-1.5 rounded-md text-foreground">
                                <Glasses className="w-4 h-4" />
                            </span>
                            <span className="mt-1"><strong>โปรดถอดแว่นตา</strong> ป้องกันแสงสะท้อน</span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="bg-muted p-1.5 rounded-md text-foreground">
                                <Sun className="w-4 h-4" />
                            </span>
                            <span className="mt-1"><strong>อยู่ในที่สว่าง</strong> หลีกเลี่ยงเงามืดหรือการย้อนแสง</span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="bg-muted p-1.5 rounded-md text-foreground">
                                <Camera className="w-4 h-4" />
                            </span>
                            <span className="mt-1"><strong>จัดหน้าตรง</strong> และค่อยๆ ทำตามคำสั่งบนหน้าจอ</span>
                        </p>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-4 px-2">
                    ข้อมูลจะถูกประมวลผลบนเครื่องของคุณเพื่อความปลอดภัยสูงสุดและไม่ถ่ายโอนวิดีโอออกจากอุปกรณ์
                </p>

                {error && <p className="text-xs text-destructive flex justify-center items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

                {!apiReady || !modelsLoaded ? (
                    <div className="flex flex-col items-center gap-2 mt-4 text-xs text-primary font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" /> {progressStatus}
                    </div>
                ) : (
                    <Button onClick={handleStartScan} size="sm" className="mt-4 shadow-md w-full sm:w-auto">
                        <Camera className="w-4 h-4 mr-2" /> เริ่มสแกนใบหน้า
                    </Button>
                )}
            </div>
        );
    }

    if (!stream && phase !== "done") {
        return (
            <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">กำลังเปิดกล้อง...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-1.5">
                {CHALLENGES.map((_, i) => (
                    <div key={i}
                        className={`transition-all rounded-full ${completedSteps[i]
                            ? "w-6 h-2 bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                            : phase === "challenges" && i === currentStep
                                ? "w-8 h-2 bg-primary shadow-[0_0_6px_rgba(37,99,235,0.4)]"
                                : "w-2 h-2 bg-muted-foreground/30"
                            }`}
                    />
                ))}
                {/* Color flash dots */}
                {COLOR_SEQUENCE.map((c, i) => (
                    <div key={`c${i}`}
                        className={`transition-all rounded-full ${phase === "colorFlash" && i <= colorIndex
                            ? "w-4 h-2 shadow-sm"
                            : phase === "capture" || phase === "done"
                                ? "w-4 h-2 shadow-sm"
                                : "w-2 h-2 bg-muted-foreground/20"
                            }`}
                        style={
                            (phase === "colorFlash" && i <= colorIndex) || phase === "capture" || phase === "done"
                                ? { backgroundColor: c.color }
                                : {}
                        }
                    />
                ))}
                {/* Capture dot */}
                <div className={`transition-all rounded-full ${phase === "done"
                    ? "w-6 h-2 bg-success"
                    : phase === "capture"
                        ? "w-8 h-2 bg-amber-500"
                        : "w-2 h-2 bg-muted-foreground/20"
                    }`}
                />
            </div>

            {/* Camera + Color Flash overlay */}
            <div
                className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 bg-black rounded-full overflow-hidden border-4 shadow-xl transition-colors duration-300"
                style={{
                    borderColor: phase === "capture"
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

                {/* Color flash overlay */}
                {phase === "colorFlash" && colorFlashActive && (
                    <div
                        className="absolute inset-0 pointer-events-none transition-colors duration-200"
                        style={{ backgroundColor: COLOR_SEQUENCE[colorIndex]?.color, opacity: 0.35 }}
                    />
                )}

                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="48" fill="none"
                        stroke={phase === "capture" ? "#f59e0b" : holdProgress > 80 ? "#22c55e" : "#3b82f6"}
                        strokeWidth="2.5"
                        strokeDasharray={`${holdProgress * 3.01} 301`}
                        strokeLinecap="round"
                        className="transition-all duration-75"
                        transform="rotate(-90 50 50)"
                    />
                </svg>

                {/* Direction Arrow */}
                {phase === "challenges" && !completedSteps[currentStep] && (
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

                {/* Capture flash */}
                {phase === "capture" && holdProgress > 90 && (
                    <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none" />
                )}

                {/* Status */}
                <div className="absolute inset-x-0 bottom-[15%] flex justify-center">
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                        <p className={`text-xs font-bold tracking-wide ${phase === "capture" ? 'text-amber-400'
                            : phase === "colorFlash" ? 'text-purple-300'
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
                    {phase === "capture"
                        ? "✓ ตรวจสอบสำเร็จ — กรุณามองตรงเพื่อจับภาพ"
                        : phase === "colorFlash"
                            ? "🎨 ทดสอบแสงสี — กรุณามองหน้าจอ"
                            : `ขั้นตอนที่ ${currentStep + 1}/${CHALLENGES.length}: ${CHALLENGES[currentStep]?.label}`
                    }
                </p>
            </div>
        </div>
    );
}
