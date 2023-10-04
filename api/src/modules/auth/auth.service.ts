import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupRequestDto } from './auth.dto';
import { UserService } from '../user/user.service';
import {
  dbIdGenerator,
  publicNanoidGenerator,
} from '@src/shared/helpers/nanoid-generator.helper';
import { UserCredentialService } from '../user-credential/user-credential.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/user.entity';
import { StorageService } from '../storage/storage.service';
import { Role } from '@src/shared/types/roles';
import { UserCredential } from '../user-credential/user-credential.entity';
import {
  checkHash,
  generateHash,
} from '@src/shared/helpers/generate-hash.helper';
import { UserCreateDto, UserUpdateDto } from '../user/user.dto';
import { CustomHttpException } from '@src/shared/middlewares/errors/custom-http-exception.middleware';
import { ErrorName } from '@src/shared/types/error.list';
import { configFileName } from '@src/shared/helpers/config-name.const';
import { NetworkService } from '../network/network.service';
import { InviteService } from '../invite/invite.service';
import { isImageData } from '@src/shared/helpers/imageIsFile';
const config = require(`../../..${configFileName}`);
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userCredentialService: UserCredentialService,
    private readonly mailService: MailService,
    private jwtTokenService: JwtService,
    private readonly storageService: StorageService,
    private readonly networkService: NetworkService,
    private readonly inviteService: InviteService,
  ) {}

  async signup(signupUserDto: SignupRequestDto) {
    const selectedNetwork = await this.networkService.findDefaultNetwork();

    if(selectedNetwork.inviteOnly)
    {
      const validInviteCode = await this.inviteService.isInviteCodeValid(signupUserDto.inviteCode)
      if(!validInviteCode)
      {
        throw new CustomHttpException(ErrorName.inviteOnly)
      }
    }
    const verificationToken = publicNanoidGenerator();
    let emailVerified = false;
    let accessToken = {};

    let userRole = Role.registered;
    const userCount = await this.userService.userCount();
    if (userCount < 1) {
      userRole = Role.admin;
    }

    const newUserDto = {
      username: signupUserDto.username,
      email: signupUserDto.email,
      role: userRole,
      name: signupUserDto.name,
      verificationToken: publicNanoidGenerator(),
      emailVerified: emailVerified,
      id: dbIdGenerator(),
      avatar: null,
      description: '',
      locale: signupUserDto.locale,
      receiveNotifications: true,
    };

    const emailExists = await this.userService.isEmailExists(
      signupUserDto.email,
    );
    if (emailExists) {
      throw new CustomHttpException(ErrorName.EmailAlreadyRegistered);
    }

    const usernameExists = await this.userService.findByUsername(
      signupUserDto.username,
    );
    if (usernameExists) {
      throw new CustomHttpException(
        ErrorName.UsernameAlreadyRegistered,
      );
    }
    if(signupUserDto.avatar)
    {
      try {
        newUserDto.avatar = await this.storageService.newImage64(
          signupUserDto.avatar,
        );
      } catch (err) {
        throw new CustomHttpException(ErrorName.InvalidMimetype);
      }
    }
    return this.userService
      .createUser(newUserDto)
      .then((user) => {
        return this.createUserCredential(
          newUserDto.id,
          signupUserDto.password,
        );
      })
      .then((user) => {
        if (!newUserDto.emailVerified) {
          this.sendLoginToken(newUserDto, true);
        }
        return user;
      })
      .then((userCredentials) => {
        return this.getAccessToken(newUserDto);
      })
      .catch((error) => {
        console.error(error);
        throw new CustomHttpException(
          ErrorName.UnspecifiedInternalServerError,
        );
      });
  }
  private async createUserCredential(
    userId,
    plainPassword,
  ): Promise<void | UserCredential> {
    return this.userCredentialService.createUserCredential({
      userId: userId,
      password: generateHash(plainPassword),
    });
  }

  private sendLoginToken(user, sendActivation = false) {
    const activationUrl: string = `${config.hostName}/LoginClick/${user.verificationToken}`;

    if (!sendActivation) {
      this.mailService.sendLoginTokenEmail({
        to: user.email,
        activationUrl,
      });
    }else {
      this.mailService.sendActivationEmail({
        to: user.email,
        activationUrl,
      });
    }
  }

  async loginToken(verificationToken: string) {
    return await this.userService
      .loginToken(verificationToken)
      .then((user: User) => {
        return this.getAccessToken(user);
      });
  }

  async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return null;
    }

    const userCredential = await this.userCredentialService.findOne(
      user.id,
    );
    if (!userCredential) {
      return null;
    }

    if (!(await checkHash(plainPassword, userCredential.password))) {
      return null;
    }

    return this.getAccessToken(user);
  }

  async getAccessToken(user) {
    const payload = { username: user.email, sub: user.id };

    const accesstoken = {
      token: this.jwtTokenService.sign(payload),
    };
    return accesstoken;
  }
  async getCurrentUser(userId) {
    return this.userService.findCurrentUser(userId);
  }

  async update(user: UserUpdateDto, currentUser) {
    if (user.set_new_password) {
      // save new credentials
      if (
        !(await checkHash(user.password_new, currentUser.password))
      ) {
        throw new CustomHttpException(
          ErrorName.CurrentPasswordWontMatch,
        );
      }
    }

    let newUser = {
      avatar: null,
      email: user.email,
      name: user.name,
      description: user.description,
      locale: user.locale,
      receiveNotifications: user.receiveNotifications
    };

    if (isImageData(user.avatar)) {
      try {
        newUser.avatar = await this.storageService.newImage64(
          user.avatar,
        );
      } catch (err) {
        console.log(`avatar: ${err.message}`);
      }
    }
    return this.userService
      .update(currentUser.id, newUser)
      .then(() => {
        if (user.set_new_password) {
          return this.createUserCredential(
            currentUser.id,
            user.password_new,
          ).then(() => true);
        }
        return Promise.resolve(true);
      });
  }

  async requestNewLoginToken(email: string) {
    return await this.userService
      .findOneByEmail(email)
      .then((user: User) => {
        if (user) {
          const newUser = {...user, verificationToken: publicNanoidGenerator()};
          this.userService.update(user.id, newUser)
          this.sendLoginToken(newUser, false);
        }
        return Promise.resolve(true);
      });
  }
}
