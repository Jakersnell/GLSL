const float numIter = 500.0;
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 c = (2.0 * fragCoord - iResolution.xy) / iResolution.y + vec2(-0.6, 0.0);
    
    vec2 z =  vec2(0.0,0.0);
    
    float j;
    for(j = 0.0; j < numIter; j++) {
        float x = (z.x * z.x - z.y * z.y) + c.x;
        float y = (2.0 * z.x * z.y) + c.y;

        if ((x * x + y * y) > 10.0) break;
        z.x = x;
        z.y = y;
    }
    
    float blue = 0.0;
    float green = 0.0;
    
    if (20.0 < j && j < numIter - (numIter / 10.0)) {
        green = pow(j / numIter * 10.0, 2.0);
        blue = pow(j / numIter * 10.0, 2.0);
    } 
    
    fragColor = vec4(0.0, green, blue, 1.0);
}
