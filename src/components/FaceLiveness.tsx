"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, RotateCcw, Loader2, AlertCircle } from "lucide-react";

type Direction = "CENTER" | "LEFT" | "RIGHT";

const CHALLENGES: { dir: Direction; label: string }[] = [
    { dir: "CENTER", label: "มองตรงกล้อง" },
    { dir: "LEFT", label: "หันหน้าไปทางซ้าย" },
    { dir: "RIGHT", label: "หันหน้าไปทางขวา" },
];

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
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState("");

    // AI State
    const [apiReady, setApiReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [progressStatus, setProgressStatus] = useState("กำลังโหลดโมเดล AI...");

    const stepRef = useRef(currentStep); // To use in requestAnimationFrame
    const completedRef = useRef(completedSteps);

    useEffect(() => {
        stepRef.current = currentStep;
        completedRef.current = completedSteps;
    }, [currentStep, completedSteps]);

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
    }, []);

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
    }, [stream, videoRef.current]); // Reacting to stream change

    const stopCamera = useCallback(() => {
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
        return canvas.toDataURL("image/jpeg", 0.7);
    };

    // 3. AI Detection Loop
    const startDetection = () => {
        if (detecting || !videoRef.current) return;
        setDetecting(true);
        detectFace();
    };

    const detectFace = async () => {
        const video = videoRef.current;
        const faceapi = (window as any).faceapi;

        if (!video || !faceapi || video.paused || video.ended || stepRef.current >= CHALLENGES.length) {
            setDetecting(false);
            return;
        }

        try {
            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

            if (detection) {
                const landmarks = detection.landmarks;
                const nose = landmarks.getNose()[3]; // Tip
                const leftEye = landmarks.getLeftEye()[0]; // Outer
                const rightEye = landmarks.getRightEye()[3]; // Outer

                // Calculate yaw heuristic
                // The webcam is mirrored usually, so left / right might feel inverted
                const leftDist = nose.x - leftEye.x;
                const rightDist = rightEye.x - nose.x;
                const ratio = leftDist / rightDist;

                let isLeft = ratio > 2.0;    // Nose is much closer to right eye (user turned head right, but mirror makes it look leftish)
                let isRight = ratio < 0.5;   // Nose is much closer to left eye
                let isCenter = ratio > 0.8 && ratio < 1.3;

                // Also require head to be relatively straight for center

                const currentChallenge = CHALLENGES[stepRef.current].dir;
                let pass = false;

                if (currentChallenge === "CENTER" && isCenter) pass = true;
                if (currentChallenge === "LEFT" && isLeft) pass = true;
                if (currentChallenge === "RIGHT" && isRight) pass = true;

                if (pass) {
                    // Success for this step!
                    const stepToMark = stepRef.current;
                    setProgressStatus("เยี่ยมมาก! กรุณาค้างไว้...");

                    // Small delay to prevent accidental fast passes
                    await new Promise(r => setTimeout(r, 600));

                    const newCompleted = [...completedRef.current];
                    newCompleted[stepToMark] = true;
                    setCompletedSteps(newCompleted);

                    if (stepToMark === CHALLENGES.length - 1) {
                        // Finished
                        const frame = captureFrame();
                        setFinished(true);
                        stopCamera();
                        if (frame) onComplete(frame);
                        return; // Exit loop
                    } else {
                        setCurrentStep(prev => prev + 1);
                        setProgressStatus(CHALLENGES[stepToMark + 1].label);
                    }
                } else {
                    if (currentChallenge === "CENTER") setProgressStatus("มองตรงกล้อง");
                    if (currentChallenge === "LEFT") setProgressStatus("ค่อยๆ หันหน้าไปทางซ้าย");
                    if (currentChallenge === "RIGHT") setProgressStatus("ค่อยๆ หันหน้าไปทางขวา");
                }
            } else {
                setProgressStatus("ไม่พบใบหน้า กรุณาอยู่ในกรอบและมีแสงสว่างเพียงพอ");
            }
        } catch (err) {
            // Ignore tiny detection errors during frame drops
        }

        // Loop using setTimeout to not block UI thread
        setTimeout(detectFace, 150);
    };

    const handleReset = () => {
        setCurrentStep(0);
        setCompletedSteps(new Array(CHALLENGES.length).fill(false));
        setFinished(false);
        startCamera();
    };

    if (finished) {
        return (
            <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-success">ยืนยันตัวตนเรียบร้อยแล้ว</p>
                <p className="text-xs text-muted-foreground">ระบบได้บันทึกภาพใบหน้าของคุณอัตโนมัติ</p>
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
                    ระบบจะทำการวิเคราะห์การเคลื่อนไหวของใบหน้าคุณแบบอัตโนมัติ โดยให้มองและหันหน้าตามคำสั่ง ไม่ต้องกดปุ่มถ่ายใดๆ
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

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2">
                {CHALLENGES.map((_, i) => (
                    <div
                        key={i}
                        className={`transition-all rounded-full ${completedSteps[i]
                            ? "w-6 h-2 bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            : i === currentStep
                                ? "w-8 h-2 bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                                : "w-2 h-2 bg-muted-foreground/30"
                            }`}
                    />
                ))}
            </div>

            {/* Camera Frame */}
            <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 bg-black rounded-full overflow-hidden border-4 data-[success=true]:border-success data-[success=false]:border-primary/50 shadow-xl transition-colors duration-300" data-success={completedSteps[currentStep] || false}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Overlay Scanning Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite]" />

                {/* Crosshair / Guidelines */}
                <div className="absolute inset-x-0 bottom-[20%] flex justify-center">
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                        <p className={`text-sm font-bold tracking-wide transition-colors ${completedSteps[currentStep] ? 'text-success' : 'text-white'}`}>
                            {progressStatus}
                        </p>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="text-center text-xs text-muted-foreground">
                <p>ทำตามคำสั่งในกรอบวิดีโอ ระบบจะบันทึกอัตโนมัติ</p>
            </div>
        </div>
    );
}
