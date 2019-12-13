import { Vec2 } from './vec2';

export class Line {
    public positionBuffer: WebGLBuffer;
    public normalBuffer: WebGLBuffer;
    public areaBuffer: WebGLBuffer;

    public creationTime: number;
    public vertexCount: number;

    private gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext, volumes: number[], creationTime: number) {
        const positionBuffer = gl.createBuffer() as WebGLBuffer;
        const normalBuffer = gl.createBuffer() as WebGLBuffer;
        const areaBuffer = gl.createBuffer() as WebGLBuffer;

        const bufferSize = (volumes.length - 1) * 6 * 2;

        const positions = new Float32Array(bufferSize);
        const normals = new Float32Array(bufferSize);
        const areaPositions = new Float32Array(bufferSize);

        let positionIndex = 0;
        let normalIndex = 0;
        let areaIndex = 0;
        for (let i = 1; i < volumes.length; i++) {
            const prevX = (i - 1) / (volumes.length - 1);
            const currX = i / (volumes.length - 1);

            const prevY = volumes[i - 1];
            const currY = volumes[i];

            const normal = new Vec2(currX - prevX, currY - prevY).normalize().perp();

            positions[positionIndex++] = prevX;
            positions[positionIndex++] = prevY;
            normals[normalIndex++] = -normal.x;
            normals[normalIndex++] = -normal.y;

            positions[positionIndex++] = currX;
            positions[positionIndex++] = currY;
            normals[normalIndex++] = -normal.x;
            normals[normalIndex++] = -normal.y;

            positions[positionIndex++] = prevX;
            positions[positionIndex++] = prevY;
            normals[normalIndex++] = normal.x;
            normals[normalIndex++] = normal.y;

            positions[positionIndex++] = prevX;
            positions[positionIndex++] = prevY;
            normals[normalIndex++] = normal.x;
            normals[normalIndex++] = normal.y;

            positions[positionIndex++] = currX;
            positions[positionIndex++] = currY;
            normals[normalIndex++] = -normal.x;
            normals[normalIndex++] = -normal.y;

            positions[positionIndex++] = currX;
            positions[positionIndex++] = currY;
            normals[normalIndex++] = normal.x;
            normals[normalIndex++] = normal.y;

            areaPositions[areaIndex++] = prevX;
            areaPositions[areaIndex++] = 0;

            areaPositions[areaIndex++] = prevX;
            areaPositions[areaIndex++] = prevY;

            areaPositions[areaIndex++] = currX;
            areaPositions[areaIndex++] = currY;

            areaPositions[areaIndex++] = prevX;
            areaPositions[areaIndex++] = 0;

            areaPositions[areaIndex++] = currX;
            areaPositions[areaIndex++] = currY;

            areaPositions[areaIndex++] = currX;
            areaPositions[areaIndex++] = 0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, areaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, areaPositions, gl.STATIC_DRAW);

        this.positionBuffer = positionBuffer;
        this.normalBuffer = normalBuffer;
        this.areaBuffer = areaBuffer;

        this.vertexCount = bufferSize / 2;
        this.creationTime = creationTime;

        this.gl = gl;
    }

    public dispose(): void {
        this.gl.deleteBuffer(this.positionBuffer);
        this.gl.deleteBuffer(this.normalBuffer);
        this.gl.deleteBuffer(this.areaBuffer);
    }
}
