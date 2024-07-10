attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uMVPMatrix;

varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    vPosition = aPosition;
    vNormal = normalize(aNormal);
}
