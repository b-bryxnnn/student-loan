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

            // ============================================================
            // กลยุทธ์: ขอกล้อง environment + ความละเอียดสูง
            //
            // ปัญหา: มือถือหลายรุ่น (Samsung, Xiaomi, etc.) จะเปิดเลนส์
            // ultra-wide (0.5x) เมื่อขอ facingMode: "environment"
            //
            // วิธีแก้:
            //  1. ใช้ enumerateDevices() เพื่อหาเลนส์หลัก (ไม่ใช่ wide)
            //  2. ตั้ง zoom constraint เป็น 2.0 (เท่ากับ 1x จริง)
            //  3. ถ้า zoom ไม่ได้ ก็ crop center ของ video แทน
            // ============================================================

            let selectedDeviceId: string | undefined;

            try {
                // ขอ permission ก่อนเพื่อให้ได้ label
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                tempStream.getTracks().forEach(t => t.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");

                // หากล้องที่ไม่ใช่ ultra-wide
                // ลำดับความสำคัญ: กล้องที่มี label "back" หรือ "rear" แต่ไม่มี "wide", "ultra", "0.5"
                const backCameras = videoDevices.filter(d => {
                    const l = d.label.toLowerCase();
                    return !l.includes("front") && !l.includes("user");
                });

                // หากล้อง back ที่ไม่ใช่ wide
                const nonWideback = backCameras.filter(d => {
                    const l = d.label.toLowerCase();
                    return !l.includes("wide") && !l.includes("ultra") && !l.includes("0.5") && !l.includes("macro");
                });

                if (nonWideback.length > 0) {
                    // ใช้ตัวแรก (มักเป็นกล้องหลัก 1x)
                    selectedDeviceId = nonWideback[0].deviceId;
                } else if (backCameras.length > 1) {
                    // ถ้ามี back camera หลายตัว ลองใช้ตัวที่ 2 (index 1)
                    // เพราะตัวแรกมักเป็น wide
                    selectedDeviceId = backCameras[1].deviceId;
                }
            } catch {
                // ถ้า enumerate ไม่ได้ ข้ามไป ใช้ default
            }

            const constraints: MediaStreamConstraints = {
                video: selectedDeviceId
                    ? {
                        deviceId: { exact: selectedDeviceId },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    }
                    : {
                        facingMode: { exact: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                audio: false,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            // พยายามตั้ง zoom เพื่อให้ได้มุมมอง 1x
            const track = mediaStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            if (capabilities && (capabilities as any).zoom) {
                const zoomCaps = (capabilities as any).zoom;
                // ถ้ามือถือ default เป็น 0.5x ค่า zoom min มักเป็น 1.0 แต่จริงๆ 1.0 คือ 0.5x
                // เราต้องตั้ง zoom เป็น 2.0 เพื่อให้ได้ 1x จริง
                // แต่ถ้า zoom min = 1.0 และ max > 2.0 → ตั้ง 2.0
                // ถ้า zoom min >= 2.0 → ตั้ง min
                const targetZoom = Math.min(zoomCaps.max || 2, Math.max(2, zoomCaps.min || 1));
                try {
                    await track.applyConstraints({
                        advanced: [{ zoom: targetZoom } as any]
                    });
                    console.log(`Camera zoom set to ${targetZoom}x`);
                } catch (e) {
                    console.log("Zoom constraint failed:", e);
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
