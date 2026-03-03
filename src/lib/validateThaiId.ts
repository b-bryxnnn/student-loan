/**
 * ตรวจสอบเลขบัตรประจำตัวประชาชนไทย 13 หลัก (Thai National ID checksum)
 * 
 * Algorithm: Luhn-like mod 11
 * sum = d1×13 + d2×12 + d3×11 + ... + d12×2
 * check = (11 - (sum % 11)) % 10
 * ถ้า check === d13 → ถูกต้อง
 */
export function validateThaiId(id: string): boolean {
    // ต้องเป็นตัวเลข 13 หลักเท่านั้น
    if (!/^\d{13}$/.test(id)) return false;

    // ห้ามเป็นเลขซ้ำทั้งหมด (เช่น 1111111111111)
    if (/^(\d)\1{12}$/.test(id)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(id[i]) * (13 - i);
    }
    const check = (11 - (sum % 11)) % 10;
    return check === parseInt(id[12]);
}
