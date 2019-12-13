interface Window {
    scope: any;
    webkitAudioContext?: AudioContextConstructor;
    WebGLRenderingContext: WebGLRenderingContext;
}

declare module '*.glsl' {
    const source: string;
    export default source;
}
