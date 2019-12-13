attribute vec2 position;

uniform float xLeft;
uniform float xRight;
uniform float yOffset;

uniform float maxHeight;

uniform vec2 screenSize;

void main() {
    vec2 positionScreen = vec2(
        xLeft + (xRight - xLeft) * position.x,
        yOffset + position.y * maxHeight
    );

    vec2 positionNdc = (positionScreen) / (screenSize / 2.0) - vec2(1.0, 1.0);

    gl_Position = vec4(positionNdc, 0.0, 1.0);
}
