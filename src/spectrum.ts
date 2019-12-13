import { noiseAmount } from './constants';

export function preprocess(source: Uint8Array): number[] {
    const spectrum = Array.from(source)
        .map((value) => Math.abs(value - 128) / 128)
        .map((value, i, arr) => applyEnvelope(value, i, arr.length));

    return generateZeroes(60)
        .concat(smooth(spectrum))
        .concat(generateZeroes(60))
        .map((value) => applyNoise(value));
}

function generateZeroes(length: number): number[] {
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

function applyNoise(value: number): number {
    if (value > noiseAmount) {
        return value;
    }

    return value + Math.random() * noiseAmount;
}

function smooth(samples: number[]): number[] {
    const result = [];

    const window = 2;
    for (let i = 0; i < samples.length; i++) {
        let sum = 0;
        let count = 0;

        for (let j = i - window; j <= i + window; j++) {
            if (j >= 0 && j < samples.length) {
                sum += samples[j];
                count++;
            }
        }
        result[i] = sum / count;
    }

    return result;
}
