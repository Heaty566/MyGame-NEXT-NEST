import { INestApplication } from '@nestjs/common';

//---- Helper
import { initTestModule } from '../../test/initTest';

//---- Service
import { TicTacToeCommonService } from '../ticTacToeCommon.service';

//---- Entity
import { User } from '../../users/entities/user.entity';
import { TicTacToe } from '../entity/ticTacToe.entity';
import { TicTacToeRepository } from '../entity/ticTacToe.repository';

//---- Repository

describe('ticTacToeCommonService', () => {
      let app: INestApplication;
      let userDb: User;
      let ticTacToeCommonService: TicTacToeCommonService;
      let resetDB: any;
      let ticTacToeRepository: TicTacToeRepository;

      beforeAll(async () => {
            const { users, getApp, module, resetDatabase } = await initTestModule();
            app = getApp;
            userDb = (await users[0]).user;
            resetDB = resetDatabase;

            ticTacToeCommonService = module.get<TicTacToeCommonService>(TicTacToeCommonService);
            ticTacToeRepository = module.get<TicTacToeRepository>(TicTacToeRepository);
      });

      describe('getMatchByUserId', () => {
            it('getAll', async () => {
                  const newTicTacToe = new TicTacToe();
                  newTicTacToe.users = [userDb];
                  const saveTicTacToe = await ticTacToeRepository.save(newTicTacToe);

                  const getTicTacToe = await ticTacToeCommonService.getManyMatchByQuery('user.id = :userId', { userId: userDb.id });
                  expect(getTicTacToe.length).toBeGreaterThanOrEqual(1);
                  expect(getTicTacToe[0].id).toBe(saveTicTacToe.id);
            });
      });

      afterAll(async () => {
            await resetDB();
            await app.close();
      });
});