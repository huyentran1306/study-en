// Mở hộp đăng nhập từ bất kỳ đâu (navbar, đảo...) mà không cần truyền state qua nhiều tầng.
export const OPEN_LOGIN_EVENT = "studyen:open-login";

export function openLogin() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_LOGIN_EVENT));
}
