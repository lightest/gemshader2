// uniform float uLightDirection; // 1 or -1

float sampleSkyboxMonochrome(const vec3 direction) {
    float z = uLightDirection * direction.z;
    return 0.8 * step(z, 0.975) * (1.0 + step(0.6, z));
}
