#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 uEyePosition;
uniform float uOrthographic;
uniform vec3 uAbsorption;
uniform float uDisplayReflection;
uniform float uLightDirection; // 1 or -1
uniform vec3 uRefractionIndices;

varying vec3 vPosition;
varying vec3 vNormal;

const int rayDepth = #INJECT(RAY_DEPTH);

#INJECT(FACETS_DEFINITION)

#include "_skybox-monochrome.frag"

float checkNextInternalIntersection(const vec3 planePoint, const vec3 planeNormal, const vec3 position, const vec3 direction, inout float theta, inout vec3 facetNormal) {
    float b = dot(direction, planeNormal);
    if (b > 0.0) {
        float localTheta = dot(planePoint - position, planeNormal) / b;

        if (localTheta < theta) {
            facetNormal = planeNormal;
            theta = localTheta;
        }
    }
    return theta;
}

float computeInternalIntersection(const vec3 position, const vec3 direction, inout vec3 facetNormal) {
    float theta = 100000.0;
    #INJECT(COMPUTE_INTERNAL_INTERSECTION)
    return theta;
}

/** @param eta              refraction_index_current / refraction_index_other
 *  @param surfaceNormal    facing the incidentRay
 */
float computeFresnelReflection(const vec3 incidentRay, const vec3 surfaceNormal, const vec3 refractedRay, const float eta, const float cosCriticalAngle) {
    float cosIncident = abs(dot(surfaceNormal, incidentRay));

    if (cosIncident < cosCriticalAngle) {
        return 1.0;
    }

    float cosRefracted = abs(dot(surfaceNormal, refractedRay));
    float etaCosRefracted = eta * cosRefracted;
    float etaCosIncident = eta * cosIncident;

    float a = (cosIncident - etaCosRefracted) / (cosIncident + etaCosRefracted);
    float b = (etaCosIncident - cosRefracted) / (etaCosIncident + cosRefracted);
    return 0.5 * (a * a + b * b);
}

float computeDiamondColor(vec3 currentPoint, vec3 currentDirection, vec3 currentFacetNormal, const float refractionIndex, const float absorption) {
    float etaExitingGem = refractionIndex;
    float cosCriticalAngleExitingGem = sqrt(max(0.0, 1.0 - 1.0 / (refractionIndex * refractionIndex)));

    float cumulatedColor = 0.0;
    float rayStrength = 1.0;
    float totalDepthInside = 0.0;

    for (int i = 0; i < rayDepth; i++) {
        float theta = computeInternalIntersection(currentPoint, currentDirection, currentFacetNormal);
        vec3 refractedRay = refract(currentDirection, -currentFacetNormal, etaExitingGem);
        float fresnelReflection = computeFresnelReflection(currentDirection, -currentFacetNormal, refractedRay, etaExitingGem, cosCriticalAngleExitingGem);
    
        totalDepthInside += theta;
        cumulatedColor += rayStrength * (1.0 - fresnelReflection) * sampleSkyboxMonochrome(refractedRay) * exp(-absorption * totalDepthInside);
        rayStrength *= fresnelReflection;

        if (rayStrength < 0.001) {
            return cumulatedColor;
        }
        currentPoint += theta * currentDirection;
        currentDirection = reflect(currentDirection, -currentFacetNormal);
    }

    return cumulatedColor;
}

void main(void) {
    vec3 fromEyeNormalized = normalize(mix(vPosition - uEyePosition, -uEyePosition, uOrthographic));

    vec3 etaEnteringGem = 1.0 / uRefractionIndices;
    vec3 cosCriticalAngleEnteringGem = sqrt(max(vec3(0), vec3(1) - uRefractionIndices * uRefractionIndices));

    vec3 entryPoint = vPosition;
    vec3 entryFacetNormal = vNormal;

    vec3 entryDirectionRed = refract(fromEyeNormalized, entryFacetNormal, etaEnteringGem.r);
    vec3 entryDirectionGreen = refract(fromEyeNormalized, entryFacetNormal, etaEnteringGem.g);
    vec3 entryDirectionBlue = refract(fromEyeNormalized, entryFacetNormal, etaEnteringGem.b);

    vec3 diamondColor = vec3(
        computeDiamondColor(entryPoint, entryDirectionRed, entryFacetNormal, uRefractionIndices.r, uAbsorption.r),
        computeDiamondColor(entryPoint, entryDirectionGreen, entryFacetNormal, uRefractionIndices.g, uAbsorption.g),
        computeDiamondColor(entryPoint, entryDirectionBlue, entryFacetNormal, uRefractionIndices.b, uAbsorption.b)
    );

    vec3 reflectedRay = reflect(fromEyeNormalized, entryFacetNormal);
    vec3 reflectedColor = vec3(sampleSkyboxMonochrome(reflectedRay));

    vec3 fresnelReflection = uDisplayReflection * vec3(
        computeFresnelReflection(fromEyeNormalized, entryFacetNormal, entryDirectionRed, etaEnteringGem.r, cosCriticalAngleEnteringGem.r),
        computeFresnelReflection(fromEyeNormalized, entryFacetNormal, entryDirectionGreen, etaEnteringGem.g, cosCriticalAngleEnteringGem.g),
        computeFresnelReflection(fromEyeNormalized, entryFacetNormal, entryDirectionBlue, etaEnteringGem.b, cosCriticalAngleEnteringGem.b)
    );

    vec3 finalColor = mix(diamondColor, reflectedColor, fresnelReflection);
    gl_FragColor = vec4(finalColor, 1);
}
