import lineVertGlsl from './shaders/line.vert.glsl';
import lineFragGlsl from './shaders/line.frag.glsl';

import areaVertGlsl from './shaders/area.vert.glsl';
import areaFragGlsl from './shaders/area.frag.glsl';

import { Line } from './line';
import {
    lineWidth,
    lineMaxHeight,
    aspectRatio,
    lineCount,
    analyserFftSize,
    lineDelay,
    minPadding,
    lineColor,
    backgroundColor,
} from './constants';
import { Vec2 } from './vec2';
import { Program } from './program';
import { preprocess, generateZeroes } from './signal';
import { FallbackAnalyserNode } from './fallback/analyserNode';

interface ScopeOptions {
    container: HTMLElement;
    audio: HTMLAudioElement;
    progressBar: HTMLElement;
    useAudioApiFallback: boolean;
}

export class Scope {
    private container: HTMLElement;
    private audioElement: HTMLAudioElement;
    private progressBar: HTMLElement;
    private canvas: HTMLCanvasElement;

    private analyser?: AnalyserNode | FallbackAnalyserNode;

    private gl: WebGLRenderingContext;
    private lineProgram: Program;
    private areaProgram: Program;

    private lines: Line[];
    private lastLineCreationTime: number;

    private scopeSize: Vec2;
    private screenSize: Vec2;

    private hasStarted: boolean;
    private useAudioApiFallback: boolean;

    constructor(options: ScopeOptions) {
        const { container, audio, progressBar, useAudioApiFallback } = options;

        this.useAudioApiFallback = !!useAudioApiFallback;

        this.container = container;
        this.audioElement = audio;
        this.progressBar = progressBar;
        this.canvas = document.createElement('canvas');

        container.appendChild(this.canvas);

        window.addEventListener('resize', this.resetSize);

        const gl = this.canvas.getContext('webgl') as WebGLRenderingContext;

        gl.clearColor(
            backgroundColor[0],
            backgroundColor[1],
            backgroundColor[2],
            backgroundColor[3],
        );

        this.gl = gl;

        this.lines = [];
        this.lastLineCreationTime = 0;

        this.lineProgram = new Program(
            gl,
            lineVertGlsl,
            lineFragGlsl,
            ['position', 'normal'],
            [
                { name: 'color', type: '4f' },
                { name: 'screenSize', type: '2f' },
                { name: 'width', type: '1f' },
                { name: 'maxHeight', type: '1f' },
                { name: 'xLeft', type: '1f' },
                { name: 'xRight', type: '1f' },
                { name: 'yOffset', type: '1f' },
            ],
        );

        this.areaProgram = new Program(
            gl,
            areaVertGlsl,
            areaFragGlsl,
            ['position'],
            [
                { name: 'color', type: '4f' },
                { name: 'screenSize', type: '2f' },
                { name: 'maxHeight', type: '1f' },
                { name: 'xLeft', type: '1f' },
                { name: 'xRight', type: '1f' },
                { name: 'yOffset', type: '1f' },
            ],
        );

        this.lineProgram.use();
        this.lineProgram.bindUniform('color', ...lineColor);

        this.areaProgram.use();
        this.areaProgram.bindUniform('maxHeight', lineMaxHeight);
        this.areaProgram.bindUniform('color', ...backgroundColor);

        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.scopeSize = new Vec2(0, 0);
        this.screenSize = new Vec2(0, 0);
        this.resetSize();

        this.createInitialLines();
        this.render();

        this.hasStarted = false;
    }

    public play(): void {
        if (!this.hasStarted) {
            this.initAudio();
            this.renderLoop();

            this.hasStarted = true;
        }

        this.audioElement.play();
    }

    public pause(): void {
        this.audioElement.pause();
    }

    private resetSize = (): void => {
        const { gl, canvas, container } = this;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scaledWidth = width * window.devicePixelRatio;
        const scaledHeight = height * window.devicePixelRatio;

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        gl.viewport(0, 0, scaledWidth, scaledHeight);

        const scopeSize = this.calcScopeSize(scaledWidth, scaledHeight);
        const paddingLeftRight = (scaledWidth - scopeSize.x) / 2;

        this.lineProgram.use();
        this.lineProgram.bindUniform('screenSize', scaledWidth, scaledHeight);
        this.lineProgram.bindUniform('maxHeight', lineMaxHeight * scopeSize.y);
        this.lineProgram.bindUniform('xLeft', paddingLeftRight);
        this.lineProgram.bindUniform('xRight', scaledWidth - paddingLeftRight);
        this.lineProgram.bindUniform('width', scopeSize.y * lineWidth);

        this.areaProgram.use();
        this.areaProgram.bindUniform('screenSize', scaledWidth, scaledHeight);
        this.areaProgram.bindUniform('maxHeight', lineMaxHeight * scopeSize.y);
        this.areaProgram.bindUniform('xLeft', paddingLeftRight);
        this.areaProgram.bindUniform('xRight', scaledWidth - paddingLeftRight);

        this.scopeSize = scopeSize;
        this.screenSize = new Vec2(scaledWidth, scaledHeight);
    };

