precision lowp float;

uniform vec3 uEyePosition;
uniform float uOrthographic;
uniform float uASETSkybox;
uniform float uLightDirection; // 1 or -1

varying vec3 vPosition;

#include "_skybox.frag"

void main(void) {
    vec3 fromEyeNormalized = normalize(mix(vPosition - uEyePosition, -uEyePosition, uOrthographic));
    vec3 skybox = sampleSkybox(fromEyeNormalized);
    gl_FragColor = vec4(skybox, 0.1) ;
}
