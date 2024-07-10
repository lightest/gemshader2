#include "_skybox-monochrome.frag"

// uniform float uASETSkybox;

vec3 sampleSkybox(const vec3 direction) {
    vec3 skybox = vec3(sampleSkyboxMonochrome(direction));

    float z = uLightDirection * direction.z;
    vec3 asetSkybox = vec3(
        step(0.70, z) * step(z, 0.98),
        step(0.0, z) * step(z, 0.70),
        step(0.98, z)
    );

    return mix(skybox, asetSkybox, uASETSkybox);
}
