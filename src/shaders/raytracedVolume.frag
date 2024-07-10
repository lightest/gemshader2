#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 uEyePosition;
uniform float uOrthographic;

varying vec3 vPosition;

#INJECT(FACETS_DEFINITION)

void computeIntersectionWithPlane(const vec3 planePoint, const vec3 planeNormal, const vec3 startingPoint, const vec3 startingDirection, inout float currentTheta, inout vec3 currentNormal) {
    float b = dot(startingDirection, planeNormal);
    if (b < 0.0) { // pseudo face culling
        float theta = dot(planePoint - startingPoint, planeNormal) / b;

        if (theta > 0.0 && currentTheta < theta) {
            currentTheta = theta;
            currentNormal = planeNormal;
        }
    }
}

bool isInside(const vec3 planePoint, const vec3 planeNormal, const vec3 position) {
    return dot(planePoint - position, planeNormal) >= -0.00001;
}

bool computeEntryPoint(const vec3 eyePosition, const vec3 fromEyeNormalized, out vec3 entryPoint, out vec3 facetNormal) {
    float theta = -1.0;

    #INJECT(COMPUTE_ENTRY_POINT)

    entryPoint = uEyePosition + theta * fromEyeNormalized;
    bool onGem = #INJECT(CHECK_IF_INSIDE);
    return onGem;
}

void main(void) {
    vec3 fromEyeNormalized = normalize(mix(vPosition - uEyePosition, -uEyePosition, uOrthographic));

    vec3 entryPoint;
    vec3 entryFacetNormal;
    bool intersectionWithGem = computeEntryPoint(uEyePosition, fromEyeNormalized, entryPoint, entryFacetNormal);
    vec3 normalAsColor = vec3(0.5 + 0.5 * entryFacetNormal);
    
    // no intersection with the gem, draw the cube edges
    vec3 edge = step(0.9, abs(vPosition));
    bool isOnEdge = (edge.x + edge.y + edge.z) > 1.5;
    if (!isOnEdge && !intersectionWithGem) {
        discard;
    }
    const vec3 cubeEdgeColor = vec3(1, 0, 0);

    vec3 color = intersectionWithGem ? normalAsColor: cubeEdgeColor;
    gl_FragColor = vec4(color, 1);
}
