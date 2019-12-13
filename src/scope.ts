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
import { preprocess } from './preprocess';

export class Scope {
    private container: HTMLElement;
    private audioElement: HTMLAudioElement;
    private canvas: HTMLCanvasElement;

    private analyser!: AnalyserNode;

    private gl: WebGLRenderingContext;
    private lineProgram: Program;
    private areaProgram: Program;

    private lines: Line[];
    private lastLineCreationTime: number;

    private scopeSize: Vec2;
    private screenSize: Vec2;

    constructor(domElement: HTMLElement, audioElement: HTMLAudioElement) {
        this.container = domElement;
        this.audioElement = audioElement;
        this.canvas = document.createElement('canvas');

        domElement.appendChild(this.canvas);

        this.initAudio();

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
            ['a_position', 'a_normal'],
            [
                { name: 'u_color', type: '4f' },
                { name: 'u_screen_size', type: '2f' },
                { name: 'u_width', type: '1f' },
                { name: 'u_max_height', type: '1f' },
                { name: 'u_x_left', type: '1f' },
                { name: 'u_x_right', type: '1f' },
                { name: 'u_y', type: '1f' },
            ],
        );

        this.areaProgram = new Program(
            gl,
            areaVertGlsl,
            areaFragGlsl,
            ['a_position'],
            [
                { name: 'u_color', type: '4f' },
                { name: 'u_screen_size', type: '2f' },
                { name: 'u_max_height', type: '1f' },
                { name: 'u_x_left', type: '1f' },
                { name: 'u_x_right', type: '1f' },
                { name: 'u_y', type: '1f' },
            ],
        );

        this.lineProgram.use();
        this.lineProgram.bindUniform('u_color', ...lineColor);

        this.areaProgram.use();
        this.areaProgram.bindUniform('u_max_height', lineMaxHeight);
        this.areaProgram.bindUniform('u_color', ...backgroundColor);

        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.scopeSize = new Vec2(0, 0);
        this.screenSize = new Vec2(0, 0);
        this.resetSize();

        this.render();
    }

    public resetSize = (): void => {
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
        this.lineProgram.bindUniform('u_screen_size', scaledWidth, scaledHeight);
        this.lineProgram.bindUniform('u_max_height', lineMaxHeight * scopeSize.y);
        this.lineProgram.bindUniform('u_x_left', paddingLeftRight);
        this.lineProgram.bindUniform('u_x_right', scaledWidth - paddingLeftRight);
        this.lineProgram.bindUniform('u_width', scopeSize.y * lineWidth);

        this.areaProgram.use();
        this.areaProgram.bindUniform('u_screen_size', scaledWidth, scaledHeight);
        this.areaProgram.bindUniform('u_max_height', lineMaxHeight * scopeSize.y);
        this.areaProgram.bindUniform('u_x_left', paddingLeftRight);
        this.areaProgram.bindUniform('u_x_right', scaledWidth - paddingLeftRight);

        this.scopeSize = scopeSize;
        this.screenSize = new Vec2(scaledWidth, scaledHeight);
    };

    private render = (): void => {
        const { gl, lines } = this;

        requestAnimationFrame(this.render);

        const time = Date.now();
        const lineCreationTime = Math.floor(time / lineDelay) * lineDelay;

        if (lineCreationTime > this.lastLineCreationTime) {
            this.createLine(lineCreationTime);
            this.lastLineCreationTime = lineCreationTime;
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        const paddingTopBottom = (this.screenSize.y - this.scopeSize.y) / 2;
        const lineStep = this.scopeSize.y / lineCount;

        for (let i = 0; i < this.lines.length; i++) {
            const line = lines[i];
            const lineAge = time - line.creationTime;
            const yOffset = paddingTopBottom + (lineAge / lineDelay) * lineStep;

            this.areaProgram.use();
            this.areaProgram.bindAttribute('a_position', line.curtainBuffer);
            this.areaProgram.bindUniform('u_y', yOffset);
            gl.drawArrays(gl.TRIANGLES, 0, line.vertexCount);

            this.lineProgram.use();
            this.lineProgram.bindAttribute('a_position', line.positionBuffer);
            this.lineProgram.bindAttribute('a_normal', line.normalBuffer);
            this.lineProgram.bindUniform('u_y', yOffset);
            gl.drawArrays(gl.TRIANGLES, 0, line.vertexCount);
        }
    };

    private initAudio(): void {
        const audioContext = window.AudioContext || window.webkitAudioContext;

        const ctx = new audioContext();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaElementSource(this.audioElement);

        source.connect(analyser);
        analyser.connect(ctx.destination);

        analyser.fftSize = analyserFftSize;

        this.analyser = analyser;
    }

    private createLine(creationTime: number): void {
        const array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(array);

        this.lines.push(new Line(this.gl, preprocess(array), creationTime));

        while (this.lines.length > lineCount) {
            this.lines[0].dispose();
            this.lines.shift();
        }
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
