export const VIEWER_CONFIG = {
  FIT_SIZE: 4.2, // Edge length for model bounds normalization
  CAMERA_FOV: 32,
  // 70% Viewport Height Framing: Camera z = 4.45m, Target y = 0.213m
  // Centers vehicle vertically in 3D viewport (50% height), filling ~70% of 3D viewport height
  HOME_CAMERA: { x: 0, y: 0.213, z: 4.45 },
  HOME_TARGET: { x: 0, y: 0.213, z: 0 },
  MIN_ZOOM_DISTANCE: 2.5,
  MAX_ZOOM_DISTANCE: 12,
  AUTO_ROTATE_SPEED: 0.65,
  PLINTH_Y: -0.85,
  PLINTH_RADIUS: 3.4,
  CONTACT_SHADOW_OPACITY: 0.45,
  KEY_LIGHT_COLOR: 0xffffff,
  KEY_LIGHT_INTENSITY: 3.5,
  FILL_LIGHT_COLOR: 0xf0f4f8,
  FILL_LIGHT_INTENSITY: 1.5,
  RIM_LIGHT_COLOR: 0xffedd5,
  RIM_LIGHT_INTENSITY: 1.2,
} as const;

export interface ViewerCallbacks {
  onLoading?: (loading: boolean, progress: number) => void;
  onSelect?: (partId: string | null, meshName: string | null) => void;
  onHover?: (partId: string | null, meshName: string | null) => void;
}

export interface ViewerOptions extends ViewerCallbacks {
  mode?: "preview" | "build";
}

