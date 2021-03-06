import * as supertest from 'supertest';
import 'jest-ts-auto-mock';
let mockPromise = Promise.resolve();
import { defuse } from '../../../test/testHelper';
import { SmailService } from '../../providers/smail/smail.service';
class TwilioMock {
      constructor() {
            //
      }

      public messages = {
            create() {
                  return mockPromise;
            },
      };
}

import { INestApplication } from '@nestjs/common';
import { createMock } from 'ts-auto-mock';
import { Request, response, Response } from 'express';

//* Internal import
import { fakeUser } from '../../../test/fakeEntity';
import { UserRepository } from '../../user/entities/user.repository';
import { initTestModule } from '../../../test/initTest';
import { RegisterUserDTO } from '../dto/register.dto';
import { LoginUserDTO } from '../dto/login.dto';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { OTPEmail } from '../dto/otpEmail';
import { OtpSmsDTO } from '../dto/otpSms.dto';
import { User } from '../../user/entities/user.entity';
import { fakeData } from '../../../test/fakeData';

jest.mock('twilio', () => {
      return {
            Twilio: TwilioMock,
      };
});

describe('AuthController', () => {
      let app: INestApplication;
      let userRepository: UserRepository;
      let authService: AuthService;
      let authController: AuthController;
      let mailService: SmailService;
      let user: User;
      beforeAll(async () => {
            const { getApp, module, getUser } = await initTestModule();
            app = getApp;
            user = getUser;
            userRepository = module.get<UserRepository>(UserRepository);
            authService = module.get<AuthService>(AuthService);
            authController = module.get<AuthController>(AuthController);
            mailService = module.get<SmailService>(SmailService);
      });

      describe('googleAuth | facebookAuth | githubAuth', () => {
            it('googleAuth', async () => {
                  const res = await authController.googleAuth();
                  expect(res).toBeUndefined();
            });
            it('facebookAuth', async () => {
                  const res = await authController.facebookAuth();
                  expect(res).toBeUndefined();
            });
            it('githubAuth', async () => {
                  const res = await authController.githubAuth();
                  expect(res).toBeUndefined();
            });
      });

      describe('googleAuthRedirect | facebookAuthRedirect | githubAuthRedirect', () => {
            let req: Request;
            let res: Response;

            beforeEach(() => {
                  req = createMock<Request>();
                  req.user = fakeUser();
                  res = createMock<Response>();
                  res.cookie = jest.fn().mockReturnValue({
                        redirect: (url) => url,
                  });
            });

            it('googleAuthRedirect', async () => {
                  const output = await authController.googleAuthRedirect(req, res);

                  expect(output).toBe(process.env.CLIENT_URL);
            });
            it('facebookAuthRedirect', async () => {
                  const output = await authController.facebookAuthRedirect(req, res);

                  expect(output).toBe(process.env.CLIENT_URL);
            });
            it('githubAuthRedirect', async () => {
                  const output = await authController.githubAuthRedirect(req, res);

                  expect(output).toBe(process.env.CLIENT_URL);
            });
      });

      describe('POST /register', () => {
            let createUserData: RegisterUserDTO;
            const reqApi = (input: RegisterUserDTO) => supertest(app.getHttpServer()).post('/api/auth/register').send(input);

            beforeEach(() => {
                  const getUser = fakeUser();
                  createUserData = {
                        name: getUser.name,
                        username: getUser.username,
                        password: getUser.password,
                        confirmPassword: getUser.password,
                  };
            });
            it('Pass', async () => {
                  const res = await reqApi(createUserData);

                  const token = res.headers['set-cookie'].join('');
                  expect(token).toContain('re-token');
            });

            it('Failed (username is taken)', async () => {
                  await reqApi(createUserData);
                  const res = await reqApi(createUserData);
                  expect(res.status).toBe(400);
            });

            it('Failed (confirmPassword does not match)', async () => {
                  createUserData.confirmPassword = '12345678';
                  const res = await reqApi(createUserData);

                  expect(res.status).toBe(400);
            });
      });

      describe('POST /login', () => {
            let loginUserData: LoginUserDTO;
            const reqApi = (input: LoginUserDTO) => supertest(app.getHttpServer()).post('/api/auth/login').send(input);

            beforeEach(async () => {
                  const getUser = fakeUser();
                  loginUserData = {
                        username: getUser.username,
                        password: getUser.password,
                  };
                  getUser.password = await authService.hash(getUser.password);
                  await authService.saveUser(getUser);
            });

            it('Pass', async () => {
                  const res = await reqApi(loginUserData);

                  const token = res.headers['set-cookie'].join('');
                  expect(token).toContain('re-token');
            });

            it('Failed (username is not correct)', async () => {
                  loginUserData.username = 'update';
                  const res = await reqApi(loginUserData);
                  expect(res.status).toBe(400);
            });

            it('Failed (password is not correct)', async () => {
                  loginUserData.password = '123AABBDASDaa';
                  const res = await reqApi(loginUserData);
                  expect(res.status).toBe(400);
            });
      });

      describe('POST /otp-sms', () => {
            let otpSmsDTO: OtpSmsDTO;
            const reqApi = (input: OtpSmsDTO) => supertest(app.getHttpServer()).post('/api/auth/otp-sms').send(input);

            beforeEach(async () => {
                  otpSmsDTO = {
                        phoneNumber: user.phoneNumber,
                  };
            });

            it('Pass', async () => {
                  const res = await reqApi(otpSmsDTO);
                  expect(res.status).toBe(201);
            });

            it('Failed (error of sms service)', async () => {
                  mockPromise = defuse(new Promise((resolve, reject) => reject(new Error('Oops'))));
                  try {
                        await reqApi(otpSmsDTO);
                  } catch (err) {
                        expect(err.status).toBe(500);
                  }
            });

            it('Failed (phone number is not correct)', async () => {
                  otpSmsDTO = {
                        phoneNumber: fakeData(10, 'number'),
                  };
                  const res = await reqApi(otpSmsDTO);
                  expect(res.status).toBe(400);
            });
      });

      describe('POST /otp-email/updatePassword', () => {
            let otpMail: OTPEmail;
            const reqApi = (input: OTPEmail) => supertest(app.getHttpServer()).post('/api/auth/otp-email/updatePassword').send(input);

            beforeEach(() => {
                  otpMail = {
                        email: user.email,
                  };
            });

            it('Pass', async () => {
                  const res = await reqApi(otpMail);
                  expect(res.status).toBe(201);
            });

            it('Failed (error of smail)', async () => {
                  otpMail = {
                        email: user.email,
                  };

                  const mySpy = jest.spyOn(mailService, 'sendOTPMailUpdatePassword').mockImplementation(() => Promise.resolve(false));

                  try {
                        await reqApi(otpMail);
                  } catch (err) {
                        expect(err.status).toBe(500);
                  }
                  mySpy.mockClear();
            });

            it('Failed (email is not found in database)', async () => {
                  otpMail = {
                        email: fakeData(10, 'lettersLowerCase') + '@gmail.com',
                  };
                  const res = await reqApi(otpMail);
                  expect(res.status).toBe(400);
            });
      });
      /*
      describe('POST /otp-email/updateEmail', () => {
            let otpMail: OTPEmail;

            const reqApi = (input: OTPEmail) => supertest(app.getHttpServer()).post('/api/auth/otp-email/updateEmail').send(input);

            beforeEach(() => {
                  const mySpy = jest
                        .spyOn(authController, 'loginUser')
                        .mockImplementation(() => Promise.resolve(response.cookie('re-token', fakeData(20)).send()));
            });

            it('Pass', async () => {
                  otpMail = {
                        email: 'haicao2805@gmail.com',
                  };
                  const res = await reqApi(otpMail);
                  console.log(res.body);
            });
      });
      */
      afterAll(async () => {
            await userRepository.clear();
            await app.close();
      });
});
