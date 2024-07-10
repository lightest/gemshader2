precision lowp float;

uniform sampler2D uFullsizeTexture;
uniform vec2 uFullsizeTextureTexelSize;

uniform sampler2D uBlurredTexture;

varying vec2 vSamplingPosition; // in [0,1]^2

float luminance(const vec3 rgb){
    return dot(rgb, vec3(0.299, 0.587, 0.114));
}

vec3 fxaa(vec2 coords) {
    const float THRESHOLD = 0.05;

    vec3 topLeft =     texture2D(uFullsizeTexture, coords + vec2(-1,-1) * uFullsizeTextureTexelSize).rgb;
    vec3 top =         texture2D(uFullsizeTexture, coords + vec2(+0,-1) * uFullsizeTextureTexelSize).rgb;
    vec3 topRight =    texture2D(uFullsizeTexture, coords + vec2(+1,-1) * uFullsizeTextureTexelSize).rgb;
    vec3 left =        texture2D(uFullsizeTexture, coords + vec2(-1,+0) * uFullsizeTextureTexelSize).rgb;
    vec3 middle =      texture2D(uFullsizeTexture, coords).rgb;
    vec3 right =       texture2D(uFullsizeTexture, coords + vec2(+1,+0) * uFullsizeTextureTexelSize).rgb;
    vec3 bottomLeft =  texture2D(uFullsizeTexture, coords + vec2(-1,+1) * uFullsizeTextureTexelSize).rgb;
    vec3 bottom =      texture2D(uFullsizeTexture, coords + vec2(+0,+1) * uFullsizeTextureTexelSize).rgb;
    vec3 bottomRight = texture2D(uFullsizeTexture, coords + vec2(+1,+1) * uFullsizeTextureTexelSize).rgb;

    float lumninance_middle = luminance(middle);           

    float topLeftIsSame =     step(abs(luminance(topLeft)     - lumninance_middle), THRESHOLD);
    float topIsSame =         step(abs(luminance(top)         - lumninance_middle), THRESHOLD);
    float topRightIsSame =    step(abs(luminance(topRight)    - lumninance_middle), THRESHOLD);
    float leftIsSame =        step(abs(luminance(left)        - lumninance_middle), THRESHOLD);
    float rightIsSame =       step(abs(luminance(right)       - lumninance_middle), THRESHOLD);
    float bottomLeftIsSame =  step(abs(luminance(bottomLeft)  - lumninance_middle), THRESHOLD);
    float bottomIsSame =      step(abs(luminance(bottom)      - lumninance_middle), THRESHOLD);
    float bottomRightIsSame = step(abs(luminance(bottomRight) - lumninance_middle), THRESHOLD);

    vec2 gradient = abs(vec2(
        (topLeftIsSame + leftIsSame + bottomLeftIsSame) - (topRightIsSame + rightIsSame + bottomRightIsSame),
        (topLeftIsSame + topIsSame + topRightIsSame) - (bottomLeftIsSame + bottomIsSame + bottomRightIsSame)
    ));

    if (gradient.y > gradient.x) { // mostly horizontal edge
        return 0.5 * middle + 0.25 * (left + right);
    } else if (gradient.y < gradient.x) { // mostly vertical edge
        return 0.5 * middle + 0.25 * (top + bottom);
    }
    return middle; // either no edge or perfect diagonal
}

void main() {
    vec3 color = fxaa(vSamplingPosition);
    vec3 glow = texture2D(uBlurredTexture, vSamplingPosition).rgb;
    gl_FragColor = vec4(color + glow, 1);
}