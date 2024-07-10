precision lowp float;

varying vec3 vNormal;

void main(void) {
    vec3 color = 0.5 + 0.5 * vNormal;
    gl_FragColor = vec4(color, 1);
}
