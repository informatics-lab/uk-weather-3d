// same name and type as VS
varying vec3 vNormal;
varying vec2 vUv;

void main() {

  // calc the dot product and clamp
  // 0 -> 1 rather than -1 -> 1
  vec3 light = vec3(50.,20.,20.0);

  // ensure it's normalized
  light = normalize(light);

  // calculate the dot product of
  // the light to the vertex normal
  float dProd = max(0.0, dot(vNormal, light));

  // feed into our frag colour
  gl_FragColor = vec4(dProd*0.5, dProd*0.6, dProd*0.4, 1.0);

}
