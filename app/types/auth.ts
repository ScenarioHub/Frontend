export interface MyProfile extends User { // 내 아이디 정보
  postCount: number; // 내가 올린 게시물 수
  joinedAt: string; // 가입일 (ISO String)
};

export interface User {
  email: string;
  name: string;
};

export interface LoginResponseData {
  access: string;
  lastLogin: string;
  refresh: string;
  user: User;
};

export interface RefreshData {
  access: string;
}
