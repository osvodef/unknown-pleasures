attribute vec2 position;
attribute vec2 normal;

uniform float xLeft;
uniform float xRight;
uniform float yOffset;

uniform float width;
uniform float maxHeight;

uniform vec2 screenSize;

void main() {
    vec2 position_screen = vec2(
        xLeft + (xRight - xLeft) * position.x,
        yOffset + position.y * maxHeight
    );

    vec2 aspect_ratio = vec2(maxHeight / (xRight - xLeft), 1.0);
    vec2 normal_screen = normalize(normal * aspect_ratio) * (width / 2.0);
    vec2 position_ndc = (position_screen + normal_screen) / (screenSize / 2.0) - vec2(1.0, 1.0);

    gl_Position = vec4(position_ndc, 0.0, 1.0);
}
