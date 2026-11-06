// Shared input state between the DOM joystick/HUD and the Phaser scene.
export const input = {
  joyX: 0,
  joyY: 0,
  /** True while any modal, panel or screen is covering the world. */
  locked: false,
};
