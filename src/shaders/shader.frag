#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 uEyePosition;
uniform float uOrthographic;
uniform vec3 uAbsorption;
uniform float uDisplayNormals;
uniform float uDisplayReflection;
uniform float uASETSkybox;
uniform float uLightDirection; // 1 or -1
uniform float uRefractionIndex;

varying vec3 vPosition;
varying vec3 vNormal;

const int rayDepth = #INJECT(RAY_DEPTH);

#INJECT(FACETS_DEFINITION)

#include "_skybox.frag"

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

vec3 computeDiamondColor(vec3 currentPoint, vec3 currentDirection, vec3 currentFacetNormal, const float refractionIndex) {
    float etaExitingGem = refractionIndex;
    float cosCriticalAngleExitingGem = sqrt(max(0.0, 1.0 - 1.0 / (refractionIndex * refractionIndex)));

    vec3 cumulatedColor = vec3(0);
    float rayStrength = 1.0;
    float totalDepthInside = 0.0;

    for (int i = 0; i < rayDepth; i++) {
        float theta = computeInternalIntersection(currentPoint, currentDirection, currentFacetNormal);
        vec3 refractedRay = refract(currentDirection, -currentFacetNormal, etaExitingGem);
        float fresnelReflection = computeFresnelReflection(currentDirection, -currentFacetNormal, refractedRay, etaExitingGem, cosCriticalAngleExitingGem);
    
        totalDepthInside += theta;
        cumulatedColor += rayStrength * (1.0 - fresnelReflection) * sampleSkybox(refractedRay) * exp(-uAbsorption * totalDepthInside);
        rayStrength *= fresnelReflection;

        currentPoint += theta * currentDirection;
        currentDirection = reflect(currentDirection, -currentFacetNormal);
    }

    vec3 lastNormalAsColor = vec3(0.5 + 0.5 * currentFacetNormal);
    return mix(cumulatedColor, lastNormalAsColor, uDisplayNormals);
}

void main(void) {
    vec3 fromEyeNormalized = normalize(mix(vPosition - uEyePosition, -uEyePosition, uOrthographic));

    float etaEnteringGem = 1.0 / uRefractionIndex;
    float cosCriticalAngleEnteringGem = sqrt(max(0.0, 1.0 - uRefractionIndex * uRefractionIndex));

    vec3 entryPoint = vPosition;
    vec3 entryFacetNormal = vNormal;
    vec3 entryDirection = refract(fromEyeNormalized, entryFacetNormal, etaEnteringGem);

    vec3 diamondColor = computeDiamondColor(entryPoint, entryDirection, entryFacetNormal, uRefractionIndex);

    vec3 reflectedRay = reflect(fromEyeNormalized, entryFacetNormal);
    vec3 reflectedColor = sampleSkybox(reflectedRay);

    float fresnelReflection = uDisplayReflection * computeFresnelReflection(fromEyeNormalized, entryFacetNormal, entryDirection, etaEnteringGem, cosCriticalAngleEnteringGem);
    vec3 finalColor = mix(diamondColor, reflectedColor, fresnelReflection);
    gl_FragColor = vec4(finalColor, 1);
}
