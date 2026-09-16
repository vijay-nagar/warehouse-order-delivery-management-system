import { comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/jwt.js";
import { UserRepository } from "../repositories/user.repository.js";
import type {
  LoginRequest,
  LoginResponse,
} from "../domain/auth/auth.types.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByUsername(
      request.username,
    );

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const passwordValid = await comparePassword(
      request.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new Error("Invalid username or password");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roles: user.roles,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}