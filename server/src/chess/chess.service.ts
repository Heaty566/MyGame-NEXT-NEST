import { Injectable } from '@nestjs/common';
import { ChessCommonService } from './chessCommon.service';
import { ChessMoveRedis, ChessMoveCoordinates, ChessRole, PlayerFlagEnum, ChessFlag, ChessStatus } from './entity/chess.interface';
import { ChessBoard } from './entity/chessBoard.entity';
import { ChessMove } from './entity/chessMove.entity';
import { ChessMoveRepository } from './entity/chessMove.repository';

//---- Repository

@Injectable()
export class ChessService {
      constructor(private readonly chessCommonService: ChessCommonService) {}

      private async pawnAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            // pawn can not appear on row 0 or 7
            if (currentPosition.y === 0 || currentPosition.y === 7) return result;
            if (chessBoard.board[currentPosition.x][currentPosition.y].flag === PlayerFlagEnum.WHITE) {
                  const x = currentPosition.x;
                  const y = currentPosition.y;
                  // in the first move, pawn can move forward 2 square
                  if (y === 1 && chessBoard.board[x][y + 1].flag === PlayerFlagEnum.EMPTY && chessBoard.board[x][y + 2].flag === PlayerFlagEnum.EMPTY)
                        result.push({ x: x, y: y + 2 });

                  // move forward 1 square
                  if (y + 1 <= 7 && chessBoard.board[x][y + 1].flag === PlayerFlagEnum.EMPTY) result.push({ x: x, y: y + 1 });

                  // eat opposite color piece
                  if (
                        x - 1 >= 0 &&
                        y + 1 <= 7 &&
                        chessBoard.board[x - 1][y + 1].flag >= 0 &&
                        chessBoard.board[x - 1][y + 1].flag !== PlayerFlagEnum.WHITE
                  )
                        result.push({ x: x - 1, y: y + 1 });

                  if (
                        x + 1 <= 7 &&
                        y + 1 <= 7 &&
                        chessBoard.board[x + 1][y + 1].flag >= 0 &&
                        chessBoard.board[x + 1][y + 1].flag !== PlayerFlagEnum.WHITE
                  )
                        result.push({ x: x + 1, y: y + 1 });
            } else if (chessBoard.board[currentPosition.x][currentPosition.y].flag === PlayerFlagEnum.BLACK) {
                  const x = currentPosition.x;
                  const y = currentPosition.y;

                  if (y === 6 && chessBoard.board[x][y - 1].flag === PlayerFlagEnum.EMPTY && chessBoard.board[x][y - 2].flag === PlayerFlagEnum.EMPTY)
                        result.push({ x: x, y: y - 2 });

                  if (y - 1 >= 0 && chessBoard.board[x][y - 1].flag === PlayerFlagEnum.EMPTY) result.push({ x: x, y: y - 1 });

                  if (
                        x - 1 >= 0 &&
                        y - 1 >= 0 &&
                        chessBoard.board[x - 1][y - 1].flag >= 0 &&
                        chessBoard.board[x - 1][y - 1].flag !== PlayerFlagEnum.BLACK
                  )
                        result.push({ x: x - 1, y: y - 1 });

                  if (
                        x + 1 <= 7 &&
                        y - 1 >= 0 &&
                        chessBoard.board[x + 1][y - 1].flag >= 0 &&
                        chessBoard.board[x + 1][y - 1].flag !== PlayerFlagEnum.BLACK
                  )
                        result.push({ x: x + 1, y: y - 1 });
            }
            return result;
      }

      private async kingAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            const kingMoveX = [1, 1, 1, 0, 0, -1, -1, -1];
            const kingMoveY = [1, 0, -1, 1, -1, 1, 0, -1];

            for (let i = 0; i <= 7; i++) {
                  const x = currentPosition.x + kingMoveX[i];
                  const y = currentPosition.y + kingMoveY[i];

                  if (
                        x >= 0 &&
                        x < chessBoard.board.length &&
                        y >= 0 &&
                        y < chessBoard.board.length &&
                        chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag
                  ) {
                        result.push({ x: x, y: y });
                  }
            }
            return result;
      }

      private async knightAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            const knightMoveX = [2, 2, -2, -2, 1, 1, -1, -1];
            const knightMoveY = [1, -1, 1, -1, 2, -2, 2, -2];
            for (let i = 0; i <= 7; i++) {
                  const x = currentPosition.x + knightMoveX[i];
                  const y = currentPosition.y + knightMoveY[i];

                  if (
                        x >= 0 &&
                        x < chessBoard.board.length &&
                        y >= 0 &&
                        y < chessBoard.board.length &&
                        chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag
                  ) {
                        result.push({ x: x, y: y });
                  }
            }
            return result;
      }

      private async rookAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            // Right
            let x = currentPosition.x + 1;
            let y = currentPosition.y;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x++;
            }

            // Left
            x = currentPosition.x - 1;
            y = currentPosition.y;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x--;
            }

            // Top
            x = currentPosition.x;
            y = currentPosition.y + 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  y++;
            }

            // Bottom
            x = currentPosition.x;
            y = currentPosition.y - 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  y--;
            }

            return result;
      }

      private async bishopAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            // Top - Left
            let x = currentPosition.x - 1;
            let y = currentPosition.y + 1;

            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x--;
                  y++;
            }

            // Top - Right
            x = currentPosition.x + 1;
            y = currentPosition.y + 1;

            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x++;
                  y++;
            }

            // Bottom - Right
            x = currentPosition.x + 1;
            y = currentPosition.y - 1;

            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x++;
                  y--;
            }

            // Bottom - Left
            x = currentPosition.x - 1;
            y = currentPosition.y - 1;

            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag === chessBoard.board[currentPosition.x][currentPosition.y].flag) break;

                  if (chessBoard.board[x][y].flag !== chessBoard.board[currentPosition.x][currentPosition.y].flag) {
                        result.push({ x: x, y: y });
                        if (chessBoard.board[x][y].flag >= 0) break;
                  }

                  x--;
                  y--;
            }

            return result;
      }

      private async queenAvailableMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const result: Array<ChessMoveCoordinates> = [];
            const moveLikeBishop = await this.bishopAvailableMove(currentPosition, chessBoard.id);
            const moveLikeRook = await this.rookAvailableMove(currentPosition, chessBoard.id);
            result.push(...moveLikeBishop);
            result.push(...moveLikeRook);

            return result;
      }

      private async getKing(flag: PlayerFlagEnum, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);

            for (let i = 0; i <= 7; i++) {
                  for (let j = 0; j <= 7; j++) {
                        if (chessBoard.board[i][j].flag === flag && chessBoard.board[i][j].chessRole === ChessRole.KING) {
                              return {
                                    x: i,
                                    y: j,
                                    flag: chessBoard.board[i][j].flag,
                                    chessRole: ChessRole.KING,
                              };
                        }
                  }
            }

            return null;
      }

      private async kingIsChecked(currentPosition: ChessMoveRedis, boardId: string): Promise<boolean> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);

            // Check rook, queen
            // Right
            let x = currentPosition.x + 1;
            let y = currentPosition.y;

            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.ROOK || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x++;
            }
            // Left
            x = currentPosition.x - 1;
            y = currentPosition.y;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.ROOK || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x--;
            }
            // Top
            x = currentPosition.x;
            y = currentPosition.y + 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.ROOK || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  y++;
            }
            // Bottom
            x = currentPosition.x;
            y = currentPosition.y - 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.ROOK || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  y--;
            }

            // Check bishop, queen
            // Top - left
            x = currentPosition.x - 1;
            y = currentPosition.y + 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.BISHOP || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x--;
                  y++;
            }
            // Top - right
            x = currentPosition.x + 1;
            y = currentPosition.y + 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.BISHOP || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x++;
                  y++;
            }
            // Bottom - right
            x = currentPosition.x + 1;
            y = currentPosition.y - 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.BISHOP || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x++;
                  y--;
            }
            // Bottom - left
            x = currentPosition.x - 1;
            y = currentPosition.y - 1;
            while (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                  if (chessBoard.board[x][y].flag !== PlayerFlagEnum.EMPTY) {
                        if (
                              chessBoard.board[x][y].flag !== currentPosition.flag &&
                              (chessBoard.board[x][y].chessRole === ChessRole.BISHOP || chessBoard.board[x][y].chessRole === ChessRole.QUEEN)
                        )
                              return true;

                        break;
                  }

                  x--;
                  y--;
            }

            // Check knight
            const knightX = [2, 2, -2, -2, 1, 1, -1, -1];
            const knightY = [1, -1, 1, -1, 2, -2, 2, -2];
            for (let i = 0; i <= 7; i++) {
                  x = currentPosition.x + knightX[i];
                  y = currentPosition.y + knightY[i];
                  if (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                        if (
                              chessBoard.board[x][y].flag >= 0 &&
                              chessBoard.board[x][y].flag != currentPosition.flag &&
                              chessBoard.board[x][y].chessRole === ChessRole.KNIGHT
                        ) {
                              return true;
                        }
                  }
            }

            // Check pawn
            if (currentPosition.flag === 0) {
                  // white king
                  const pawnX = [1, -1];
                  const pawnY = [1, 1];
                  for (let i = 0; i <= 1; i++) {
                        x = currentPosition.x + pawnX[i];
                        y = currentPosition.y + pawnY[i];
                        if (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                              if (
                                    chessBoard.board[x][y].flag >= 0 &&
                                    chessBoard.board[x][y].flag != currentPosition.flag &&
                                    chessBoard.board[x][y].chessRole === ChessRole.PAWN
                              ) {
                                    return true;
                              }
                        }
                  }
            } else {
                  // black king
                  const pawnX = [1, -1];
                  const pawnY = [-1, -1];
                  for (let i = 0; i <= 1; i++) {
                        x = currentPosition.x + pawnX[i];
                        y = currentPosition.y + pawnY[i];
                        if (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                              if (
                                    chessBoard.board[x][y].flag >= 0 &&
                                    chessBoard.board[x][y].flag != currentPosition.flag &&
                                    chessBoard.board[x][y].chessRole === ChessRole.PAWN
                              ) {
                                    return true;
                              }
                        }
                  }
            }

            // Check king
            const kingX = [1, 1, 1, 0, 0, -1, -1, -1];
            const kingY = [1, 0, -1, 1, -1, 1, 0, -1];
            for (let i = 0; i <= 7; i++) {
                  x = currentPosition.x + kingX[i];
                  y = currentPosition.y + kingY[i];
                  if (x >= 0 && x < chessBoard.board.length && y >= 0 && y < chessBoard.board.length) {
                        if (
                              chessBoard.board[x][y].flag >= 0 &&
                              chessBoard.board[x][y].flag != currentPosition.flag &&
                              chessBoard.board[x][y].chessRole === ChessRole.KING
                        ) {
                              return true;
                        }
                  }
            }
            return false;
      }

      async canMove(curPos: ChessMoveCoordinates, desPos: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);

            const kingColor = chessBoard.board[curPos.x][curPos.y].flag;
            const tmpDestinationPosition: ChessFlag = {
                  flag: chessBoard.board[desPos.x][desPos.y].flag,
                  chessRole: chessBoard.board[desPos.x][desPos.y].chessRole,
            };

            let canMove = true;
            chessBoard.board[desPos.x][desPos.y] = chessBoard.board[curPos.x][curPos.y];

            chessBoard.board[curPos.x][curPos.y] = {
                  flag: PlayerFlagEnum.EMPTY,
                  chessRole: ChessRole.EMPTY,
            };

            await this.chessCommonService.setBoard(chessBoard);

            const kingPosition: ChessMoveRedis = await this.getKing(kingColor, chessBoard.id);
            if (await this.kingIsChecked(kingPosition, chessBoard.id)) canMove = false;

            chessBoard.board[curPos.x][curPos.y] = chessBoard.board[desPos.x][desPos.y];

            chessBoard.board[desPos.x][desPos.y] = {
                  flag: tmpDestinationPosition.flag,
                  chessRole: tmpDestinationPosition.chessRole,
            };

            await this.chessCommonService.setBoard(chessBoard);

            return canMove;
      }

      private async chessRoleLegalMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            let availableMove: Array<ChessMoveCoordinates>;

            const role = chessBoard.board[currentPosition.x][currentPosition.y].chessRole;

            switch (role) {
                  case ChessRole.BISHOP: {
                        availableMove = await this.bishopAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.ROOK: {
                        availableMove = await this.rookAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.QUEEN: {
                        availableMove = await this.queenAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.KNIGHT: {
                        availableMove = await this.knightAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.PAWN: {
                        availableMove = await this.pawnAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.KING: {
                        availableMove = await this.kingAvailableMove(currentPosition, chessBoard.id);
                        break;
                  }
                  case ChessRole.EMPTY: {
                        availableMove = [];
                        break;
                  }
            }

            const legalMove: Array<ChessMoveCoordinates> = [];

            for (const move of availableMove) {
                  if (await this.canMove(currentPosition, move, chessBoard.id)) legalMove.push(move);
            }

            return legalMove;
      }

      async legalMove(currentPosition: ChessMoveCoordinates, boardId: string) {
            return await this.chessRoleLegalMove(currentPosition, boardId);
      }

      async checkmate(flag: 0 | 1, boardId: string): Promise<boolean> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const kingPosition: ChessMoveRedis = await this.getKing(flag, chessBoard.id);
            if (!(await this.kingIsChecked(kingPosition, chessBoard.id))) return false;

            for (let i = 0; i <= 7; i++) {
                  for (let j = 0; j <= 7; j++) {
                        if (chessBoard.board[i][j].flag === flag) {
                              const legalMove: Array<ChessMoveCoordinates> = await this.legalMove({ x: i, y: j }, chessBoard.id);
                              if (legalMove.length > 0) return false;
                        }
                  }
            }
            chessBoard.winner = 1 - flag;
            chessBoard.status = ChessStatus.END;
            const eloCalculator = this.chessCommonService.calculateElo(chessBoard.winner, chessBoard.users[0], chessBoard.users[1]);
            chessBoard.users[0].elo += eloCalculator.whiteElo;
            chessBoard.users[1].elo += eloCalculator.blackElo;
            chessBoard.elo = [eloCalculator.blackElo, eloCalculator.whiteElo];
            await this.chessCommonService.setBoard(chessBoard);
            await this.chessCommonService.saveChessFromCacheToDb(chessBoard.id);
            return true;
      }

      async stalemate(flag: 0 | 1, boardId: string): Promise<boolean> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const kingPosition: ChessMoveRedis = await this.getKing(flag, chessBoard.id);
            if (await this.kingIsChecked(kingPosition, chessBoard.id)) return false;

            for (let i = 0; i <= 7; i++) {
                  for (let j = 0; j <= 7; j++) {
                        if (chessBoard.board[i][j].flag === flag) {
                              const legalMove: Array<ChessMoveCoordinates> = await this.legalMove({ x: i, y: j }, chessBoard.id);
                              if (legalMove.length > 0) return false;
                        }
                  }
            }
            chessBoard.winner = -1;
            chessBoard.status = ChessStatus.END;
            const eloCalculator = this.chessCommonService.calculateElo(chessBoard.winner, chessBoard.users[0], chessBoard.users[1]);
            chessBoard.users[0].elo += eloCalculator.whiteElo;

            chessBoard.users[1].elo += eloCalculator.blackElo;
            chessBoard.elo = [eloCalculator.blackElo, eloCalculator.whiteElo];
            await this.chessCommonService.setBoard(chessBoard);
            await this.chessCommonService.saveChessFromCacheToDb(chessBoard.id);
            return true;
      }

      async playAMove(curPos: ChessMoveCoordinates, desPos: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            const newChessMove = new ChessMove();
            newChessMove.fromX = curPos.x;
            newChessMove.fromY = curPos.y;
            newChessMove.toX = desPos.x;
            newChessMove.toY = desPos.y;
            newChessMove.flag = chessBoard.board[curPos.x][curPos.y].flag;
            newChessMove.chessRole = chessBoard.board[curPos.x][curPos.y].chessRole;

            chessBoard.board[desPos.x][desPos.y] = chessBoard.board[curPos.x][curPos.y];

            chessBoard.board[curPos.x][curPos.y] = {
                  flag: -1,
                  chessRole: ChessRole.EMPTY,
            };
            chessBoard.turn = !chessBoard.turn;
            const currentTime = new Date();
            const stepTime = currentTime.getTime() - new Date(chessBoard.lastStep).getTime();
            chessBoard.users[newChessMove.flag].time -= stepTime;
            chessBoard.lastStep = currentTime;
            chessBoard.moves.push(newChessMove);
            await this.chessCommonService.setBoard(chessBoard);
      }

      async isPromotePawn(desPos: ChessMoveCoordinates, boardId: string): Promise<boolean> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            if (chessBoard.board[desPos.x][desPos.y].chessRole !== ChessRole.PAWN) return false;
            if (chessBoard.board[desPos.x][desPos.y].flag === PlayerFlagEnum.WHITE && desPos.y === 7) return true;
            if (chessBoard.board[desPos.x][desPos.y].flag === PlayerFlagEnum.BLACK && desPos.y === 0) return true;
            return false;
      }

      async enPassantPos(curPos: ChessMoveCoordinates, desPos: ChessMoveCoordinates, boardId: string): Promise<ChessMoveCoordinates> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            if (chessBoard.board[desPos.x][desPos.y].chessRole !== ChessRole.PAWN) return null;

            if (chessBoard.board[desPos.x][desPos.y].flag === PlayerFlagEnum.WHITE && curPos.y === 1 && desPos.y === 3)
                  return { x: desPos.x, y: desPos.y - 1 };

            if (chessBoard.board[desPos.x][desPos.y].flag === PlayerFlagEnum.BLACK && curPos.y === 6 && desPos.y === 4)
                  return { x: desPos.x, y: desPos.y + 1 };

            return null;
      }

      async isEnPassantMove(desPos: ChessMoveCoordinates, enPassantPos: ChessMoveCoordinates, boardId: string): Promise<boolean> {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            if (chessBoard.board[desPos.x][desPos.y].chessRole !== ChessRole.PAWN) return false;
            if (desPos.x === enPassantPos.x && desPos.y === enPassantPos.y) return true;
            return false;
      }

      async enPassant(curPos: ChessMoveCoordinates, desPos: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            if (chessBoard.enPassantPos && (await this.isEnPassantMove(desPos, chessBoard.enPassantPos, chessBoard.id))) {
                  return chessBoard.enPassantPos;
            }

            chessBoard.enPassantPos = null;

            // check en passant conditions
            const enPassantPos = await this.enPassantPos(curPos, desPos, chessBoard.id);
            if (enPassantPos) chessBoard.enPassantPos = enPassantPos;

            await this.chessCommonService.setBoard(chessBoard);
            return null;
      }

      async enPassantMove(enPassantPos: ChessMoveCoordinates, boardId: string) {
            const chessBoard = await this.chessCommonService.getBoard(boardId);
            if (chessBoard.board[enPassantPos.x][enPassantPos.y].flag === PlayerFlagEnum.WHITE) {
                  chessBoard.board[enPassantPos.x][enPassantPos.y - 1] = {
                        flag: PlayerFlagEnum.EMPTY,
                        chessRole: ChessRole.EMPTY,
                  };
            } else if (chessBoard.board[enPassantPos.x][enPassantPos.y].flag === PlayerFlagEnum.BLACK) {
                  chessBoard.board[enPassantPos.x][enPassantPos.y + 1] = {
                        flag: PlayerFlagEnum.EMPTY,
                        chessRole: ChessRole.EMPTY,
                  };
            }
            await this.chessCommonService.setBoard(chessBoard);
      }
}
