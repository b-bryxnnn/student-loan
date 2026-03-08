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

    const startCamera = useCallback(async () => {
        try {
            setCameraError("");

            // Enumerate devices to find the main (non-wide) back camera
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === "videoinput");

            // Try to find a back camera that is NOT the ultra-wide
            // On most phones, the "main" back camera has a label without "wide" or "0.5"
            let selectedDeviceId: string | undefined;
            for (const device of videoDevices) {
                const label = device.label.toLowerCase();
                // Skip front cameras and ultra-wide cameras
                if (label.includes("front") || label.includes("user")) continue;
                if (label.includes("wide") || label.includes("ultra") || label.includes("0.5")) continue;
                // Prefer cameras with "back", "rear", "environment", or generic names
                if (label.includes("back") || label.includes("rear") || label.includes("environment") || !label.includes("front")) {
                    selectedDeviceId = device.deviceId;
                    break;
                }
            }

            const constraints: MediaStreamConstraints = {
                video: selectedDeviceId
                    ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Try to set zoom to 1x to avoid 0.5x ultra-wide lens
            const track = mediaStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            if (capabilities && (capabilities as any).zoom) {
                const zoomCaps = (capabilities as any).zoom;
                // Set to 1.0 if available, or to minimum if 1.0 is below min
                const targetZoom = Math.max(zoomCaps.min || 1, 1);
                try {
                    await track.applyConstraints({
                        advanced: [{ zoom: targetZoom }] as any
                    });
                } catch (e) {
                    console.log("Zoom constraint not supported", e);
                }
            }

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้ใช้งานกล้อง หรือใช้การอัปโหลดรูปแทน");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match actual video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(base64);

        // Stop stream after capture
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    if (capturedImage) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-primary/20 bg-black aspect-[3/2] flex items-center justify-center">
                    <img src={capturedImage} alt="Captured ID" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleRetake}>
                        <RotateCcw className="w-4 h-4 mr-2" /> ถ่ายใหม่
                    </Button>
                    <Button className="flex-1 shadow-md" onClick={handleConfirm}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> ใช้รูปนี้
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {cameraError ? (
                <div className="text-center p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm">
                    {cameraError}
                    <Button variant="outline" size="sm" onClick={onCancel} className="mt-4 bg-white/50 text-foreground">
                        ย้อนกลับไปอัปโหลดรูป
                    </Button>
                </div>
            ) : (
                <>
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/2] shadow-inner">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Dark overlay with clear center cutout */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%)"
                        }}></div>

                        {/* ID Card Guide Frame */}
                        <div className="absolute inset-[12%] rounded-xl border-2 border-white/70 border-dashed pointer-events-none flex flex-col justify-end p-2 pb-4">
                            <div className="bg-black/50 backdrop-blur-sm self-center px-3 py-1.5 rounded-full">
                                <p className="text-white text-xs text-center font-semibold">จัดบัตรประชาชนให้อยู่ในกรอบนี้</p>
                                <p className="text-white/80 text-[10px] text-center mt-0.5">ถ่ายในที่มีแสงสว่าง หลีกเลี่ยงแสงสะท้อน</p>
                            </div>
                        </div>

                        {/* Corner markers */}
                        <div className="absolute top-[12%] left-[12%] w-8 h-8 border-t-4 border-l-4 border-white pointer-events-none rounded-tl-lg"></div>
                        <div className="absolute top-[12%] right-[12%] w-8 h-8 border-t-4 border-r-4 border-white pointer-events-none rounded-tr-lg"></div>
                        <div className="absolute bottom-[12%] left-[12%] w-8 h-8 border-b-4 border-l-4 border-white pointer-events-none rounded-bl-lg"></div>
                        <div className="absolute bottom-[12%] right-[12%] w-8 h-8 border-b-4 border-r-4 border-white pointer-events-none rounded-br-lg"></div>

                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel} className="flex-1">
                            <X className="w-4 h-4 mr-2" /> ยกเลิก
                        </Button>
                        <Button onClick={handleCapture} className="flex-[2] shadow-md relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/20 scale-x-0 group-active:scale-x-100 transition-transform origin-left rounded-md"></div>
                            <Camera className="w-4 h-4 mr-2 relative z-10" /> <span className="relative z-10">ถ่ายรูป</span>
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
