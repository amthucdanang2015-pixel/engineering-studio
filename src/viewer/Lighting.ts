import * as THREE from "three";
import { VIEWER_CONFIG } from "./ViewerConfig";

export class LightingManager {
  private environmentRoot = new THREE.Group();
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private accentGlow!: THREE.PointLight;
  private plinth!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private environmentTexture: THREE.Texture | null = null;

  setupEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.environmentRoot.name = "EnvironmentRoot";
    scene.add(this.environmentRoot);

    // 1. Ambient & Hemisphere Lights
    this.environmentRoot.add(new THREE.AmbientLight(0xffffff, 0.65));
    this.environmentRoot.add(new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.85));

    // 2. Studio Directional Lights
    this.keyLight = new THREE.DirectionalLight(
      VIEWER_CONFIG.KEY_LIGHT_COLOR,
      VIEWER_CONFIG.KEY_LIGHT_INTENSITY
    );
    this.keyLight.position.set(6.0, 8.5, 7.0);
    this.environmentRoot.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(
      VIEWER_CONFIG.FILL_LIGHT_COLOR,
      VIEWER_CONFIG.FILL_LIGHT_INTENSITY
    );
    this.fillLight.position.set(-6.0, 3.0, 6.0);
    this.environmentRoot.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(
      VIEWER_CONFIG.RIM_LIGHT_COLOR,
      VIEWER_CONFIG.RIM_LIGHT_INTENSITY
    );
    this.rimLight.position.set(-5.0, 5.0, -7.0);
    this.environmentRoot.add(this.rimLight);

    this.accentGlow = new THREE.PointLight(0xf95738, 0.6, 12, 2);
    this.accentGlow.name = "vehicle-accent-glow";
    this.accentGlow.position.set(2.5, 0.6, 2.5);
    this.environmentRoot.add(this.accentGlow);

    // 3. Environment Map
    this.environmentTexture = this.buildEnvironmentMap(renderer);
    scene.environment = this.environmentTexture;

    // 4. Ground Plinth & Contact Shadow (Fixed on EnvironmentRoot)
    const plinthGeo = new THREE.CylinderGeometry(
      VIEWER_CONFIG.PLINTH_RADIUS,
      VIEWER_CONFIG.PLINTH_RADIUS + 0.3,
      0.25,
      64
    );
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xebf0f5,
      roughness: 0.55,
      metalness: 0.1,
    });
    this.plinth = new THREE.Mesh(plinthGeo, plinthMat);
    this.plinth.name = "Platform";
    this.plinth.position.y = VIEWER_CONFIG.PLINTH_Y;
    this.environmentRoot.add(this.plinth);

    const shadowTex = this.createContactShadowTexture();
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 6.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: VIEWER_CONFIG.CONTACT_SHADOW_OPACITY,
        toneMapped: false,
      })
    );
    this.contactShadow.name = "Ground";
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = VIEWER_CONFIG.PLINTH_Y + 0.13;
    this.contactShadow.renderOrder = 1;
    this.environmentRoot.add(this.contactShadow);
  }

  /**
   * Hide platform and contact shadow when camera orbits below platform level
   * to ensure crystal-clear, unobstructed view of vehicle undercarriage and chassis.
   */
  updateCameraVisibility(cameraY: number, targetY: number) {
    const isBelowPlatform = cameraY < (targetY - 0.05);
    if (this.plinth) {
      this.plinth.visible = !isBelowPlatform;
    }
    if (this.contactShadow) {
      this.contactShadow.visible = !isBelowPlatform;
    }
  }

  setAccentColor(color: string) {
    this.accentGlow.color.set(color);
  }

  get rootGroup() {
    return this.environmentRoot;
  }

  private buildEnvironmentMap(renderer: THREE.WebGLRenderer) {
    const width = 32;
    const height = 64;
    const data = new Uint8Array(width * height * 4);

    const topColor = new THREE.Color(0xffffff);
    const bottomColor = new THREE.Color(0xdbeceb);
    const mixed = new THREE.Color();

    for (let y = 0; y < height; y++) {
      mixed.copy(bottomColor).lerp(topColor, Math.pow(1 - y / (height - 1), 0.6));
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        data[i] = mixed.r * 255;
        data[i + 1] = mixed.g * 255;
        data[i + 2] = mixed.b * 255;
        data[i + 3] = 255;
      }
    }

    const source = new THREE.DataTexture(data, width, height);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.colorSpace = THREE.SRGBColorSpace;
    source.needsUpdate = true;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(source).texture;
    pmrem.dispose();
    source.dispose();

    return environment;
  }

  private createContactShadowTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.48);
    gradient.addColorStop(0, "rgba(30, 41, 59, 0.45)");
    gradient.addColorStop(0.5, "rgba(30, 41, 59, 0.15)");
    gradient.addColorStop(1, "rgba(30, 41, 59, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  dispose() {
    this.environmentTexture?.dispose();
    (this.contactShadow.material as THREE.MeshBasicMaterial).map?.dispose();
    this.plinth.geometry.dispose();
    (this.plinth.material as THREE.Material).dispose();
    this.environmentRoot.removeFromParent();
  }
}
