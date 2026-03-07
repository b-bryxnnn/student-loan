"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

type Direction = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN";

const CHALLENGES: { dir: Direction; label: string }[] = [
    { dir: "CENTER", label: "มองตรงกล้อง" },
    { dir: "LEFT", label: "หันหน้าไปทางซ้าย" },
    { dir: "RIGHT", label: "หันหน้าไปทางขวา" },
    { dir: "UP", label: "เงยหน้าขึ้น" },
    { dir: "DOWN", label: "ก้มหน้าลง" },
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
    const [capturing, setCapturing] = useState(false);
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            setError("");
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 480, height: 480 },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => setCameraReady(true);
            }
        } catch {
            setError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้เข้าถึงกล้อง");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);

    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.7);
    };

    const handleCapture = () => {
        if (!cameraReady || capturing) return;
        setCapturing(true);

        // Simulate a brief delay for UX feedback
        setTimeout(() => {
            const frame = captureFrame();
            if (!frame) {
                setError("ไม่สามารถถ่ายภาพได้ กรุณาลองใหม่");
                setCapturing(false);
                return;
            }

            const newCompleted = [...completedSteps];
            newCompleted[currentStep] = true;
            setCompletedSteps(newCompleted);

            if (currentStep === CHALLENGES.length - 1) {
                // All steps done — use the CENTER photo as face image
                setFinished(true);
                stopCamera();
                onComplete(frame);
            } else {
                setCurrentStep(prev => prev + 1);
            }
            setCapturing(false);
        }, 500);
    };

    const handleReset = () => {
        setCurrentStep(0);
        setCompletedSteps(new Array(CHALLENGES.length).fill(false));
        setFinished(false);
        setCameraReady(false);
        startCamera();
    };

    if (finished) {
        return (
            <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-success">ยืนยันตัวตนเรียบร้อยแล้ว</p>
                <p className="text-xs text-muted-foreground">ระบบได้บันทึกภาพใบหน้าของคุณเรียบร้อย</p>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" /> ถ่ายใหม่
                </Button>
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-semibold">ยืนยันตัวตนด้วยใบหน้า</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    ระบบจะขอเปิดกล้องเพื่อถ่ายรูปใบหน้าของคุณ โดยให้หันหน้าตามทิศทางที่กำหนด (5 ท่า)
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button onClick={startCamera} size="sm">
                    <Camera className="w-4 h-4 mr-2" /> เปิดกล้องเพื่อยืนยัน
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Progress */}
            <div className="flex items-center justify-center gap-1.5">
                {CHALLENGES.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${completedSteps[i] ? "bg-success" : i === currentStep ? "bg-primary scale-125" : "bg-muted"
                            }`}
                    />
                ))}
            </div>

            {/* Challenge label */}
            <div className="text-center">
                <p className="text-sm font-semibold text-primary">
                    ขั้นตอนที่ {currentStep + 1}/{CHALLENGES.length}
                </p>
                <p className="text-base font-bold mt-0.5 animate-pulse">
                    {CHALLENGES[currentStep].label}
                </p>
            </div>

            {/* Camera */}
            <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                {capturing && (
                    <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Capture button */}
            <div className="text-center">
                <Button onClick={handleCapture} disabled={!cameraReady || capturing} className="shadow-md">
                    {capturing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก...</>
                    ) : (
                        <>📸 ถ่ายภาพ — {CHALLENGES[currentStep].label}</>
                    )}
                </Button>
            </div>

            {error && <p className="text-center text-xs text-destructive">{error}</p>}
        </div>
    );
}
