import { useRouter } from 'next/router';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { chessApi } from '../../api/chessApi';
import { RootState } from '../../store';
import { ServerResponse } from '../interface/api.interface';
import { ChessGatewayAction, ChessBoard, ChessPlayer, ChessStatus, ChessMoveRedis, ChessFlag } from '../interface/chess.interface';
import { AuthState } from '../interface/user.interface';
import useSocketIo from './useSocketIo';
import routers from '../constants/router';

export function useGameChess(
    roomId: string,
): [
    ChessBoard | undefined,
    ChessPlayer[] | undefined,
    ChessMoveRedis[],
    React.RefObject<HTMLDivElement>,
    () => void,
    () => void,
    (x: number, y: number) => void,

    () => void,
] {
    const clientIoChess = useSocketIo({ namespace: 'chess' });
    const router = useRouter();
    const chessBoardRef = React.useRef<HTMLDivElement>(null);
    const [tttBoard, setTTTBoard] = React.useState<ChessBoard>();
    const [players, setPlayers] = React.useState<ChessPlayer[]>([]);
    const authState = useSelector<RootState, AuthState>((state) => state.auth);
    const [suggestion, setSuggestion] = React.useState<ChessMoveRedis[]>([]);
    const [currentSelect, setCurrentSelect] = React.useState<ChessMoveRedis>();
    const [currentPlayer, setCurrentPlayer] = React.useState<ChessPlayer>();

    const handleOnRestart = () => {
        if (tttBoard) {
            if (tttBoard.isBotMode)
                chessApi.createNewBotRoom().then((res) => {
                    const roomId = res.data.data.roomId;
                    router.push(`${routers.ticTacToePvP.link}/${roomId}`);
                });
            else chessApi.restartGame({ roomId });
        }
    };
    const handleOnStart = () => {
        chessApi
            .startGame({ roomId })
            .then(() => {
                if (chessBoardRef.current) {
                    const clientWidth = chessBoardRef.current.clientWidth / 2;
                    const scrollCenter = chessBoardRef.current.scrollWidth / 2 - clientWidth;
                    chessBoardRef.current.scrollLeft = scrollCenter;
                }
            })
            .catch(() => router.push(routers[404].link));
    };

    const handleOnAddMove = (x: number, y: number) => {
        if (tttBoard) {
            const findMove = suggestion.find((item) => item.x === x && item.y === y);

            if (findMove && currentSelect) {
                chessApi.addMovePvP({ roomId, curPos: { x: currentSelect.x, y: currentSelect.y }, desPos: { x, y } }).then(() => {
                    const sound = new Audio('/asset/sounds/ttt-click.mp3');
                    sound.volume = 0.5;
                    sound.play();
                    setSuggestion([]);
                    setCurrentSelect(undefined);
                });
            } else if (!currentSelect || currentSelect.x !== x || currentSelect.y !== y) {
                setCurrentSelect({
                    chessRole: tttBoard.board[x][y].chessRole,
                    flag: tttBoard.board[x][y].flag,
                    x,
                    y,
                });
                chessApi
                    .getSuggestion({ roomId, x, y })
                    .then((res) => {
                        setSuggestion(res.data.data);
                    })
                    .catch(() => {
                        setSuggestion([]);
                    });
            }
        }
        console.log(currentSelect);
    };

    const handleOnReady = () => {
        chessApi.readyGame({ roomId });
    };

    const emitTTTGet = () => clientIoChess.emit(ChessGatewayAction.CHESS_GET, { roomId });
    const emitTTTCounter = () => clientIoChess.emit(ChessGatewayAction.CHESS_COUNTER, { roomId });

    const onRestartGame = (res: ServerResponse<ChessBoard>) => router.push(`${routers.chessPvP.link}/${res.data.id}`);
    const onTTTGet = (res: ServerResponse<ChessBoard>) => {
        setTTTBoard(res.data);

        const player = res.data.users.find((item) => item.id === authState.id);
        if (player) setCurrentPlayer(player);
    };
    const onTTTCounter = (res: ServerResponse<ChessPlayer[]>) => setPlayers(res.data);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        if (tttBoard?.status === ChessStatus.PLAYING) {
            interval = setInterval(() => emitTTTCounter(), 1000);
        }

        return () => {
            clearInterval(interval);
        };
    }, [tttBoard?.status, roomId]);

    React.useEffect(() => {
        if (tttBoard && tttBoard.status === ChessStatus.END) {
            const sound = new Audio('/asset/sounds/end-game.mp3');
            sound.volume = 0.5;
            sound.play();
        }
    }, [tttBoard?.status]);

    React.useEffect(() => {
        if (roomId && authState.isSocketLogin)
            chessApi
                .joinRoom({ roomId })
                .then(() => clientIoChess.emit(ChessGatewayAction.CHESS_JOIN, { roomId }))
                .catch(() => router.push(routers[404].link));
    }, [authState.isSocketLogin, roomId]);

    React.useEffect(() => {
        return () => {
            chessApi.leaveGame({ roomId });
        };
    }, [roomId]);

    React.useEffect(() => {
        clientIoChess.on(ChessGatewayAction.CHESS_GET, onTTTGet);
        clientIoChess.on(ChessGatewayAction.CHESS_JOIN, emitTTTGet);
        clientIoChess.on(ChessGatewayAction.CHESS_COUNTER, onTTTCounter);
        clientIoChess.on(ChessGatewayAction.CHESS_RESTART, onRestartGame);

        return () => {
            clientIoChess.off(ChessGatewayAction.CHESS_RESTART, onRestartGame);
            clientIoChess.off(ChessGatewayAction.CHESS_COUNTER, onTTTCounter);
            clientIoChess.off(ChessGatewayAction.CHESS_GET, onTTTGet);
            clientIoChess.off(ChessGatewayAction.CHESS_JOIN, emitTTTGet);
        };
    }, [roomId]);

    return [tttBoard, players, suggestion, chessBoardRef, handleOnReady, handleOnStart, handleOnAddMove, handleOnRestart];
}

export default useGameChess;