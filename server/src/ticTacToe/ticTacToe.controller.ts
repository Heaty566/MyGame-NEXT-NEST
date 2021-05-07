import { Body, Controller, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { Request } from 'express';

//---- Service
import { TicTacToeBotService } from './ticTacToeBot.service';
import { RedisService } from '../utils/redis/redis.service';
import { TicTacToeCommonService } from './ticTacToeCommon.service';
import { TicTacToeService } from './ticTacToe.service';
import { UserGuard } from '../auth/auth.guard';

//---- Gateway
import { TicTacToeGateway } from './ticTacToe.gateway';

//---- Entity
import { TicTacToeStatus } from './entity/ticTacToe.interface';
import { TicTacToeBoard } from './entity/ticTacToeBoard.entity';

//---- Pipe
import { JoiValidatorPipe } from '../utils/validator/validator.pipe';

//---- Dto
import { TTTRoomIdDTO, vTTTRoomIdDto } from './dto/tttRoomIdDto';
import { TTTAddMoveDto, vTTTAddMoveDto } from './dto/tttAddMoveDto';

//---- Common
import { apiResponse } from '../app/interface/apiResponse';

@Controller('ttt')
export class TicTacToeController {
      constructor(
            private readonly redisService: RedisService,
            private readonly ticTacToeCommonService: TicTacToeCommonService,
            private readonly ticTacToeService: TicTacToeService,
            private readonly ticTacToeGateway: TicTacToeGateway,
            private readonly ticTacToeBotService: TicTacToeBotService,
      ) {}

      private async getPlayer(tttId: string, userId: string) {
            const player = await this.ticTacToeCommonService.isExistUser(tttId, userId);
            if (!player) throw apiResponse.sendError({ details: { errorMessage: { type: 'error.not-allow-action' } } }, 'ForbiddenException');
            return player;
      }

      private async getGame(roomId: string) {
            const board = await this.ticTacToeCommonService.getBoard(roomId);
            if (!board) throw apiResponse.sendError({ details: { roomId: { type: 'field.not-found' } } }, 'NotFoundException');
            return board;
      }

      private async isPlaying(board: TicTacToeBoard) {
            if (board.status === TicTacToeStatus.PLAYING)
                  throw apiResponse.sendError({ details: { errorMessage: { type: 'error.not-allow-action' } } }, 'ForbiddenException');
      }

      @Post('/pvp')
      @UseGuards(UserGuard)
      async handleOnCreatePvP(@Req() req: Request) {
            const newGameId = await this.ticTacToeCommonService.createNewGame(req.user, false);

            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: newGameId } });
      }

      @Post('/restart')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vTTTRoomIdDto))
      async handleOnRestartPvP(@Req() req: Request, @Body() body: TTTRoomIdDTO) {
            const board = await this.getGame(body.roomId);
            await this.isPlaying(board);
            await this.getPlayer(board.id, req.user.id);

            const newGameId = await this.ticTacToeCommonService.createNewGame(req.user, false);

            await this.ticTacToeGateway.restartGame(board.id, newGameId);
            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: newGameId } });
      }

      @Post('/bot')
      @UseGuards(UserGuard)
      async handleOnCreateBot(@Req() req: Request) {
            const newGameId = await this.ticTacToeCommonService.createNewGame(req.user, true);
            const playerOne = await this.ticTacToeCommonService.findUser(newGameId, req.user.id);
            const bot = await this.ticTacToeCommonService.findUser(newGameId, 'BOT');
            await this.ticTacToeCommonService.toggleReadyStatePlayer(newGameId, playerOne);
            await this.ticTacToeCommonService.toggleReadyStatePlayer(newGameId, bot);

            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: newGameId } });
      }

      @Post('/join-room')
      @UseGuards(UserGuard)
      async handleOnJoinRoom(@Req() req: Request, @Body() body: TTTRoomIdDTO) {
            const board = await this.getGame(body.roomId);
            if (board.status !== TicTacToeStatus['NOT-YET'])
                  throw apiResponse.sendError({ details: { roomId: { type: 'field.not-found' } } }, 'NotFoundException');

            const isExist = await this.ticTacToeCommonService.isExistUser(board.id, req.user.id);
            if (!isExist && board.users.length < 2) await this.ticTacToeCommonService.joinGame(board.id, req.user);

            return apiResponse.send({ data: board });
      }

      @Post('/start')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vTTTRoomIdDto))
      async handleOnStartGame(@Req() req: Request, @Body() body: TTTRoomIdDTO) {
            const board = await this.getGame(body.roomId);
            await this.isPlaying(board);
            await this.getPlayer(board.id, req.user.id);
            const isStart = await this.ticTacToeCommonService.startGame(board.id);
            if (!isStart) throw apiResponse.sendError({ details: { errorMessage: { type: 'error.wait-ready-player' } } }, 'BadRequestException');

            await this.ticTacToeGateway.sendToRoom(board.id);
            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: board.id } });
      }

      @Post('/ready')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vTTTRoomIdDto))
      async handleOnReadyGame(@Req() req: Request, @Body() body: TTTRoomIdDTO) {
            const board = await this.getGame(body.roomId);
            await this.isPlaying(board);

            const player = await this.getPlayer(board.id, req.user.id);
            await this.ticTacToeCommonService.toggleReadyStatePlayer(board.id, player);

            await this.ticTacToeGateway.sendToRoom(board.id);
            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: board.id } });
      }

      @Post('/leave')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vTTTRoomIdDto))
      async handleOnLeaveGame(@Req() req: Request, @Body() body: TTTRoomIdDTO) {
            const board = await this.getGame(body.roomId);

            const player = await this.getPlayer(board.id, req.user.id);
            await this.ticTacToeCommonService.leaveGame(board.id, player);

            await this.ticTacToeGateway.sendToRoom(board.id);
            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: board.id } });
      }

      @Post('/add-move')
      @UseGuards(UserGuard)
      @UsePipes(new JoiValidatorPipe(vTTTAddMoveDto))
      async handleOnAddMoveGame(@Req() req: Request, @Body() body: TTTAddMoveDto) {
            const board = await this.getGame(body.roomId);
            if (board.status !== TicTacToeStatus.PLAYING)
                  throw apiResponse.sendError({ details: { errorMessage: { type: 'error.not-allow-action' } } }, 'ForbiddenException');

            if (board.board[body.x][body.y] !== -1) throw apiResponse.sendError({ details: {} }, 'BadRequestException');

            const player = await this.getPlayer(board.id, req.user.id);
            const isAdd = await this.ticTacToeService.addMoveToBoard(board.id, player, body.x, body.y);
            if (!isAdd) throw apiResponse.sendError({ details: { errorMessage: { type: 'error.wrong-turn' } } }, 'BadRequestException');
            const isWin = await this.ticTacToeService.isWin(board.id);
            if (board.isBotMode && !isWin) {
                  const userMove = await this.ticTacToeBotService.findBestMove(board.id, board.users[0]);
                  const botMove = await this.ticTacToeBotService.findBestMove(board.id, board.users[1]);
                  if (userMove.point >= botMove.point) await this.ticTacToeService.addMoveToBoard(board.id, board.users[1], userMove.x, userMove.y);
                  else await this.ticTacToeService.addMoveToBoard(board.id, board.users[1], botMove.x, botMove.y);
                  await this.ticTacToeService.isWin(board.id);
            }

            await this.ticTacToeGateway.sendToRoom(board.id);
            return apiResponse.send<TTTRoomIdDTO>({ data: { roomId: board.id } });
      }
}
