import { Scope } from './scope';
import { lyrics } from './lyrics';

if (isSupported()) {
    init();
} else {
    (document.getElementById('no-webgl') as HTMLDivElement).style.display = 'table';
}

function init(): void {
    const scope = new Scope(
        document.querySelector('.display') as HTMLElement,
        document.querySelector('.audio') as HTMLAudioElement,
        document.querySelector('.progress-bar') as HTMLElement,
    );

    const startOverlay = document.querySelector('.start-overlay') as HTMLDivElement;

    startOverlay.style.visibility = 'visible';

    document.body.addEventListener('click', () => {
        startOverlay.style.opacity = '0';
        setTimeout(() => {
            startOverlay.remove();
        }, 500);

        scope.play();
    });

    console.log(lyrics);

    window.scope = scope;
}

function isSupported(): boolean {
    try {
        return (
            'WebGLRenderingContext' in window &&
            !!document.createElement('canvas').getContext('webgl', {
                failIfMajorPerformanceCaveat: true,
            }) &&
            !!(window.AudioContext || window.webkitAudioContext)
        );
    } catch (e) {
        return false;
    }
}
