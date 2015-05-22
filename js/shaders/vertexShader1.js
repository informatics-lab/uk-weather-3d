attribute float displacement;
varying vec3 vNormal;
varying vec2 vUv;

void main() {

  vNormal = normal;
  vUv = uv;
  // push the displacement into the three
  // slots of a 3D vector so it can be
  // used in operations with other 3D
  // vectors like positions and normals
  vec3 newPosition = position +
                     normal * vec3(displacement) * vec3(0.2,0.2,0.2);

  gl_Position = projectionMatrix *
                modelViewMatrix *
                vec4(newPosition,1.0);

}
