attribute vec2 a_position;

uniform float u_x_left;
uniform float u_x_right;
uniform float u_y;

uniform float u_max_height;

uniform vec2 u_screen_size;

void main() {
    vec2 position_screen = vec2(
        u_x_left + (u_x_right - u_x_left) * a_position.x,
        u_y + a_position.y * u_max_height
    );

    vec2 position_ndc = (position_screen) / (u_screen_size / 2.0) - vec2(1.0, 1.0);

    gl_Position = vec4(position_ndc, 0.0, 1.0);
}
