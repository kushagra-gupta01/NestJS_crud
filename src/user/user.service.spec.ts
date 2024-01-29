import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';


describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((user) =>
      Promise.resolve({
        id: Date.now(),
        ...user,
        access_token: 'mock-token',
      }),
    ),
    findOne:jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        JwtModule.register({
          secret: 'jwt',
        }),
      ],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should create a new user record and return that', async () => {
    expect(
      await service.create({ email: 'amankumar@gmail.com', password: '1223' }),
    ).toEqual({
      access_token: expect.any(String),
    });
  });
  // for login
  it('should throw NotFoundException if user is not found', async () => {
    // Arrange
    mockUserRepository.findOne.mockResolvedValue(null);

    // Act and Assert
    await expect(
      service.login({
        email: 'nonexistent@example.com',
        password: 'password',
      }),
    ).rejects.toThrowError(NotFoundException);
  });
});
