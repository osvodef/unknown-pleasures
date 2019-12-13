import { Scope } from './scope';

if (isWebGlSupported()) {
    init();
} else {
    (document.getElementById('no-webgl') as HTMLDivElement).style.display = 'table';
}

function init(): void {
    window.scope = new Scope(
        document.querySelector('.display') as HTMLElement,
        document.querySelector('.audio') as HTMLAudioElement,
    );
}

function isWebGlSupported(): boolean {
    try {
        return (
            'WebGLRenderingContext' in window &&
            !!document.createElement('canvas').getContext('webgl', {
                failIfMajorPerformanceCaveat: true,
            })
        );
    } catch (e) {
        return false;
    }
}
