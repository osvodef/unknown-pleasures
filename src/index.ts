import { Scope } from './scope';
import { lyrics } from './lyrics';

if (isSupported()) {
    init();
} else {
    (document.getElementById('no-webgl') as HTMLDivElement).style.display = 'table';
}

function init(): void {
    let isPlaying = false;
    let isFirstStart = true;

    const scope = new Scope({
        container: document.querySelector('.display') as HTMLElement,
        audio: document.querySelector('.audio') as HTMLAudioElement,
        progressBar: document.querySelector('.progress-bar') as HTMLElement,
        useAudioApiFallback: shouldUseAudioApiFallback(),
    });

    window.scope = scope;

    const startOverlay = document.querySelector('.start-overlay') as HTMLDivElement;
    const playOverlay = document.querySelector('.play-overlay') as HTMLDivElement;
    const pauseOverlay = document.querySelector('.pause-overlay') as HTMLDivElement;

    startOverlay.style.visibility = 'visible';

    document.body.addEventListener('click', () => {
        if (!isPlaying) {
            scope.play();

            if (isFirstStart) {
                startOverlay.style.opacity = '0';
                isFirstStart = false;
            } else {
                blink(playOverlay);
            }

            isPlaying = true;
        } else {
            scope.pause();
            blink(pauseOverlay);

            isPlaying = false;
        }
    });

    function blink(overlay: HTMLDivElement): void {
        overlay.style.transition = 'none';
        overlay.style.opacity = '0.9';
        overlay.style.transform = 'scale(1)';
        setTimeout(() => {
            overlay.style.transition = 'opacity 750ms, transform 750ms';
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(1.5)';
        }, 0);
    }

    console.log(lyrics);
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

function getIosVersion(): number[] | undefined {
    if (!/iP(hone|od|ad)/.test(navigator.platform)) {
        return undefined;
    }

    const version = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);

    if (version === null) {
        return undefined;
    }

    return [parseInt(version[1], 10), parseInt(version[2], 10), parseInt(version[3] || '0', 10)];
}

function shouldUseAudioApiFallback(): boolean {
    const iosVersion = getIosVersion();

    if (iosVersion === undefined) {
        return false;
    }

    return iosVersion[0] === 13 && iosVersion[1] >= 2;
}
