import { noiseAmount, signalWidthRatio } from './constants';

export function preprocess(source: Uint8Array): number[] {
    const signal = Array.from(source)
        .map((value) => Math.abs(value - 128) / 128)
        .map((value, i, arr) => applyEnvelope(value, i, arr.length));

    const totalLength = Math.round(signal.length / signalWidthRatio);
    const zeroesLength = Math.round((totalLength * (1 - signalWidthRatio)) / 2);

    return generateZeroes(zeroesLength)
        .concat(smooth(signal))
        .concat(generateZeroes(zeroesLength))
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

    const window = 3;
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
