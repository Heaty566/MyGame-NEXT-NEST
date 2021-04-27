import { Test, TestingModule } from '@nestjs/testing';

//* Internal import
import { router } from '../router';
import { AppModule } from '../app.module';
import { fakeUser } from './fakeEntity';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../users/entities/user.userRole.enum';

//---- Entity
import { Chat } from '../chats/entities/chat.entity';

//---- Repository
import { UserRepository } from '../users/entities/user.repository';
import { ReTokenRepository } from '../auth/entities/re-token.repository';
import { NotificationRepository } from '../notifications/entities/notification.repository';
import { ChatRepository } from '../chats/entities/chat.repository';
import { MessageRepository } from '../chats/entities/message.repository';
import { Message } from '../chats/entities/message.entity';

export const initUsers = async (repository: UserRepository, authService: AuthService) => {
      return Array.from(Array(5)).map(async (_) => {
            const dummyUser = fakeUser();

            const user = await repository.save(dummyUser);
            const reToken = await authService.createReToken(user);
            const ioToken = await authService.getSocketToken(user);

            return {
                  user,
                  reToken,
                  ioToken,
            };
      });
};

export const initChats = async (repository: ChatRepository) => {
      let chat = new Chat();
      chat = await repository.save(chat);
      return chat;
};

const resetDatabase = async (module: TestingModule) => {
      const userRepository = module.get<UserRepository>(UserRepository);
      const notificationRepository = module.get<NotificationRepository>(NotificationRepository);
      const reTokenRepository = module.get<ReTokenRepository>(ReTokenRepository);
      const chatRepository = module.get<ChatRepository>(ChatRepository);
      const messageRepository = module.get<MessageRepository>(MessageRepository);

      await reTokenRepository.createQueryBuilder().delete().execute();
      await reTokenRepository.clear();

      await messageRepository.createQueryBuilder().delete().execute();
      await messageRepository.clear();

      await notificationRepository.createQueryBuilder().delete().execute();
      await notificationRepository.clear();

      await chatRepository.createQueryBuilder().delete().execute();
      await chatRepository.clear();

      await userRepository.createQueryBuilder().delete().execute();
      await userRepository.clear();
};

export const initTestModule = async () => {
      const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
      }).compile();

      const configModule = module.createNestApplication();
      //apply middleware
      router(configModule);
      const getApp = await configModule.init();

      // create a fake chat
      const chatRepository = module.get<ChatRepository>(ChatRepository);
      const chats = await initChats(chatRepository);

      //create a fake user and token
      const userRepository = module.get<UserRepository>(UserRepository);
      const authService = module.get<AuthService>(AuthService);
      const users = await initUsers(userRepository, authService);

      // create a fake admin
      let adminUser = fakeUser();
      adminUser.role = UserRole.ADMIN;
      adminUser = await userRepository.save(adminUser);
      const adminReToken = await authService.createReToken(adminUser);

      // create a fake message
      const messageRepository = module.get<MessageRepository>(MessageRepository);
      const messages = new Message();
      messages.text = 'Hai dep trai';
      messages.chat = chats;
      messages.userId = (await users[0]).user.id;
      messageRepository.save(messages);

      return {
            getApp,
            module,
            configModule,
            users,
            chats,
            messages,
            resetDatabase: async () => await resetDatabase(module),
            getAdmin: {
                  user: adminUser,
                  reToken: adminReToken,
            },
      };
};