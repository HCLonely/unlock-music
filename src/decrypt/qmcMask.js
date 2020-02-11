import {FLAC_HEADER, IsBytesEqual} from "./util"

const QMOggConstHeader = [
    0x4F, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x1E, 0x01, 0x76, 0x6F, 0x72,
    0x62, 0x69, 0x73, 0x00, 0x00, 0x00, 0x00, 0x02, 0x44, 0xAC, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xEE, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB8, 0x01, 0x4F, 0x67, 0x67, 0x53, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x03, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73, 0x2C, 0x00, 0x00, 0x00,
    0x58, 0x69, 0x70, 0x68, 0x2E, 0x4F, 0x72, 0x67, 0x20, 0x6C, 0x69, 0x62, 0x56, 0x6F, 0x72, 0x62,
    0x69, 0x73, 0x20, 0x49, 0x20, 0x32, 0x30, 0x31, 0x35, 0x30, 0x31, 0x30, 0x35, 0x20, 0x28, 0xE2,
    0x9B, 0x84, 0xE2, 0x9B, 0x84, 0xE2, 0x9B, 0x84, 0xE2, 0x9B, 0x84, 0x29, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x54, 0x49, 0x54, 0x4C, 0x45, 0x3D];
const QMOggConstHeaderConfidence = [
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0,
    0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 6, 3, 3, 3, 3, 6, 6, 6, 6,
    3, 3, 3, 3, 6, 6, 6, 6, 6, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 9, 9, 9, 9,
    0, 0, 0, 0, 6, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 1, 9, 9,
    0, 1, 9, 9, 9, 9, 9, 9, 9, 9];
const QMCDefaultMaskMatrix = [
    0x4A, 0xD6, 0xCA, 0x90, 0x67, 0xF7, 0x52, 0x5E,
    0x95, 0x23, 0x9F, 0x13, 0x11, 0x7E, 0x47, 0x74,
    0x3D, 0x90, 0xAA, 0x3F, 0x51, 0xC6, 0x09, 0xD5,
    0x9F, 0xFA, 0x66, 0xF9, 0xF3, 0xD6, 0xA1, 0x90,
    0xA0, 0xF7, 0xF0, 0x1D, 0x95, 0xDE, 0x9F, 0x84,
    0x11, 0xF4, 0x0E, 0x74, 0xBB, 0x90, 0xBC, 0x3F,
    0x92, 0x00, 0x09, 0x5B, 0x9F, 0x62, 0x66, 0xA1];
const QMCDefaultMaskSuperA = 0xC3;
const QMCDefaultMaskSuperB = 0xD8;

class QmcMask {
    constructor(matrix, superA, superB) {
        if (superA === undefined || superB === undefined) {
            this.Matrix128 = matrix;
            this.generateMask58from128()
        } else {
            this.Matrix58 = matrix;
            this.Super58A = superA;
            this.Super58B = superB;
            this.generateMask128from58();
        }
    }

    generateMask128from58() {
        if (this.Matrix58.length !== 56) throw "incorrect mask58 matrix length";

        let matrix128 = [];
        for (let rowIdx = 0; rowIdx < 8; rowIdx += 1) {
            matrix128 = matrix128.concat(
                [this.Super58A],
                this.Matrix58.slice(7 * rowIdx, 7 * rowIdx + 7),
                [this.Super58B],
                this.Matrix58.slice(56 - 7 - 7 * rowIdx, 56 - 7 * rowIdx).reverse()
            );
        }
        this.Matrix128 = matrix128;
    }

