import * as THREE from "three";

export interface PickResult {
  mesh: THREE.Mesh;
  point: THREE.Vector3;
  meshName: string;
}

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  pickMesh(
    offsetX: number,
    offsetY: number,
    camera: THREE.PerspectiveCamera,
    viewportWidth: number,
    viewportHeight: number,
    vehicleRoot: THREE.Group
  ): PickResult | null {
    if (!vehicleRoot.children.length) return null;

    this.mouse.x = (offsetX / viewportWidth) * 2 - 1;
    this.mouse.y = -(offsetY / viewportHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    // Recursive raycasting through vehicleRoot hierarchy to find actual intersected leaf Mesh
    const intersects = this.raycaster.intersectObjects(vehicleRoot.children, true);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        if (hit.object instanceof THREE.Mesh) {
          // Requirement #7 Debug Output
          console.log({
            hitObject: hit.object.name,
            parent: hit.object.parent?.name,
            type: hit.object.type,
          });

          return {
            mesh: hit.object,
            point: hit.point,
            meshName: hit.object.name,
          };
        }
      }
    }

    return null;
  }

  getScreenPosition(
    object3D: THREE.Object3D,
    camera: THREE.PerspectiveCamera,
    viewportWidth: number,
    viewportHeight: number
  ): { x: number; y: number; visible: boolean } {
    const vector = new THREE.Vector3();
    object3D.getWorldPosition(vector);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * viewportWidth;
    const y = (-(vector.y * 0.5) + 0.5) * viewportHeight;
    const visible = vector.z < 1;

    return { x, y, visible };
  }
}
