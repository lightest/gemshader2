precision mediump float;

uniform sampler2D uTexture;
uniform vec2 uTexelSize;

varying vec2 vSamplingPosition; // in [0,1]^2

vec4 contribution(vec2 shiftInTexels) {
    return texture2D(uTexture, vSamplingPosition + shiftInTexels * uTexelSize);
}

void main() {
    vec4 blurred = vec4(0);
    #INJECT(BLUR_INSTRUCTIONS)

    gl_FragColor = vec4(blurred.rgb, 1);
}