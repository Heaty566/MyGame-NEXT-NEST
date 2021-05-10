import * as supertest from 'supertest';
import 'jest-ts-auto-mock';
import { INestApplication } from '@nestjs/common';

//---- Entity
import { User } from '../../user/entities/user.entity';
import { ChessFlag, ChessMoveCache, ChessPlayer, ChessRole, ChessStatus, PlayerFlagEnum } from '../entity/chess.interface';

//---- Service
import { ChessService } from '../chess.service';
import { ChessCommonService } from '../chessCommon.service';
import { AuthService } from '../../auth/auth.service';

//---- DTO
import { ChessAddMoveDto } from '../dto/chessAddMoveDto';
import { ChessChooseAPieceDTO } from '../dto/chessChooseAPieceDTO';
import { ChessRoomIdDTO } from '../dto/chessRoomIdDto';

//---- Common
import { initTestModule } from '../../test/initTest';
import { generateCookie } from '../../test/test.helper';

describe('ChessController', () => {
      let app: INestApplication;
      let resetDB: any;
      let generateFakeUser: () => Promise<User>;
      let authService: AuthService;
      let chessService: ChessService;
      let chessCommonService: ChessCommonService;

      beforeAll(async () => {
            const { getApp, module, resetDatabase, getFakeUser } = await initTestModule();
            app = getApp;
            resetDB = resetDatabase;
            generateFakeUser = getFakeUser;
            authService = module.get<AuthService>(AuthService);
            chessService = module.get<ChessService>(ChessService);
            chessCommonService = module.get<ChessCommonService>(ChessCommonService);
      });

      describe('PUT /join-room', () => {
            let user: User;
            let newCookie: string[];
            let boardId: string;
            beforeEach(async () => {
                  user = await generateFakeUser();
                  boardId = await chessCommonService.createNewGame(user);
                  const getBoard = await chessCommonService.getBoard(boardId);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[0]);

                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: ChessRoomIdDTO) =>
                  supertest(app.getHttpServer()).put('/api/chess/join-room').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: boardId });
                  const getBoard = await chessCommonService.getBoard(boardId);
                  const isExistUser = await chessCommonService.isExistUser(boardId, user.id);

                  expect(res.status).toBe(200);
                  expect(isExistUser).toBeDefined();
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].id).toBe(user.id);
            });

            it('Failed game is playing', async () => {
                  const board = await chessCommonService.getBoard(boardId);
                  board.status = ChessStatus.PLAYING;
                  await chessCommonService.setBoard(board);

                  const res = await reqApi({ roomId: boardId });

                  expect(res.status).toBe(404);
            });

            it('Pass game full', async () => {
                  await chessCommonService.joinGame(boardId, user);
                  await chessCommonService.joinGame(boardId, user);

                  const res = await reqApi({ roomId: boardId });

                  expect(res.status).toBe(200);
            });
      });

      describe('PUT /start', () => {
            let user1: User, user2: User;
            let newCookie: string[];
            let boardId: string;
            let player1: ChessPlayer, player2: ChessPlayer;
            beforeEach(async () => {
                  user1 = await generateFakeUser();
                  user2 = await generateFakeUser();
                  boardId = await chessCommonService.createNewGame(user1);
                  await chessCommonService.joinGame(boardId, user2);
                  const getBoard = await chessCommonService.getBoard(boardId);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[0]);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[1]);

                  newCookie = generateCookie(await authService.createReToken(user1));

                  player1 = getBoard.users[0];
                  player2 = getBoard.users[1];
            });

            const reqApi = (input: ChessRoomIdDTO, cookie: string[]) =>
                  supertest(app.getHttpServer()).put('/api/chess/start').set({ cookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: boardId }, newCookie);
                  const getBoard = await chessCommonService.getBoard(boardId);

                  expect(res.status).toBe(200);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(ChessStatus.PLAYING);
            });

            it('Failed only one ready', async () => {
                  await chessCommonService.toggleReadyStatePlayer(boardId, player2);
                  const res = await reqApi({ roomId: boardId }, newCookie);
                  const getBoard = await chessCommonService.getBoard(boardId);

                  expect(res.status).toBe(400);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(ChessStatus.NOT_YET);
            });

            it('Failed not a user', async () => {
                  const fakeCookie = generateCookie(await authService.createReToken(await generateFakeUser()));
                  const res = await reqApi({ roomId: boardId }, fakeCookie);
                  const getBoard = await chessCommonService.getBoard(boardId);

                  expect(res.status).toBe(403);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.status).toBe(ChessStatus.NOT_YET);
            });
      });

      describe('PUT /ready', () => {
            let user: User;
            let newCookie: string[];
            let boardId: string;

            beforeEach(async () => {
                  user = await generateFakeUser();
                  boardId = await chessCommonService.createNewGame(user);
                  newCookie = generateCookie(await authService.createReToken(user));
            });

            const reqApi = (input: ChessRoomIdDTO) => supertest(app.getHttpServer()).put('/api/chess/ready').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: boardId });
                  const getBoard = await chessCommonService.getBoard(boardId);

                  expect(res.status).toBe(200);
                  expect(getBoard).toBeDefined();
                  expect(getBoard.users[0].ready).toBeTruthy();
            });
      });

      describe('PUT /choose-piece', () => {
            let user1: User, user2: User;
            let player1: ChessPlayer, player2: ChessPlayer;
            let newCookie: string[];
            let boardId: string;
            beforeEach(async () => {
                  user1 = await generateFakeUser();
                  user2 = await generateFakeUser();
                  boardId = await chessCommonService.createNewGame(user1);
                  await chessCommonService.joinGame(boardId, user2);
                  const getBoard = await chessCommonService.getBoard(boardId);

                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[0]);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[1]);

                  await chessCommonService.startGame(boardId);
                  player1 = getBoard.users[0];
                  player2 = getBoard.users[1];

                  newCookie = generateCookie(await authService.createReToken(user1));
            });

            const reqApi = (input: ChessChooseAPieceDTO) =>
                  supertest(app.getHttpServer()).put('/api/chess/choose-piece').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({ roomId: boardId, x: 3, y: 1, flag: 0, chessRole: ChessRole.PAWN });
                  expect(res.body.data?.length).toBe(2);
            });

            it('Failed choose empty square', async () => {
                  const res = await reqApi({ roomId: boardId, x: 3, y: 2, flag: 0, chessRole: ChessRole.PAWN });
                  expect(res.status).toBe(400);
            });

            it('Failed choose enemy piece', async () => {
                  const res = await reqApi({ roomId: boardId, x: 3, y: 6, flag: 1, chessRole: ChessRole.PAWN });
                  expect(res.status).toBe(400);
            });
      });

      describe('PUT /add-move', () => {
            let user1: User, user2: User;
            let newCookie: string[];
            let boardId: string;
            let player1: ChessPlayer, player2: ChessPlayer;
            beforeEach(async () => {
                  user1 = await generateFakeUser();
                  user2 = await generateFakeUser();
                  boardId = await chessCommonService.createNewGame(user1);
                  await chessCommonService.joinGame(boardId, user2);

                  const getBoard = await chessCommonService.getBoard(boardId);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[0]);
                  await chessCommonService.toggleReadyStatePlayer(boardId, getBoard.users[1]);

                  await chessCommonService.startGame(boardId);

                  player1 = getBoard.users[0];
                  player2 = getBoard.users[1];

                  newCookie = generateCookie(await authService.createReToken(user1));
            });
            const reqApi = (input: ChessAddMoveDto) =>
                  supertest(app.getHttpServer()).put('/api/chess/add-move').set({ cookie: newCookie }).send(input);

            it('Pass', async () => {
                  const res = await reqApi({
                        roomId: boardId,
                        curPos: {
                              x: 5,
                              y: 1,
                              flag: 0,
                              chessRole: ChessRole.PAWN,
                        },
                        desPos: {
                              x: 5,
                              y: 3,
                              flag: -1,
                              chessRole: ChessRole.EMPTY,
                        },
                  });
                  const getBoard = await chessCommonService.getBoard(boardId);
                  expect(res.status).toBe(200);
                  expect(getBoard.board[5][3].chessRole).toBe(ChessRole.PAWN);
                  expect(getBoard.board[5][3].flag).toBe(0);
            });

            it('Failed invalid destination square', async () => {
                  const res = await reqApi({
                        roomId: boardId,
                        curPos: {
                              x: 5,
                              y: 1,
                              flag: 0,
                              chessRole: ChessRole.PAWN,
                        },
                        desPos: {
                              x: 5,
                              y: 4,
                              flag: -1,
                              chessRole: ChessRole.EMPTY,
                        },
                  });
                  expect(res.status).toBe(400);
            });

            it('Failed wrong current square', async () => {
                  const res = await reqApi({
                        roomId: boardId,
                        curPos: {
                              x: 5,
                              y: 6,
                              flag: 1,
                              chessRole: ChessRole.PAWN,
                        },
                        desPos: {
                              x: 5,
                              y: 4,
                              flag: -1,
                              chessRole: ChessRole.EMPTY,
                        },
                  });
                  expect(res.status).toBe(400);
            });
      });
      afterAll(async () => {
            await resetDB();
            await app.close();
      });
});