    generateMask58from128() {
        if (this.Matrix128.length !== 128) throw "incorrect mask128 length";

        const superA = this.Matrix128[0], superB = this.Matrix128[8];
        let matrix58 = [];

        for (let rowIdx = 0; rowIdx < 8; rowIdx += 1) {
            let lenStart = 16 * rowIdx;
            let lenRightStart = 120 - lenStart;
            if (this.Matrix128[lenStart] !== superA || this.Matrix128[lenStart + 8] !== superB) {
                throw "decode mask-128 to mask-58 failed"
            }
            let rowLeft = this.Matrix128.slice(lenStart + 1, lenStart + 8);
            let rowRight = this.Matrix128.slice(lenRightStart + 1, lenRightStart + 8).reverse();
            if (IsBytesEqual(rowLeft, rowRight)) {
                matrix58 = matrix58.concat(rowLeft);
            } else {
                throw "decode mask-128 to mask-58 failed"
            }
        }
        this.Matrix58 = matrix58;
        this.Super58A = superA;
        this.Super58B = superB;
    }

    Decrypt(data) {
        let dst = data.slice(0);
        let maskIdx = -1;
        for (let cur = 0; cur < data.length; cur++) {
            maskIdx++;
            if (cur === 0x8001 || (cur > 0x8001 && cur % 0x8000 === 0)) maskIdx++;
            if (maskIdx >= 128) maskIdx -= 128;
            dst[cur] ^= this.Matrix128[maskIdx];
        }
        return dst;
    }
}

export function QmcMaskGetDefault() {
    return new QmcMask(QMCDefaultMaskMatrix, QMCDefaultMaskSuperA, QMCDefaultMaskSuperB)
}

export function QmcMaskDetectMflac(data) {
    let search_len = Math.min(0x8000, data.length), mask;
    for (let block_idx = 0; block_idx < search_len; block_idx += 128) {
        try {
            mask = new QmcMask(data.slice(block_idx, block_idx + 128));
            if (!IsBytesEqual(FLAC_HEADER, mask.Decrypt(data.slice(0, FLAC_HEADER.length)))) break;
        } catch (e) {
        }
    }
    return mask
}

export function QmcMaskDetectMgg(input) {
    if (input.length < QMOggConstHeader.length) return;
    let matrixConfidence = {};
    for (let i = 0; i < 58; i++) matrixConfidence[i] = {};

    for (let idx128 = 0; idx128 < QMOggConstHeader.length; idx128++) {
        if (QMOggConstHeaderConfidence[idx128] === 0) continue;
        let idx58 = GetMask58Index(idx128);
        let mask = input[idx128] ^ QMOggConstHeader[idx128];
        let confidence = QMOggConstHeaderConfidence[idx128];
        if (mask in matrixConfidence[idx58]) {
            matrixConfidence[idx58][mask] += confidence
        } else {
            matrixConfidence[idx58][mask] = confidence
        }
    }
    let matrix = [], superA, superB;
    try {
        for (let i = 0; i < 56; i++) matrix[i] = getMaskConfidenceResult(matrixConfidence[i]);
        superA = getMaskConfidenceResult(matrixConfidence[56]);
        superB = getMaskConfidenceResult(matrixConfidence[57]);
    } catch (e) {
        return;
    }
    return new QmcMask(matrix, superA, superB);
}

export function QmcMaskCreate128(mask128) {
    return new QmcMask(mask128)
}

export function QmcMaskCreate58(matrix, superA, superB) {
    return new QmcMask(matrix, superA, superB)
}

/**
 * @param confidence {{}}
 * @returns {number}
 */
function getMaskConfidenceResult(confidence) {
    if (confidence.length === 0) throw "can not match at least one key";
    let result, conf = 0;
    for (let idx in confidence) {
        if (confidence[idx] > conf) {
            result = idx;
            conf = confidence[idx];
        }
    }
    return parseInt(result)
}

/**
 * @return {number}
 */
function GetMask58Index(idx128) {
    if (idx128 > 127) idx128 = idx128 % 128;
    let col = idx128 % 16;
    let row = (idx128 - col) / 16;
    switch (col) {
        case 0://Super 1
            row = 8;
            col = 0;
            break;
        case 8://Super 2
            row = 8;
            col = 1;
            break;
        default:
            if (col > 7) {
                row = 7 - row;
                col = 15 - col;
            } else {
                col -= 1;
            }
            break;
    }
    return row * 7 + col
}