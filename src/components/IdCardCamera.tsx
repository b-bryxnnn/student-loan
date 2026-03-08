"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle2, RotateCcw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface IdCardCameraProps {
    onCapture: (base64: string) => void;
    onCancel: () => void;
}

export default function IdCardCamera({ onCapture, onCancel }: IdCardCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState("");

    // Lens switcher states
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();
    const initCameraRan = useRef(false);

    const startCamera = useCallback(async (deviceId?: string) => {
        try {
            setCameraError("");

            // ============================================================
            // กลยุทธ์ใหม่: ให้ผู้ใช้เลือกเลนส์เองได้หากภาพไม่ชัด (สลับกล้อง)
            // ============================================================

            let selectedDeviceId = deviceId;

            // ถ้าไม่มีกำหนด deviceId มา ให้หาเองครั้งแรก
            if (!selectedDeviceId) {
                try {
                    // ขอ permission ก่อน
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    tempStream.getTracks().forEach(t => t.stop());

                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(d => d.kind === "videoinput");

                    // Filter เอาแต่กล้องหลัง
                    const backCameras = videoDevices.filter(d => {
                        const l = d.label.toLowerCase();
                        return !l.includes("front") && !l.includes("user");
                    });

                    // เซฟเก็บไว้ให้ผู้ใช้กดสลับสลับได้
                    setAvailableCameras(backCameras.length > 0 ? backCameras : videoDevices);

                    // พยายามหากล้องที่ไม่ใช่ ultra-wide เป็นค่าเริ่มต้น
                    const nonWideback = backCameras.filter(d => {
                        const l = d.label.toLowerCase();
                        return !l.includes("wide") && !l.includes("ultra") && !l.includes("0.5") && !l.includes("macro");
                    });

                    if (nonWideback.length > 0) {
                        selectedDeviceId = nonWideback[0].deviceId;
                    } else if (backCameras.length > 0) {
                        // ถ้าไม่มีให้เลือกตัวแรกที่เจอ
                        selectedDeviceId = backCameras[0].deviceId;
                    }
                } catch {
                    // Fallback to constraints
                }
            }

            const constraints: MediaStreamConstraints = {
                video: selectedDeviceId
                    ? {
                        deviceId: { exact: selectedDeviceId },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    }
                    : {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                audio: false,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            setActiveDeviceId(selectedDeviceId);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาให้แอพเข้าถึงกล้องก่อน");
        }
    }, []);

    useEffect(() => {
        if (!initCameraRan.current) {
            initCameraRan.current = true;
            startCamera();
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const switchLens = () => {
        if (availableCameras.length <= 1) return;

        // Find current index
        const currentIndex = availableCameras.findIndex(c => c.deviceId === activeDeviceId);
        // Next index
        const nextIndex = (currentIndex + 1) % availableCameras.length;
        const nextDeviceId = availableCameras[nextIndex].deviceId;

        // Stop current
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }

        // Start next
        startCamera(nextDeviceId);
        toast.info(`สลับกล้องเลนส์ที่ ${nextIndex + 1}/${availableCameras.length}`);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // ถ่ายจาก center crop ของ video (ป้องกัน wide angle)
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // Target aspect 86:54 (ID card ratio)
        const targetRatio = 86 / 54;
        let cropW = vw;
        let cropH = vw / targetRatio;
        if (cropH > vh) {
            cropH = vh;
            cropW = vh * targetRatio;
        }
        const cropX = (vw - cropW) / 2;
        const cropY = (vh - cropH) / 2;

        canvas.width = Math.min(cropW, 1920);
        canvas.height = Math.min(cropH, 1200);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.88);
        setCapturedImage(base64);
        toast.success("ถ่ายรูปสำเร็จแล้ว");
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    if (cameraError) {
        return (
            <div className="text-center space-y-3 py-6 bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                <p className="text-destructive text-sm">{cameraError}</p>
                <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => startCamera()}>
                        <Camera className="w-3 h-3 mr-1" /> ลองอีกครั้ง
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="w-3 h-3 mr-1" /> ยกเลิก
                    </Button>
                </div>
            </div>
        );
    }

    if (capturedImage) {
        return (
            <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border shadow-md">
                    <img src={capturedImage} alt="ภาพบัตรประชาชน" className="w-full" />
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-6 h-6 text-success drop-shadow-lg" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRetake} className="flex-1">
                        <RotateCcw className="w-3 h-3 mr-1" /> ถ่ายใหม่
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> ใช้รูปนี้
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black border shadow-md">
                {/* ID card guide frame */}
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[60%] border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                        <p className="text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full">
                            วางบัตรในกรอบนี้
                        </p>
                    </div>
                </div>

                {/* Switch Lens Button overlay */}
                {availableCameras.length > 1 && (
                    <div className="absolute top-4 right-4 z-20">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-md rounded-full shadow-lg h-9 font-medium border-white/20"
                            onClick={switchLens}
                        >
                            <Camera className="w-4 h-4 mr-2" /> สลับเลนส์ ({availableCameras.findIndex(c => c.deviceId === activeDeviceId) + 1}/{availableCameras.length})
                        </Button>
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-[86/54] object-cover"
                />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancel} className="flex-1">
                    <X className="w-3 h-3 mr-1" /> ยกเลิก
                </Button>
                <Button onClick={handleCapture} className="flex-1 shadow-md">
                    <Camera className="w-4 h-4 mr-2" /> ถ่ายรูป
                </Button>
            </div>
        </div>
    );
}
