import { INestApplication } from '@nestjs/common';

//---- Helper
import { initTestModule } from '../../test/initTest';

//---- Service
import { TicTacToeCommonService } from '../ticTacToeCommon.service';

//---- Entity
import { User } from '../../user/entities/user.entity';
import { TicTacToeBoard } from '../entity/ticTacToeBoard.entity';
import { TicTacToeFlag, TicTacToePlayer, TicTacToeStatus } from '../entity/ticTacToe.interface';

describe('ticTacToeCommonService', () => {
      let app: INestApplication;
      let resetDB: any;
      let generateFakeUser: () => Promise<User>;
      let ticTacToeCommonService: TicTacToeCommonService;
      beforeAll(async () => {
            const { getApp, module, resetDatabase, getFakeUser } = await initTestModule();
            app = getApp;

            resetDB = resetDatabase;
            generateFakeUser = getFakeUser;
            ticTacToeCommonService = module.get<TicTacToeCommonService>(TicTacToeCommonService);
      });

      describe('getBoard', () => {
            let tttId: string;
            beforeEach(async () => {
                  tttId = await ticTacToeCommonService.createNewGame(await generateFakeUser(), true);
            });

            it('Pass', async () => {
                  const board = await ticTacToeCommonService.getBoard(tttId);
                  expect(board).toBeDefined();
                  expect(board.id).toBe(tttId);
            });
            it('Failed no found', async () => {
                  const board = await ticTacToeCommonService.getBoard(`ttt-hello-world`);
                  expect(board).toBeNull();
            });
      });

      describe('setBoard', () => {
            let board: TicTacToeBoard;
            let tttId: string;
            beforeEach(async () => {
                  tttId = await ticTacToeCommonService.createNewGame(await generateFakeUser(), true);

                  board = await ticTacToeCommonService.getBoard(tttId);
            });

            it('Pass', async () => {
                  board.status = TicTacToeStatus.PLAYING;
                  await ticTacToeCommonService.setBoard(board);

                  const newUpdate = await ticTacToeCommonService.getBoard(tttId);
                  expect(newUpdate).toBeDefined();
                  expect(newUpdate.status).toBe(TicTacToeStatus.PLAYING);
            });
      });

      describe('isExistUser', () => {
            let tttId: string;
            let user: User;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
            });

            it('Pass', async () => {
                  const getUser = await ticTacToeCommonService.isExistUser(tttId, user.id);

                  expect(getUser).toBeDefined();
            });
            it('Failed not found', async () => {
                  const fakeUser = await generateFakeUser();
                  const getUser = await ticTacToeCommonService.isExistUser(tttId, fakeUser.id);

                  expect(getUser).toBeUndefined();
            });
      });

      describe('createNewGame', () => {
            let user: User;
            beforeEach(async () => {
                  user = await generateFakeUser();
            });

            it('Pass BOT', async () => {
                  const tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBe(user.id);
                  expect(getBoard.users[1]).toBeDefined();
            });

            it('Pass USER', async () => {
                  const tttId = await ticTacToeCommonService.createNewGame(user, false);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBe(user.id);
                  expect(getBoard.users[1]).toBeUndefined();
            });
      });

      describe('startGame', () => {
            let user: User;
            let tttId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
            });

            it('Pass start with two ready', async () => {
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  const isStart = await ticTacToeCommonService.startGame(tttId);
                  const getBoardAfter = await ticTacToeCommonService.getBoard(tttId);
                  expect(isStart).toBeTruthy();
                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
                  expect(getBoardAfter.status).toBe(TicTacToeStatus.PLAYING);
            });
            it('Pass start with one ready', async () => {
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  const isStart = await ticTacToeCommonService.startGame(tttId);
                  const getBoardAfter = await ticTacToeCommonService.getBoard(tttId);
                  expect(isStart).toBeFalsy();
                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
                  expect(getBoardAfter.status).toBe(TicTacToeStatus['NOT-YET']);
            });
      });
      describe('surrender', () => {
            let player1: TicTacToePlayer;
            let player2: TicTacToePlayer;
            let tttId: string;

            beforeEach(async () => {
                  const user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);
                  player1 = getBoard.users[0];
                  player2 = getBoard.users[1];
            });

            it('Pass player 1 surrender', async () => {
                  await ticTacToeCommonService.surrender(tttId, player1);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(getBoard.winner).toBe(TicTacToeFlag.RED);
            });

            it('Pass  player 2 surrender', async () => {
                  await ticTacToeCommonService.surrender(tttId, player2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(getBoard.winner).toBe(TicTacToeFlag.BLUE);
            });
            it('Failed wrong id', async () => {
                  await ticTacToeCommonService.surrender('hello', player2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.PLAYING);
                  expect(getBoard.winner).toBe(TicTacToeFlag.EMPTY);
            });
      });
      describe('leaveGame', () => {
            let player1: TicTacToePlayer;
            let player2: TicTacToePlayer;
            let tttId: string;

            beforeEach(async () => {
                  const user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);

                  player1 = getBoard.users[0];
                  player2 = getBoard.users[1];
            });

            it('Pass player 1 leave when game playing', async () => {
                  await ticTacToeCommonService.startGame(tttId);
                  await ticTacToeCommonService.leaveGame(tttId, player1);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(getBoard.winner).toBe(TicTacToeFlag.RED);
            });
            it('Pass player 1 leave', async () => {
                  await ticTacToeCommonService.leaveGame(tttId, player1);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
                  expect(getBoard.users.length).toBe(1);
                  expect(getBoard.winner).toBe(TicTacToeFlag.EMPTY);
            });

            it('Pass player 2 leave when game playing', async () => {
                  await ticTacToeCommonService.startGame(tttId);
                  await ticTacToeCommonService.leaveGame(tttId, player2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(getBoard.winner).toBe(TicTacToeFlag.BLUE);
            });

            it('Pass player 2 leave when game end', async () => {
                  await ticTacToeCommonService.startGame(tttId);
                  await ticTacToeCommonService.surrender(tttId, player2);
                  await ticTacToeCommonService.leaveGame(tttId, player1);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(getBoard.winner).toBe(TicTacToeFlag.BLUE);
            });

            it('Pass player 2 leave', async () => {
                  await ticTacToeCommonService.leaveGame(tttId, player2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
                  expect(getBoard.users.length).toBe(1);
                  expect(getBoard.winner).toBe(TicTacToeFlag.EMPTY);
            });

            it('wrong board id ', async () => {
                  await ticTacToeCommonService.leaveGame('hello', player2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
                  expect(getBoard.users.length).toBe(2);
                  expect(getBoard.winner).toBe(TicTacToeFlag.EMPTY);
            });
      });

      describe('toggleReadyStatePlayer', () => {
            let user: User;
            let tttId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
            });

            it('Pass  one ready', async () => {
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  const getBoardAfter = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoardAfter.users[0].ready).toBeTruthy();
            });
            it('Pass  two ready', async () => {
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  const getBoardAfter = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoardAfter.users[1].ready).toBeTruthy();
            });
      });
      describe('findUser', () => {
            let user: User;
            let tttId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
            });

            it('Pass', async () => {
                  const getUser = await ticTacToeCommonService.findUser(tttId, user.id);

                  expect(getUser).toBeDefined();
            });
            it('Failed Not Found', async () => {
                  const getUser = await ticTacToeCommonService.findUser(tttId, 'hello-world');

                  expect(getUser).toBeUndefined();
            });
            it('Failed wrong boardId', async () => {
                  const getUser = await ticTacToeCommonService.findUser('hello-world', user.id);

                  expect(getUser).toBeUndefined();
            });
      });

      describe('leaveGame', () => {
            it('Pass player 1 leave when game playing', async () => {
                  const user1 = await generateFakeUser();
                  const user2 = await generateFakeUser();
                  const tttId = await ticTacToeCommonService.createNewGame(user1, false);
                  await ticTacToeCommonService.joinGame(tttId, user2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  getBoard.board[1][1] = TicTacToeFlag.BLUE;
                  getBoard.board[1][2] = TicTacToeFlag.BLUE;
                  await ticTacToeCommonService.setBoard(getBoard);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);
                  await ticTacToeCommonService.surrender(tttId, getBoard.users[1]);
                  const tttDB = await ticTacToeCommonService.loadToDatabase(tttId);

                  expect(tttDB.winner).toBe(TicTacToeFlag.BLUE);
                  expect(tttDB.moves).toHaveLength(2);

                  expect(tttDB.users[0].id).toBeDefined();
                  expect(tttDB.users[1].id).toBeDefined();
            });
            it('Pass play with bot', async () => {
                  const user1 = await generateFakeUser();
                  const tttId = await ticTacToeCommonService.createNewGame(user1, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);
                  await ticTacToeCommonService.surrender(tttId, getBoard.users[1]);
                  const tttDB = await ticTacToeCommonService.loadToDatabase(tttId);

                  expect(tttDB).toBeUndefined();
            });

            it('Pass game not done yet', async () => {
                  const user1 = await generateFakeUser();
                  const tttId = await ticTacToeCommonService.createNewGame(user1, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);

                  const tttDB = await ticTacToeCommonService.loadToDatabase(tttId);

                  expect(tttDB).toBeUndefined();
            });
      });
      describe('joinGame', () => {
            let tttId: string;
            beforeEach(async () => {
                  const user1 = await generateFakeUser();

                  tttId = await ticTacToeCommonService.createNewGame(user1, false);
            });

            it('Pass user2 join', async () => {
                  const user2 = await generateFakeUser();
                  await ticTacToeCommonService.joinGame(tttId, user2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.users[1].id).toBe(user2.id);
            });
            it('Failed join wrong id', async () => {
                  const user2 = await generateFakeUser();
                  await ticTacToeCommonService.joinGame('hello', user2);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.users.length).toBe(1);
            });
      });

      afterAll(async () => {
            await resetDB();
            await app.close();
      });
});
