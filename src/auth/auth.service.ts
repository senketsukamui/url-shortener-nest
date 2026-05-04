import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInUserDTO: SignInDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findOneByEmail(signInUserDTO.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(
      signInUserDTO.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(signUpDTO: SignUpDto) {
    return this.usersService.createUser(signUpDTO.email, signUpDTO.password);
  }
}
