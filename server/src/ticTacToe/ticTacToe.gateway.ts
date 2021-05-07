import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, SocketExtend } from 'socket.io';

//---- Pipe
import { SocketJoiValidatorPipe } from '../utils/validator/socketValidator.pipe';

//---- Service
import { UserSocketGuard } from '../auth/authSocket.guard';
import { TicTacToeCommonService } from './ticTacToeCommon.service';

//---- Entity

//---- Dto
import { RoomIdDTO, vRoomIdDto } from './dto/roomIdDto';

//---- Common
import { ioResponse } from '../app/interface/socketResponse';
import { TTTGatewayAction } from './ticTacToeGateway.action';

@WebSocketGateway({ namespace: 'tic-tac-toe' })
export class TicTacToeGateway {
      constructor(private readonly ticTacToeCommonService: TicTacToeCommonService) {}

      @WebSocketServer()
      server: Server;

      socketServer = () => ioResponse.getSocketServer(this.server);

      private async isExistUser(boardId: string, userId: string) {
            const getUser = await this.ticTacToeCommonService.isExistUser(boardId, userId);
            if (!getUser) throw ioResponse.sendError({ details: { errorMessage: { type: 'error.not-allow-action' } } }, 'UnauthorizedException');
      }

      async sendToRoom(boardId: string) {
            const board = await this.ticTacToeCommonService.getBoard(boardId);
            return this.socketServer().socketEmitToRoom(TTTGatewayAction.TTT_GET, boardId, { data: board }, 'ttt');
      }

      async restartGame(boardId: string, newBoardId: string) {
            const board = await this.ticTacToeCommonService.getBoard(newBoardId);

            return this.socketServer().socketEmitToRoom(TTTGatewayAction.TTT_RESTART, boardId, { data: board }, 'ttt');
      }

      private async getGameFromCache(roomId: string) {
            const game = await this.ticTacToeCommonService.getBoard(roomId);
            if (!game) throw ioResponse.sendError({ details: { roomId: { type: 'field.not-found' } } }, 'NotFoundException');

            return game;
      }

      @UseGuards(UserSocketGuard)
      @SubscribeMessage(TTTGatewayAction.TTT_JOIN)
      async handleJoinMatch(@ConnectedSocket() client: SocketExtend, @MessageBody(new SocketJoiValidatorPipe(vRoomIdDto)) body: RoomIdDTO) {
            const getCacheGame = await this.getGameFromCache(body.roomId);
            await this.isExistUser(body.roomId, client.user.id);
            await client.join(`ttt-${getCacheGame.id}`);

            return this.socketServer().socketEmitToRoom<RoomIdDTO>(TTTGatewayAction.TTT_JOIN, getCacheGame.id, {}, 'ttt');
      }

      @UseGuards(UserSocketGuard)
      @SubscribeMessage(TTTGatewayAction.TTT_GET)
      async handleGetGame(@MessageBody(new SocketJoiValidatorPipe(vRoomIdDto)) body: RoomIdDTO) {
            const getCacheGame = await this.getGameFromCache(body.roomId);

            return this.socketServer().socketEmitToRoom(TTTGatewayAction.TTT_GET, getCacheGame.id, { data: getCacheGame }, 'ttt');
      }
}
