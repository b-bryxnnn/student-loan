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

// แก้ปัญหา Tesseract อ่านตัวเลขผิดบ่อย (เช่น 5 เป็น 6, b เป็น 6, O เป็น 0)
function cleanNumberText(text: string): string {
    return text
        .replace(/[oO]/g, '0')
        .replace(/[iIlL|]/g, '1')
        .replace(/[zZ]/g, '2')
        .replace(/[sS]/g, '5')
        .replace(/[b]/g, '6')
        .replace(/[B]/g, '8')
        .replace(/[gq]/g, '9')
        .replace(/๕/g, '5')
        .replace(/๖/g, '6');
}

// ดึงเฉพาะตัวเลข 13 หลักติดกัน
function extractIdCard(text: string): string | undefined {
    // ขั้นแรก คลีนเฉพาะอักขระที่ชอบอ่านผิดให้กลายเป็นตัวเลขก่อน
    const cleanedText = cleanNumberText(text).replace(/\s|-|\./g, '');

    // ค้นหาตัวเลข 13 หลัก (มักขึ้นต้นด้วย 1-9)
    const m13 = cleanedText.match(/[1-9]\d{12}/);
    if (m13) return m13[0];

    return undefined;
}

// คลีนตัวอักษรไทยที่ Tesseract ชอบอ่านผิด
function cleanThaiText(text: string): string {
    return text.replace(/เเ/g, 'แ').replace(/ำ/g, 'ำ').trim();
}

// ดึงคำนำหน้า ชื่อ-นามสกุล
function extractThaiName(text: string): { prefix?: string; firstName?: string; lastName?: string } {
    const lines = text.split('\n').map(l => cleanThaiText(l)).filter(Boolean);

    // List คำนำหน้าที่เจอบ่อย
    const prefixes = ["นาย", "นางสาว", "นาง", "ด.ช.", "ด.ญ.", "เด็กชาย", "เด็กหญิง", "น.ส.", "น.ส"];

    for (const line of lines) {
        // หาบรรทัดที่มี คำนำหน้า + ชื่อ + นามสกุล หรือ "ชื่อตัวและชื่อสกุล"
        // บางครั้ง Tesseract อ่านเป็น "ชือตัวและชือสกุล" หรือ "Name"
        let cleanLine = line.replace(/^(?:ชื่อตัวและชื่อสกุล|ชือตัวและชือสกุล|ชื่อ|Name)\s*/i, '').trim();
        cleanLine = cleanLine.replace(/^(?:Thai Name)\s*/i, '').trim();

        for (const pref of prefixes) {
            if (cleanLine.startsWith(pref)) {
                let prefix = pref;
                if (prefix === 'เด็กชาย') prefix = 'ด.ช.';
                if (prefix === 'เด็กหญิง') prefix = 'ด.ญ.';
                if (prefix === 'น.ส.' || prefix === 'น.ส') prefix = 'นางสาว';

                // หั่นส่วนที่เหลือออกมา
                let rest = cleanLine.substring(pref.length).trim();

                // ถอดนามสกุลภาษาอังกฤษออก (ถ้าอ่านติดมาด้วย เช่น "นายสมชาย ใจดี Somchai Jaidee")
                rest = rest.replace(/[a-zA-Z].*$/, '').trim();

                const parts = rest.split(/\s+/).filter(p => p.length > 0);
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
