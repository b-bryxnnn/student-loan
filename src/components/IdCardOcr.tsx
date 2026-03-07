"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, CheckCircle2 } from "lucide-react";

interface OcrResult {
    idCard?: string;
    prefix?: string;
    firstName?: string;
    lastName?: string;
}

interface IdCardOcrProps {
    image: string; // base64
    onResult: (result: OcrResult) => void;
}

// ดึงเฉพาะตัวเลข 13 หลักติดกัน
function extractIdCard(text: string): string | undefined {
    // ลองหาเลข 13 หลักติดกัน
    const m13 = text.replace(/\s/g, '').match(/\d{13}/);
    if (m13) return m13[0];

    // ลองหาเลขบัตรที่มี space/dash คั่น เช่น 1-1234-56789-01-2
    const segments = text.match(/\d[\d\s\-\.]{14,18}\d/g);
    if (segments) {
        for (const seg of segments) {
            const digits = seg.replace(/\D/g, '');
            if (digits.length === 13) return digits;
        }
    }
    return undefined;
}

// ดึงชื่อ-นามสกุลจากข้อความภาษาไทย
function extractThaiName(text: string): { prefix?: string; firstName?: string; lastName?: string } {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        // หาบรรทัดที่มี คำนำหน้า + ชื่อ + นามสกุล
        const prefixMatch = line.match(/(นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*(.+)/);
        if (prefixMatch) {
            let prefix = prefixMatch[1];
            // normalize
            if (prefix === 'เด็กชาย') prefix = 'ด.ช.';
            if (prefix === 'เด็กหญิง') prefix = 'ด.ญ.';

            const rest = prefixMatch[2].trim();
            const parts = rest.split(/\s+/);
            if (parts.length >= 2) {
                return {
                    prefix,
                    firstName: parts[0],
                    lastName: parts.slice(1).join(' '),
                };
            } else if (parts.length === 1) {
                return { prefix, firstName: parts[0] };
            }
        }
    }

    // Fallback: หา "ชื่อ" หรือ "Name" label
    for (const line of lines) {
        const nameLabel = line.match(/(?:ชื่อ|Name|ชื่อตัวและชื่อสกุล)\s*(.+)/i);
        if (nameLabel) {
            const parts = nameLabel[1].trim().split(/\s+/);
            if (parts.length >= 2) {
                return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
            }
        }
    }

    return {};
}

export default function IdCardOcr({ image, onResult }: IdCardOcrProps) {
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [progress, setProgress] = useState(0);
    const workerRef = useRef<any>(null);

    const runOcr = async () => {
        setProcessing(true);
        setProgress(0);
        setDone(false);

        try {
            // Dynamic import เพื่อไม่ให้ load ตอนแรก
            const Tesseract = await import('tesseract.js');

            const result = await Tesseract.recognize(image, 'tha+eng', {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const text = result.data.text;
            console.log("OCR raw text:", text);

            const idCard = extractIdCard(text);
            const nameInfo = extractThaiName(text);

            const ocrResult: OcrResult = {
                idCard,
                ...nameInfo,
            };

            console.log("OCR extracted:", ocrResult);
            onResult(ocrResult);
            setDone(true);
        } catch (error) {
            console.error("OCR error:", error);
            // ส่งผลลัพธ์ว่าง — ไม่ block ผู้ใช้
            onResult({});
            setDone(true);
        } finally {
            setProcessing(false);
        }
    };

    if (done) {
        return (
            <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>อ่านข้อมูลจากบัตรเรียบร้อย — ตรวจสอบข้อมูลด้านบนอีกครั้ง</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runOcr}
                disabled={processing}
                className="text-xs gap-1.5"
            >
                {processing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> กำลังอ่านข้อมูล ({progress}%)...</>
                ) : (
                    <><ScanLine className="w-3 h-3" /> อ่านข้อมูลจากบัตรอัตโนมัติ (OCR)</>
                )}
            </Button>
        </div>
    );
}
