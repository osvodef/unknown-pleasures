import { analyserFftSize } from '../constants';

export class FallbackAnalyserNode {
    public frequencyBinCount: number;

    private audioElement: HTMLAudioElement;
    private samples?: Uint8Array;
    private sampleCount: number;
    private sampleIndex: number;

    private lastDisplayedTime: number;

    constructor(audioElement: HTMLAudioElement) {
        this.audioElement = audioElement;
        this.sampleIndex = 0;
        this.sampleCount = 0;
        this.frequencyBinCount = analyserFftSize / 2;
        this.lastDisplayedTime = 0;

        fetch('/samples.dat')
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                this.samples = new Uint8Array(buffer);
                this.sampleCount = this.samples.length / this.frequencyBinCount;
            });
    }

    public getByteTimeDomainData(array: Uint8Array): void {
        const audioTime = this.audioElement.currentTime;

        if (this.samples !== undefined && audioTime > this.lastDisplayedTime) {
            const indexOffset = this.sampleIndex * this.frequencyBinCount;

            for (let i = 0; i < this.frequencyBinCount; i++) {
                array[i] = this.samples[indexOffset + i];
            }

            this.sampleIndex = (this.sampleIndex + 1) % this.sampleCount;
            this.lastDisplayedTime = audioTime;
        } else {
            for (let i = 0; i < array.length; i++) {
                array[i] = 128;
            }
        }
    }
}
