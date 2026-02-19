import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(account: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { account },
      include: {
        students: {
          include: {
            grades: true,
            classes: true,
          },
        },
        teachers: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账号已被停用或未激活');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      account: user.account,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        account: user.account,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        students: {
          include: {
            grades: true,
            classes: true,
          },
        },
        teachers: {
          include: {
            teacher_classes: {
              include: {
                classes: true,
                subjects: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password, ...result } = user;
    return {
      ...result,
      roleName: user.roles?.name || user.role,
      roleCode: user.roles?.code || user.role,
    };
  }
}
