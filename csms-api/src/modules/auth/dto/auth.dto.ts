export class SignupDto {
  email!: string;
  password!: string;
  name!: string;
  group!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}
