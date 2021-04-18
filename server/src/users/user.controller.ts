import { Controller, Get, UseGuards, Req, Param, Body, Put, Post, UsePipes, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

//---- Service
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';
import { SmailService } from '../providers/smail/smail.service';
import { SmsService } from '../providers/sms/sms.service';
import { AwsService } from '../providers/aws/aws.service';
import { RedisService } from '../providers/redis/redis.service';

//---- Entity
import { User } from './entities/user.entity';

//---- Pipe
import { UserGuard } from '../auth/auth.guard';

import { JoiValidatorPipe } from '../utils/validator/validator.pipe';

//---- DTO
import { OtpSmsDTO, vOtpSmsDTO } from '../auth/dto/otpSms.dto';
import { ResetPasswordDTO, vResetPasswordDTO } from './dto/resetPassword.dto';
import { ChangePasswordDTO, vChangePasswordDTO } from './dto/changePassword.dto';
import { UpdateUserDto, vUpdateUserDto } from './dto/updateBasicUser.dto';
import { UpdateEmailDTO, vUpdateEmailDTO } from './dto/updateEmail.dto';
import { SearchUsersDTO, vSearchUsersDTO } from './dto/searchUsers';

//---- Common
import { apiResponse } from '../app/interface/ApiResponse';
import { config } from '../config';

@Controller('user')
export class UserController {
      constructor(
            private readonly userService: UserService,

            private readonly authService: AuthService,
            private readonly redisService: RedisService,
            private readonly smsService: SmsService,
            private readonly smailService: SmailService,
            private readonly awsService: AwsService,
      ) {}

      @Get('/')
      @UseGuards(UserGuard)
      async cGetUser(@Req() req: Request) {
            //get user
            const user = await this.userService.getCurrentUser(req.user.id);

            return apiResponse.send<User>({ body: { data: user } });
      }

      @Get('/search')
      async cSearchUsers(@Query() queries: SearchUsersDTO) {
            //validate query
            const { value } = <{ value: SearchUsersDTO }>vSearchUsersDTO.validate(queries, { convert: true, stripUnknown: true });

            //get user
            const users = await this.userService.searchUsersByName(value.name, value.pageSize, value.currentPage);
            return apiResponse.send<Array<User>>({ body: { data: users } });
      }

      @Get('/:id')
      async cGetUserById(@Param('id') id: string) {
            //get user
            const user = await this.userService.getOneUserByField('id', id);
            if (!user)
                  throw apiResponse.sendError({
                        body: { message: { type: 'user.invalid-input' } },
                        type: 'BadRequestException',
                  });

            return apiResponse.send<User>({ body: { data: user } });
      }

      //------------------Update user information------------------------------------------
      @Put('/')
      @UseGuards(UserGuard)
      async cUpdateUserBasicInformation(@Req() req: Request, @Body(new JoiValidatorPipe(vUpdateUserDto)) body: UpdateUserDto) {
            //get user
            const user = await this.userService.findOneUserByField('id', req.user.id);

            //update user
            user.name = body.name;
            await this.userService.saveUser(user);

            return apiResponse.send<void>({
                  body: { message: { type: 'user.update-success' } },
            });
      }

      @Put('/avatar')
      @UseGuards(UserGuard)
      @UseInterceptors(FileInterceptor('avatar'))
      async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
            //checking file is exist
            if (!file)
                  throw apiResponse.sendError({
                        body: { details: { avatar: { type: 'any.required' } } },
                  });

            //checking size
            const isCorrectSize = this.awsService.checkFileSize(file, config.userController.avatarLimitSize);
            if (!isCorrectSize)
                  throw apiResponse.sendError({
                        body: { details: { avatar: { type: 'aws.file-too-big', context: { size: String(config.userController.avatarLimitSize) } } } },
                  });

            //checking extension
            const isCorrectFileExtension = this.awsService.checkFileExtension(file, config.userController.avatarAllowExtension);
            if (!isCorrectFileExtension)
                  throw apiResponse.sendError({
                        body: { details: { avatar: { type: 'aws.file-wrong-extension' } } },
                  });

            //upload file to aws
            const fileLocation = await this.awsService.uploadFile(file, String(req.user.id), 'user');
            if (!fileLocation)
                  throw apiResponse.sendError({
                        body: { message: { type: 'server.some-wrong' } },
                        type: 'InternalServerErrorException',
                  });

            //update user information
            const user = await this.userService.getOneUserByField('id', req.user.id);
            user.avatarUrl = fileLocation;
            await this.userService.saveUser(user);

            return apiResponse.send<void>({
                  body: { message: { type: 'user.update-success' } },
            });
      }

      @Put('/password')
      @UseGuards(UserGuard)
      async cUpdatePasswordByUser(@Body(new JoiValidatorPipe(vChangePasswordDTO)) body: ChangePasswordDTO, @Req() req: Request) {
            //checking old password is correct
            const user = await this.userService.findOneUserByField('username', req.user.username);
            const isCorrectPassword = await this.authService.decryptString(body.currentPassword, user.password);
            if (!isCorrectPassword)
                  throw apiResponse.sendError({
                        body: { details: { username: { type: 'user.auth-failed' } } },
                  });

            //update user
            user.password = await this.authService.encryptString(body.newPassword);
            await this.userService.saveUser(user);

            return apiResponse.send<void>({
                  body: { message: { type: 'user.update-success' } },
            });
      }

      @Put('/reset-password')
      async cUpdatePasswordByOtp(@Query('key') key: string, @Body(new JoiValidatorPipe(vResetPasswordDTO)) body: ResetPasswordDTO) {
            //checking otp key
            if (!key)
                  throw apiResponse.sendError({
                        type: 'ForbiddenException',
                        body: { details: { otp: { type: 'user.not-allow-action' } } },
                  });

            //checking otp key is exist
            const redisUser = await this.redisService.getObjectByKey<User>(key);
            if (!redisUser)
                  throw apiResponse.sendError({
                        type: 'ForbiddenException',
                        body: { details: { otp: { type: 'user.not-allow-action' } } },
                  });

            //update user
            const user = await this.userService.findOneUserByField('username', redisUser.username);
            user.password = await this.authService.encryptString(body.newPassword);
            await this.userService.saveUser(user);
            this.redisService.deleteByKey(key);

            return apiResponse.send<void>({
                  body: { message: { type: 'user.update-success' } },
            });
      }

      @Put('/update-with-otp')
      async cUpdateEmailByOTP(@Query('key') key: string) {
            //checking otp key
            if (!key)
                  throw apiResponse.sendError({
                        type: 'ForbiddenException',
                        body: { details: { otp: { type: 'user.not-allow-action' } } },
                  });

            //checking otp key is exist
            const redisUser = await this.redisService.getObjectByKey<User>(key);
            if (!redisUser)
                  throw apiResponse.sendError({
                        type: 'ForbiddenException',
                        body: { details: { otp: { type: 'user.not-allow-action' } } },
                  });

            //update user
            const user = await this.userService.findOneUserByField('id', redisUser.id);
            if (user.email !== redisUser.email) {
                  user.email = redisUser.email;
            } else if (user.phoneNumber !== redisUser.phoneNumber) {
                  user.phoneNumber = redisUser.phoneNumber;
            }

            await this.userService.saveUser(user);
            this.redisService.deleteByKey(key);

            return apiResponse.send<void>({
                  body: { message: { type: 'user.update-success' } },
            });
      }

      //-----------------------------------Create-OTP--WITH GUARD-------------------------------
      @Post('/otp-sms')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vOtpSmsDTO))
      async cCreateOTPBySmsWithGuard(@Body() body: OtpSmsDTO, @Req() req: Request) {
            //checking amount of time which user request before by ip
            const userIp = this.authService.parseIp(req);
            let canSendMore = await this.authService.isRateLimitKey(
                  userIp,
                  config.userController.OTPPhoneBlockTime * 2,
                  config.userController.OTPPhoneLimitTime,
            );
            if (!canSendMore)
                  throw apiResponse.sendError({
                        body: { details: { email: { type: 'user.request-many-time-60p' } } },
                  });

            //checking phone is exist
            const user = await this.userService.findOneUserByField('phoneNumber', body.phoneNumber);
            if (user)
                  throw apiResponse.sendError({
                        body: { details: { phoneNumber: { type: 'user.field-taken' } } },
                  });

            //checking amount of time which user request before by phone
            const updateUser = await this.userService.findOneUserByField('id', req.user.id);
            updateUser.phoneNumber = body.phoneNumber;
            canSendMore = await this.authService.isRateLimitKey(
                  updateUser.phoneNumber,
                  config.userController.OTPPhoneBlockTime,
                  config.userController.OTPPhoneLimitTime,
            );
            if (!canSendMore)
                  throw apiResponse.sendError({
                        body: {
                              details: { phoneNumber: { type: 'user.request-many-time-60p' } },
                        },
                  });

            //generate otp
            const otpKey = this.authService.generateOTP(updateUser, config.userController.OTPPhoneValidTime, 'sms');
            const res = await this.smsService.sendOTP(updateUser.phoneNumber, otpKey);
            if (!res)
                  throw apiResponse.sendError({
                        body: { message: { type: 'server.some-wrong' } },
                        type: 'InternalServerErrorException',
                  });

            return apiResponse.send({
                  body: { message: { type: 'server.send-phone-otp' } },
            });
      }

      @Post('/otp-email')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vUpdateEmailDTO))
      async cCreateOtpByEmailWithGuard(@Body() body: UpdateEmailDTO, @Req() req: Request) {
            //checking amount of time which user request before by ip
            const userIp = this.authService.parseIp(req);
            let canSendMore = await this.authService.isRateLimitKey(
                  userIp,
                  config.userController.OTPMailBlockTime * 2,
                  config.userController.OTPMailLimitTime,
            );
            if (!canSendMore)
                  throw apiResponse.sendError({
                        body: { details: { email: { type: 'user.request-many-time-60p' } } },
                  });

            //checking email is exist
            const user = await this.userService.findOneUserByField('email', body.email);
            if (user)
                  throw apiResponse.sendError({
                        body: { details: { email: { type: 'user.field-taken' } } },
                  });

            const updateUser = req.user;
            updateUser.email = body.email;

            //checking amount of time which user request before by email
            canSendMore = await this.authService.isRateLimitKey(
                  updateUser.email,
                  config.userController.OTPMailBlockTime,
                  config.userController.OTPMailLimitTime,
            );
            if (!canSendMore)
                  throw apiResponse.sendError({
                        body: { details: { email: { type: 'user.request-many-time-30p' } } },
                  });

            //generate otp key
            const redisKey = await this.authService.generateOTP(updateUser, config.userController.OTPMailValidTime, 'email');
            const isSent = await this.smailService.sendOTPForUpdateEmail(updateUser.email, redisKey);
            if (!isSent)
                  throw apiResponse.sendError({
                        body: { details: { email: { type: 'server.some-wrong' } } },
                        type: 'InternalServerErrorException',
                  });

            return apiResponse.send({
                  body: { message: { type: 'server.send-email-otp' } },
            });
      }
}