    private renderLoop = (): void => {
        requestAnimationFrame(this.renderLoop);

        this.render();
    };

    private render(): void {
        const { gl, lines } = this;

        const time = Date.now();

        this.updateProgressBar();
        this.updateLines();

        gl.clear(gl.COLOR_BUFFER_BIT);

        const paddingTopBottom = (this.screenSize.y - this.scopeSize.y) / 2;
        const lineStep = this.scopeSize.y / lineCount;

        for (let i = 0; i < this.lines.length; i++) {
            const line = lines[i];
            const lineAge = time - line.creationTime;
            const yOffset = paddingTopBottom + (lineAge / lineDelay) * lineStep;

            this.areaProgram.use();
            this.areaProgram.bindAttribute('position', line.areaBuffer);
            this.areaProgram.bindUniform('yOffset', yOffset);
            gl.drawArrays(gl.TRIANGLES, 0, line.vertexCount);

            this.lineProgram.use();
            this.lineProgram.bindAttribute('position', line.positionBuffer);
            this.lineProgram.bindAttribute('normal', line.normalBuffer);
            this.lineProgram.bindUniform('yOffset', yOffset);
            gl.drawArrays(gl.TRIANGLES, 0, line.vertexCount);
        }
    }

    private initAudio(): void {
        if (this.analyser !== undefined) {
            return;
        }

        if (this.useAudioApiFallback) {
            this.analyser = new FallbackAnalyserNode(this.audioElement);
        } else {
            const audioContext = window.AudioContext || window.webkitAudioContext;

            const ctx = new audioContext();
            const analyser = ctx.createAnalyser();
            const source = ctx.createMediaElementSource(this.audioElement);

            source.connect(analyser);
            analyser.connect(ctx.destination);

            analyser.fftSize = analyserFftSize;

            this.analyser = analyser;
        }
    }

    private updateProgressBar(): void {
        const { currentTime, duration } = this.audioElement;
        const elapsedRatio = currentTime / duration;

        this.progressBar.style.transform = `translateX(${-(1 - elapsedRatio) * 100}%)`;
    }

    private createInitialLines(): void {
        const currentCreationTime = Math.floor(Date.now() / lineDelay) * lineDelay;

        for (let i = 0; i < lineCount; i++) {
            this.createBlankLine(currentCreationTime - (lineCount - 1 - i) * lineDelay);
        }

        this.lastLineCreationTime = currentCreationTime;
    }

    private updateLines(): void {
        while (this.lines.length > lineCount) {
            this.lines[0].dispose();
            this.lines.shift();
        }

        const lineCreationTime = Math.floor(Date.now() / lineDelay) * lineDelay;

        if (lineCreationTime > this.lastLineCreationTime) {
            const blankLineCount =
                Math.round((lineCreationTime - this.lastLineCreationTime) / lineDelay) - 1;

            for (let i = 0; i < blankLineCount; i++) {
                this.createBlankLine(this.lastLineCreationTime + (i + 1) * lineDelay);
            }

            this.createLine(lineCreationTime);

            this.lastLineCreationTime = lineCreationTime;
        }
    }

    private createLine(creationTime: number): void {
        if (this.analyser !== undefined) {
            const array = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteTimeDomainData(array);

            this.lines.push(new Line(this.gl, preprocess(array), creationTime));
        } else {
            this.createBlankLine(creationTime);
        }
    }

    private createBlankLine(creationTime: number): void {
        this.lines.push(new Line(this.gl, generateZeroes(2), creationTime));
    }

    private calcScopeSize(screenWidth: number, screenHeight: number): Vec2 {
        const availableScreenWidth = screenWidth - 2 * minPadding * screenWidth;
        const availableScreenHeight = screenHeight - 2 * minPadding * screenHeight;

        if (availableScreenWidth < availableScreenHeight * aspectRatio) {
            return new Vec2(availableScreenWidth, Math.round(availableScreenWidth / aspectRatio));
        }

        return new Vec2(Math.round(availableScreenHeight * aspectRatio), availableScreenHeight);
    }
}
