attribute vec3 aPosition; // in [-0.5,+0.5]^3

uniform mat4 uMVPMatrix;

varying vec3 vPosition; // in [-0.5,+0.5]^3

void main(void) {
    vec3 scaledPosition = 2.0 * aPosition;

    gl_Position = uMVPMatrix * vec4(scaledPosition, 1.0);
    vPosition = scaledPosition;
}
