/**
 *----------------------------------------------------------------------------------------------------
 *----------------------------------------------------------------------------------------------------
 *----- This is a global config file contains constant of every routers in this project
 *----- Please the document carefully before changing any thing in this file
 *----- This file is not an environment variable file, please do not store any sensitive information in this file
 *----------------------------------------------------------------------------------------------------
 *----------------------------------------------------------------------------------------------------
 */

export const config: Config = {
      authController: {
            // /login
            loginCookieTime: 1000 * 60 * 60 * 24 * 30,

            // /register
            registerCookieTime: 1000 * 60 * 60 * 24 * 30,

            // /otp-email
            OTPMailBlockTime: 30,
            OTPMailLimitTime: 5,
            OTPMailValidTime: 30,

            // /otp-sms
            OTPPhoneBlockTime: 60,
            OTPPhoneLimitTime: 3,
            OTPPhoneValidTime: 5,

            // /socket-token
            socketCookieTime: 1000 * 60 * 60 * 24,

            // /facebook/callback
            facebookUserCookieTime: 1000 * 60 * 60 * 24 * 30,
            // /github/callback
            githubUserCookieTime: 1000 * 60 * 60 * 24 * 30,
            // /google/callback
            googleUserCookieTime: 1000 * 60 * 60 * 24 * 30,
      },
      userController: {
            ///avatar
            avatarAllowExtension: ['.jpeg', '.jpg', '.png', '.bmp'],
            avatarLimitSize: 1,

            // /otp-email
            OTPMailBlockTime: 30,
            OTPMailLimitTime: 5,
            OTPMailValidTime: 30,

            // /otp-sms
            OTPPhoneBlockTime: 60,
            OTPPhoneLimitTime: 3,
            OTPPhoneValidTime: 5,
      },
};

interface Config {
      authController: AuthControllerConfig;
      userController: UserControllerConfig;
}

interface AuthControllerConfig {
      /**
       *@description time of cookie when user login
       *@example  1h = 60 * 60 * 1000
       */
      loginCookieTime: number;

      /**
       *@description time of cookie when users register
       *@example  1h = 60 * 60 * 1000
       */
      registerCookieTime: number;

      /**
       *@description time of cookie when users request a socket cookie
       *@example  1h = 60 * 60 * 1000
       */
      socketCookieTime: number;

      //--------------------------------------------------------------
      /**
       *@description amount of time which users can request send otp by email until they has been blocked
       *@example  5 means users request otp 5 times
       */
      OTPMailLimitTime: number;

      /**
       *@description how long can user wait if users request a lot of otp with the same email
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPMailBlockTime: number;

      /**
       *@description how long the email otp is invalid before removing from cache
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPMailValidTime: number;
      //--------------------------------------------------------------

      //--------------------------------------------------------------
      /**
       *@description amount of time which user can request send otp by phone number until they has been blocked
       *@example  5 means users request otp 5 times
       */
      OTPPhoneLimitTime: number;

      /**
       *@description how long can user wait if users request a lot of otp with the same phone number
       *@description  30 means users can not request send new otp in 30 minutes
       */
      OTPPhoneBlockTime: number;

      /**
       *@description how long the phone otp is invalid before removing from cache
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPPhoneValidTime: number;
      //--------------------------------------------------------------

      /**
       *@description time of cookie when users login with google
       *@description  milliseconds 1h = 60 * 60 * 1000
       */
      googleUserCookieTime: number;

      /**
       *@description time of cookie when users login with facebook
       *@description  milliseconds 1h = 60 * 60 * 1000
       */
      facebookUserCookieTime: number;

      /**
       *@description time of cookie when users login with github
       *@description  milliseconds 1h = 60 * 60 * 1000
       */
      githubUserCookieTime: number;
}

interface UserControllerConfig {
      //--------------------------------------------------------------
      /**
       *@description limit size of avatar which user can upload
       *@example  1 means 1mb
       */
      avatarLimitSize: number;

      /**
       *@description extension of allow avatar which users can upload
       *@example  ['.jpeg', '.jpg', '.png', '.bmp']
       */
      avatarAllowExtension: Array<string>;
      //--------------------------------------------------------------

      //--------------------------------------------------------------
      /**
       *@description amount of time which users can request send otp by email until they has been blocked
       *@example  5 means users request otp 5 times
       */
      OTPMailLimitTime: number;

      /**
       *@description how long can user wait if users request a lot of otp with the same email
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPMailBlockTime: number;

      /**
       *@description how long the email otp is invalid before removing from cache
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPMailValidTime: number;
      //--------------------------------------------------------------

      //--------------------------------------------------------------
      /**
       *@description amount of time which user can request send otp by phone number until they has been blocked
       *@example  5 means users request otp 5 times
       */
      OTPPhoneLimitTime: number;

      /**
       *@description how long can user wait if users request a lot of otp with the same phone number
       *@description  30 means users can not request send new otp in 30 minutes
       */
      OTPPhoneBlockTime: number;

      /**
       *@description how long the phone otp is invalid before removing from cache
       *@example  30 means users can not request send new otp in 30 minutes
       */
      OTPPhoneValidTime: number;
      //--------------------------------------------------------------
}