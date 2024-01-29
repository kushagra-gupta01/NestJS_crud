import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  // Inject the repository
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hash = await argon.hash(createUserDto.password);
    const user = new User();
    try {
      user.email = createUserDto.email;
      user.password = hash;
      await this.userRepository.save(user);
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('User Already exist');
      } else throw new InternalServerErrorException();
    }
  }
  // Endpoints for login
  async login(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });
    if (!user) throw new NotFoundException('Incorrect credentials');
    const matchPass = await argon.verify(user.password, createUserDto.password);

    if (!matchPass) throw new NotFoundException('Incorrect credential');
    return this.signToken(user.id, user.email);
  }
// for generating access-token
  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('SECRET_KEY');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const user = new User();
    user.email = updateUserDto.email;
    user.password = updateUserDto.password;
    user.id = id;
    return this.userRepository.save(user);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
