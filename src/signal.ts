import { signalWidthRatio, smoothingWindow } from './constants';

export function preprocess(source: Uint8Array): number[] {
    const signal = Array.from(source)
        .map((value) => Math.abs(value - 128) / 128)
        .map((value, i, arr) => applyEnvelope(value, i, arr.length));

    const totalLength = Math.round(signal.length / signalWidthRatio);
    const zeroesLength = Math.round((totalLength * (1 - signalWidthRatio)) / 2);

    return generateZeroes(zeroesLength)
        .concat(smooth(signal))
        .concat(generateZeroes(zeroesLength));
}

export function generateZeroes(length: number): number[] {
    const result = [];

    for (let i = 0; i < length; i++) {
        result.push(0);
    }

    return result;
}

function applyEnvelope(value: number, index: number, length: number): number {
    const argument = index / (length - 1);

    return (value * (Math.sin(2 * Math.PI * (argument - 0.25)) + 1)) / 2;
}

function smooth(samples: number[]): number[] {
    const result = [];

    const halfWindowWidth = (samples.length * smoothingWindow) / 2;

    for (let i = 0; i < samples.length; i++) {
        let sum = 0;
        let count = 0;

        const leftBoundary = Math.ceil(i - halfWindowWidth);
        const rightBoundary = Math.floor(i + halfWindowWidth);

        for (let j = leftBoundary; j <= rightBoundary; j++) {
            if (j >= 0 && j < samples.length) {
                sum += samples[j];
                count++;
            }
        }
        result[i] = sum / count;
    }

    return result;
}
