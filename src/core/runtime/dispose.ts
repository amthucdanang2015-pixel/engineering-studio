import * as THREE from "three";

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          Object.keys(mat).forEach((key) => {
            const val = mat[key as keyof typeof mat];
            if (val && typeof val === "object" && "dispose" in val && typeof val.dispose === "function") {
              val.dispose();
            }
          });
          mat.dispose();
        });
      }
    }
  });
}
