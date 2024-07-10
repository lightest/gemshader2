precision lowp float;

uniform sampler2D uTexture;

varying vec2 vSamplingPosition; // in [0,1]^2

void main() {
    vec4 sample = texture2D(uTexture, vSamplingPosition);
    vec3 color = sample.rgb * step(0.995, sample.rgb) * step(0.5, sample.a); //extract the bright parts
    gl_FragColor = vec4(color, 1);
}