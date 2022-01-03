

export const VertexSource = {

Textured : 
    
`
attribute vec2 vertexPos;
attribute vec2 vertexUV;

uniform mat3 transform;

uniform vec2 pos;
uniform vec2 size;

varying vec2 uv;


void main() {

    gl_Position = vec4(transform * vec3(vertexPos * size + pos, 1), 1);
    uv = vertexUV;
}`,

NoTexture : 
    
`
attribute vec2 vertexPos;
attribute vec2 vertexUV;

uniform mat3 transform;

uniform vec2 pos;
uniform vec2 size;


void main() {

    gl_Position = vec4(transform * vec3(vertexPos * size + pos, 1), 1);
}`
}


export const FragmentSource = {

Textured : 

`
precision mediump float;
     
uniform sampler2D texSampler;

uniform vec4 color;

uniform vec2 texPos;
uniform vec2 texSize;

varying vec2 uv;


void main() {

    vec2 tex = uv * texSize + texPos;    
    vec4 res = texture2D(texSampler, tex) * color;

    if(res.a <= 0.01) {
         discard;
    }
    gl_FragColor = res;
}`,


TexturedAlphaMask : 

`
precision mediump float;
     
uniform sampler2D texSampler;

uniform vec4 color;

uniform vec2 texPos;
uniform vec2 texSize;

varying vec2 uv;


void main() {

    vec2 tex = uv * texSize + texPos;    
    vec4 res = vec4(color.rgb, color.a * texture2D(texSampler, tex).a);

    if(res.a <= 0.01) {
         discard;
    }
    gl_FragColor = res;
}`,



NoTexture : 

`
precision mediump float;

uniform vec4 color;


void main() {

    gl_FragColor = color;
}`,


TexturedFilter : 

`
precision mediump float;
     
uniform sampler2D texSampler;
uniform sampler2D filterSampler;

uniform vec4 color;

uniform vec2 texPos;
uniform vec2 texSize;

uniform vec2 framePos;
uniform vec2 frameSize;
uniform float contrast;

varying vec2 uv;


vec4 apply_filter(vec4 baseColor) {
    
    float factor = (1.015686275 * (contrast + 1.0)) / (1.0 * (1.015686275 - contrast));
	vec3 filter = texture2D(filterSampler, 
        vec2((gl_FragCoord.x-framePos.x) / frameSize.x,
            1.0 - (gl_FragCoord.y-framePos.y) / frameSize.y)).xyz;
    return vec4(clamp(factor * (baseColor.xyz * filter - 0.5) + 0.5, 0.0, 1.0), baseColor.a);
}


void main() {

    vec2 tex = uv * texSize + texPos;    
    vec4 res = texture2D(texSampler, tex) * color;

    if(res.a <= 0.01) {
         discard;
    }
    gl_FragColor = apply_filter(res);
}`


}
