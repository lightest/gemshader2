attribute vec3 aPosition;

uniform mat4 uMVPMatrix;

varying vec3 vPosition;

void main(void) {
    vec3 scaledPosition = 20.0 * aPosition;
    gl_Position = uMVPMatrix * vec4(scaledPosition, 1.0);
    vPosition = scaledPosition;
}
