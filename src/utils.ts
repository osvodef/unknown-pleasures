import { Vec2 } from './vec2';

type RGBA = [number, number, number, number];

export function clamp(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

export function hexToRgb(hex: string): RGBA {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        255,
    ];
}

export function lerpColors(color1: RGBA, color2: RGBA, ratio: number): RGBA {
    return [
        color1[0] * (1 - ratio) + color2[0] * ratio,
        color1[1] * (1 - ratio) + color2[1] * ratio,
        color1[2] * (1 - ratio) + color2[2] * ratio,
        color1[3] * (1 - ratio) + color2[3] * ratio,
    ];
}

export function getPeakVolume(analyser: AnalyserNode): number {
    const array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(array);

    let max = 0;
    for (let i = 0; i < array.length; i++) {
        const sample = Math.abs(array[i] - 128) / 128;
        if (sample > max) {
            max = sample;
        }
    }

    return max;
}

export function getDistance(points: [Vec2, Vec2]): number {
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;

    return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(points: [Vec2, Vec2]): Vec2 {
    return new Vec2((points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2);
}

export function getTouchPoints(e: TouchEvent): [Vec2, Vec2] {
    return [
        new Vec2(e.touches[0].clientX, e.touches[0].clientY),
        new Vec2(e.touches[1].clientX, e.touches[1].clientY),
    ];
}

export function isZoomGesture(prevPoints: [Vec2, Vec2], currPoints: [Vec2, Vec2]): boolean {
    const midpointDistance = getDistance([getMidpoint(prevPoints), getMidpoint(currPoints)]);

    const distance = Math.abs(getDistance(prevPoints) - getDistance(currPoints));

    return distance > midpointDistance;
}
