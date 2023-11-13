struct ray {
    vec3 o;
    vec3 d;
};


vec3[8] verts = vec3[8](     // described as it would be seen looking at the face
    vec3(-0.5, -0.5, -0.5),  // 0 - front bottom left
    vec3(-0.5, 0.5, -0.5),   // 1 - front top left
    vec3(0.5, 0.5, -0.5),    // 2 - front top right
    vec3(0.5, -0.5, -0.5),   // 3 - front bottom right
    vec3(0.5, -0.5, 0.5),    // 4 - back bottom left
    vec3(0.5, 0.5, 0.5),     // 5 - back top left
    vec3(-0.5, 0.5, 0.5),    // 6 - back top right
    vec3(-0.5, -0.5, 0.5)    // 7 - back bottom right
);


int[36] ind = int[36](
    // front face
    0, 1, 2, 2, 3, 0,
    // back face
    4, 5, 6, 6, 7, 4,
    // top face
    1, 6, 5, 5, 2, 1,
    // bottom face
    7, 0, 3, 3, 4, 7,
    // right face
    3, 2, 5, 5, 4, 3,
    // left face
    7, 6, 1, 1, 0, 7
    
);


vec4 noInt = vec4(0.0,0.0,0.0,-1.0);
vec4 checkTriIntersect(vec3 V1, vec3 V2, vec3 V3, ray r)
{
    vec3 e1 = V2 - V1;
    vec3 e2 = V3 - V1;

    vec3 P = cross(e2, r.d);  // Reversed cross product
    float det = dot(e1, P);

    // Ray is parallel to the triangle plane, no intersection
    if (abs(det) < 1e-8) {
        return noInt;
    }

    float invDet = 1.0 / det;
    vec3 T = r.o - V1;
    float u = dot(T, P) * invDet;

    // Check if the intersection lies outside of the triangle
    if (u < 0.0 || u > 1.0) {
        return noInt;
    }

    vec3 Q = cross(e1, T);  // Reversed cross product
    float v = dot(r.d, Q) * invDet;

    // Check if the intersection lies outside of the triangle
    if (v < 0.0 || u + v > 1.0) {
        return noInt;
    }

    float x = dot(e2, Q) * invDet;

    // Intersection is behind the ray's origin
    if (x <= 0.0) {
        return noInt;
    }

    // Intersection point
    // return vec4(r.o + x * r.d, x);
    vec3 n = normalize(cross(e1, e2));
    return vec4(n, x);
}

const vec3 origin = vec3(0.0, 0.0, 0.0);
const float dof = 1.0; // depth of field

ray makeRay(vec2 fragCoord) {
    vec2 halfIRes = iResolution.xy * 0.5;
    vec2 uv = (fragCoord - halfIRes) / halfIRes;
    uv.x *= iResolution.x / iResolution.y;

    vec3 dir = vec3(uv.x, uv.y, dof);
    dir = normalize(dir);

    return ray(origin, dir);
}


void transformCube(mat4 matrix) {
    for (int i=0; i<8; i++) {
        verts[i] = (matrix * vec4(verts[i], 1.0)).xyz;
    }
}

mat4 rotMatY(float y) {
    return mat4(cos(y), 0.0, sin(y), 0.0,
                0.0, 1.0, 0.0, 0.0,
                -sin(y), 0.0, cos(y), 0.0,
                0.0, 0.0, 0.0, 1.0);
}

mat4 rotMatX(float x) {
    return mat4(1.0, 0.0, 0.0, 0.0,
                0.0, cos(x), -sin(x), 0.0,
                0.0, sin(x), cos(x), 0.0,
                0.0, 0.0, 0.0, 1.0);
}

mat4 rotMatZ(float z) {
    return mat4(cos(z), -sin(z), 0.0, 0.0,
                sin(z), cos(z), 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0);
}

mat4 scalarMat(float scalar) {
    return mat4(scalar, 0.0, 0.0, 0.0,
                0.0, scalar, 0.0, 0.0,
                0.0, 0.0, scalar, 0.0,
                0.0, 0.0, 0.0, scalar);
}

mat4 moveByMat(vec3 translation) {
    return mat4(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                translation.x, translation.y, translation.z, 1.0);
}

//https://iquilezles.org/articles/palettes/
vec3 palette( float t ) {
    vec3 a = vec3(0.8, 0.8, 0.8);
    vec3 b = vec3(0.5);
    vec3 c = vec3(.2);
    vec3 d = vec3(0.,0.3,0.5);

    return min(a + b*cos(6.28318*(c*t+d)), 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord)
{
    ray r = makeRay(fragCoord);
    
    mat4 rotx = rotMatX(iTime / 6.0);
    mat4 roty = rotMatY(cos(iTime / 12.0) * 9.0);
    mat4 rotz = rotMatZ(iTime / 18.0);
    mat4 transforms = rotx * roty * rotz;
    
    transformCube(transforms);
    
    mat4 move = moveByMat(vec3(0.0, 0.0, 1.5));
    
    transformCube(move);
    
    float maxDis = 10000.0;
    vec4 closest;
    bool madeHit = false;
    
    for (int i = 0; i <= 36; i+=3) {
        vec3 v1 = verts[ind[i-1]];
        vec3 v2 = verts[ind[i-2]];
        vec3 v3 = verts[ind[i-3]];
        
        vec4 res = checkTriIntersect(v1, v2, v3, r);
        
        if (0.0 < res.w && res.w < maxDis) {
            maxDis = res.w;
            closest = res;
            madeHit = true;
        }
    }
    
    if (madeHit) {
         
        float dotted = dot(r.d, closest.xyz);
        if (0.0 < dot(vec3(0.0, 0.0, 1.0), closest.xyz)) {
            float shadeScalar = min((max(dotted, 0.0)), 1.0);
            fragColor = vec4(
            palette(iTime),
            1.0) * shadeScalar;
        } else {
            fragColor = vec4(1.0, 1.0, 0.0, 1.0);
        }
        return;
    }
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    
}
