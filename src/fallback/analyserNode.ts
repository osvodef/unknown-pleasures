import { analyserFftSize } from '../constants';
import { Scope } from '../scope';

export class FallbackAnalyserNode {
    public frequencyBinCount: number;

    private scope: Scope;
    private samples?: Uint8Array;
    private sampleCount: number;
    private sampleIndex: number;

    constructor(scope: Scope) {
        this.scope = scope;
        this.sampleIndex = 0;
        this.sampleCount = 0;
        this.frequencyBinCount = analyserFftSize / 2;

        fetch('/samples.dat')
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                this.samples = new Uint8Array(buffer);
                this.sampleCount = this.samples.length / this.frequencyBinCount;
            });
    }

    public getByteTimeDomainData(array: Uint8Array): void {
        if (this.scope.isPaused() || this.samples === undefined) {
            for (let i = 0; i < array.length; i++) {
                array[i] = 128;
            }

            return;
        }

        const indexOffset = this.sampleIndex * this.frequencyBinCount;

        for (let i = 0; i < this.frequencyBinCount; i++) {
            array[i] = this.samples[indexOffset + i];
        }

        this.sampleIndex = (this.sampleIndex + 1) % this.sampleCount;
    }
}
