/** Thử tạo ngữ cảnh WebGL để biết máy có vẽ được đảo 3D không. File nhẹ, không kéo theo Three.js. */
export function canWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    // Trả lại ngữ cảnh thử ngay, trình duyệt chỉ cho giữ một số ngữ cảnh WebGL cùng lúc.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
