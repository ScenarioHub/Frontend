export function formatBytesToKB(bytes?: number): string {
  if (!bytes) return "0";
  const kb = bytes / 1024;

  // 1024로 나눈거라서 B랑 KB랑 조금 다를 수 있음
  // 소숫점 아래 {2} 자리까지 표현
  return `${kb.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
}
