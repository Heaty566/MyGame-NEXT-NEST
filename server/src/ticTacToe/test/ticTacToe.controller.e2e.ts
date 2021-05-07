import * as supertest from 'supertest';
import 'jest-ts-auto-mock';
import { INestApplication } from '@nestjs/common';

//---- Entity
import { User } from '../../users/entities/user.entity';
import { TicTacToeFlag, TicTacToePlayer, TicTacToeStatus } from '../entity/ticTacToe.interface';

//---- Service
import { TicTacToeService } from '../ticTacToe.service';
import { TicTacToeCommonService } from '../ticTacToeCommon.service';
import { AuthService } from '../../auth/auth.service';

//---- DTO
import { RoomIdDTO } from '../dto/roomIdDto';
import { AddMoveDto } from '../dto/addMoveDto';

//---- Common
import { initTestModule } from '../../test/initTest';
import { generateCookie } from '../../test/test.helper';

describe('TicTacToeController', () => {
      let app: INestApplication;
      let resetDB: any;

      let ticTacToeCommonService: TicTacToeCommonService;
      let generateFakeUser: () => Promise<User>;
      let authService: AuthService;
      let ticTacToeService: TicTacToeService;

      beforeAll(async () => {
            const { getApp, module, resetDatabase, getFakeUser } = await initTestModule();
            app = getApp;
            resetDB = resetDatabase;
            generateFakeUser = getFakeUser;
            ticTacToeService = module.get<TicTacToeService>(TicTacToeService);
            ticTacToeCommonService = module.get<TicTacToeCommonService>(TicTacToeCommonService);
            authService = module.get<AuthService>(AuthService);
      });

      describe('POST /bot', () => {
            let newUser: User;
            let newCookie: string[];
            beforeEach(async () => {
                  newUser = await generateFakeUser();
                  newCookie = generateCookie(await authService.createReToken(newUser));
            });

            const reqApi = () => supertest(app.getHttpServer()).post('/api/ttt/bot').set({ cookie: newCookie }).send();

            it('Pass', async () => {
                  const res = await reqApi();
                  const getBoard = await ticTacToeCommonService.getBoard(res.body.data.roomId);

                  const isExistUser = getBoard.users.find((item) => item.id === newUser.id);

                  expect(isExistUser).toBeDefined();
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBeDefined();
                  expect(getBoard.users[1].id).toBeDefined();
                  expect(res.status).toBe(201);
            });
      });
      describe('POST /pvp', () => {
            let newUser: User;
            let newCookie: string[];
            beforeEach(async () => {
                  newUser = await generateFakeUser();
                  newCookie = generateCookie(await authService.createReToken(newUser));
            });

            const reqApi = () => supertest(app.getHttpServer()).post('/api/ttt/pvp').set({ cookie: newCookie }).send();

            it('Pass', async () => {
                  const res = await reqApi();
                  const getBoard = await ticTacToeCommonService.getBoard(res.body.data.roomId);

                  const isExistUser = getBoard.users.find((item) => item.id === newUser.id);

                  expect(isExistUser).toBeDefined();
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBeDefined();
                  expect(getBoard.users[1]).toBeUndefined();
                  expect(res.status).toBe(201);
            });
      });
      describe('POST /restart', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;
            let player1: TicTacToePlayer;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);
                  player1 = getBoard.users[0];
                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: RoomIdDTO) => supertest(app.getHttpServer()).post('/api/ttt/restart').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  await ticTacToeCommonService.surrender(tttId, player1);
                  const res = await reqApi({ roomId: tttId });
                  const getBoard = await ticTacToeCommonService.getBoard(res.body.data.roomId);
                  const isExistUser = getBoard.users.find((item) => item.id === user.id);

                  expect(isExistUser).toBeDefined();
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBeDefined();
                  expect(getBoard.users[1]).toBeUndefined();
                  expect(res.status).toBe(201);
            });
            it('Failed game is playing', async () => {
                  const res = await reqApi({ roomId: tttId });

                  expect(res.status).toBe(403);
            });
            it('Failed out id', async () => {
                  const res = await reqApi({ roomId: 'hello' });

                  expect(res.status).toBe(404);
            });
      });

      describe('POST /add-move', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;
            let player1: TicTacToePlayer;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);
                  await ticTacToeCommonService.startGame(tttId);
                  player1 = getBoard.users[0];
                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: AddMoveDto) => supertest(app.getHttpServer()).post('/api/ttt/add-move').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.board[0][0]).toBe(player1.flag);
                  expect(res.status).toBe(201);
            });

            it('Failed wrong turn', async () => {
                  await ticTacToeService.addMoveToBoard(tttId, player1, 1, 2);

                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.board[0][0]).toBe(TicTacToeFlag.EMPTY);
                  expect(res.status).toBe(400);
            });

            it('Pass user win', async () => {
                  const beforeUpdate = await ticTacToeCommonService.getBoard(tttId);
                  beforeUpdate.board[1][1] = TicTacToeFlag.BLUE;
                  beforeUpdate.board[2][2] = TicTacToeFlag.BLUE;
                  beforeUpdate.board[3][3] = TicTacToeFlag.BLUE;
                  beforeUpdate.board[4][4] = TicTacToeFlag.BLUE;
                  await ticTacToeCommonService.setBoard(beforeUpdate);
                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.winner).toBe(TicTacToeFlag.BLUE);
                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(res.status).toBe(201);
            });
            it('Pass bot win', async () => {
                  const beforeUpdate = await ticTacToeCommonService.getBoard(tttId);
                  beforeUpdate.board[1][1] = TicTacToeFlag.RED;
                  beforeUpdate.board[2][2] = TicTacToeFlag.RED;
                  beforeUpdate.board[3][3] = TicTacToeFlag.RED;
                  beforeUpdate.board[4][4] = TicTacToeFlag.RED;
                  await ticTacToeCommonService.setBoard(beforeUpdate);
                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.winner).toBe(TicTacToeFlag.RED);
                  expect(getBoard.status).toBe(TicTacToeStatus.END);
                  expect(res.status).toBe(201);
            });

            it('Failed cell is picked', async () => {
                  const beforeUpdate = await ticTacToeCommonService.getBoard(tttId);
                  beforeUpdate.board[0][0] = TicTacToeFlag.RED;
                  await ticTacToeCommonService.setBoard(beforeUpdate);
                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.board[0][0]).not.toBe(TicTacToeFlag.EMPTY);
                  expect(res.status).toBe(400);
            });

            it('Failed game is not start yet', async () => {
                  await ticTacToeCommonService.surrender(tttId, player1);
                  const res = await reqApi({ roomId: tttId, x: 0, y: 0 });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(getBoard.board[0][0]).toBe(TicTacToeFlag.EMPTY);
                  expect(res.status).toBe(403);
            });
      });

      describe('POST /join-room', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(await generateFakeUser(), false);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);

                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: RoomIdDTO) => supertest(app.getHttpServer()).post('/api/ttt/join-room').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: tttId });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  const isExistUser = getBoard.users.find((item) => item.id === user.id);

                  expect(res.status).toBe(201);
                  expect(isExistUser).toBeDefined();
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBeDefined();
                  expect(getBoard.users[1].id).toBe(user.id);
            });

            it('Failed game is playing', async () => {
                  const beforeUpdate = await ticTacToeCommonService.getBoard(tttId);
                  beforeUpdate.status = TicTacToeStatus.PLAYING;
                  await ticTacToeCommonService.setBoard(beforeUpdate);

                  const res = await reqApi({ roomId: tttId });

                  expect(res.status).toBe(404);
            });
            it('Pass game full', async () => {
                  await ticTacToeCommonService.joinGame(tttId, user);
                  await ticTacToeCommonService.joinGame(tttId, user);

                  const res = await reqApi({ roomId: tttId });

                  expect(res.status).toBe(201);
            });
      });

      describe('POST /start', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;
            let player1: TicTacToePlayer;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[0]);
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, getBoard.users[1]);

                  newCookie = generateCookie(await authService.createReToken(user));
                  player1 = getBoard.users[0];
            });

            const reqApi = (input: RoomIdDTO, cookie: string[]) => supertest(app.getHttpServer()).post('/api/ttt/start').set({ cookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: tttId }, newCookie);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(res.status).toBe(201);

                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(TicTacToeStatus.PLAYING);
            });
            it('Failed only one ready', async () => {
                  await ticTacToeCommonService.toggleReadyStatePlayer(tttId, player1);
                  const res = await reqApi({ roomId: tttId }, newCookie);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(res.status).toBe(400);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
            });
            it('Failed not a user', async () => {
                  const fakeCookie = generateCookie(await authService.createReToken(await generateFakeUser()));
                  const res = await reqApi({ roomId: tttId }, fakeCookie);
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(res.status).toBe(403);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(TicTacToeStatus['NOT-YET']);
            });
      });

      describe('POST /ready', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);

                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: RoomIdDTO) => supertest(app.getHttpServer()).post('/api/ttt/ready').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: tttId });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);
                  expect(res.status).toBe(201);

                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].ready).toBeTruthy();
            });
      });

      describe('POST /leave', () => {
            let user: User;
            let newCookie: string[];
            let tttId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  tttId = await ticTacToeCommonService.createNewGame(user, true);

                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: RoomIdDTO) => supertest(app.getHttpServer()).post('/api/ttt/leave').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: tttId });
                  const getBoard = await ticTacToeCommonService.getBoard(tttId);

                  expect(res.status).toBe(201);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users.length).toBe(1);
            });
      });

      afterAll(async () => {
            await resetDB();
            await app.close();
      });
});