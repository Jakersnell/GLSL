const vec3 origin = vec3(0.0, 0.0, 0.0);
const float dof = 1.0; // depth of field
const float vw = 2.0; // viewport width
const float vh = 1.0;


struct Sphere {
    vec3 c;
    float r;
};


struct Ray {
    vec3 a;
    vec3 b;
};


float checkIntersect(Ray ray, Sphere sp) {
    // (a + tb - c)^2 = r^2  line intersect in vector form.
    // //(-b±√(b²-4ac))/(2a)  quadratic formula.
    float A = dot(ray.b, ray.b);
    float B = 2.0 * dot(ray.b, (ray.a - sp.c));
    float C = dot(ray.a - sp.c, ray.a - sp.c) - sp.r * sp.r;
    

    float discrim = B * B - 4.0 * A * C;
    
    
    
    if (discrim <= 0.0001) {
        return -1.0;
    }
    
    float sqrtd = sqrt(discrim);

    float neg = (-B - sqrtd) / 2.0 * A;
    float pos = (-B + sqrtd) / 2.0 * A;
    
    return min(neg, pos);
}
  


Ray makeRay(vec2 fragCoord) {
    vec2 halfIRes = iResolution.xy * 0.5;
    vec2 uv = (fragCoord - halfIRes) / halfIRes; 
    uv.x *= iResolution.x / iResolution.y; 

    vec3 dir = vec3(uv.x, uv.y, dof);
    dir = normalize(dir);

    return Ray(origin, dir);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    Sphere sp = Sphere(vec3(0.0,0.0,5.0), 3.0);
    Ray ray = makeRay(fragCoord);
    
    
    float t = checkIntersect(ray, sp);
    
    if (0.0 < t) {
        vec3 n = normalize(ray.a + ray.b * t - sp.c); // outward facing surface normal
        float rgb = 1.0 - ((dot(ray.b, n) + 2.0) / 2.0);
        
        fragColor = vec4(rgb, rgb, rgb, 1.0) * 2.0;
    } else {
        fragColor = vec4(0.0, (sin(iTime) + 2.0) * fragCoord.x / iResolution.x, (cos(iTime) + 2.0) / 2.0, 1.0);
   }
}
