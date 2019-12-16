attribute vec2 position;
attribute vec2 normal;

uniform float xLeft;
uniform float xRight;
uniform float yOffset;

uniform float width;
uniform float maxHeight;

uniform vec2 screenSize;

void main() {
    float widthScreen = xRight - xLeft;
    float heightScreen = maxHeight;

    vec2 positionScreen = vec2(
        xLeft + widthScreen * position.x,
        yOffset + heightScreen * position.y
    );

    vec2 aspectRatioCorrection = vec2(heightScreen, widthScreen);
    vec2 normalScreen = normalize(normal * aspectRatioCorrection) * (width / 2.0);
    vec2 positionNdc = (positionScreen + normalScreen) / (screenSize / 2.0) - vec2(1.0, 1.0);

    gl_Position = vec4(positionNdc, 0.0, 1.0);
}
