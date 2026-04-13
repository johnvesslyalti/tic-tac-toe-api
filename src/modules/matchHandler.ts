import * as logic from "./logic";
import * as validation from "./validation";

/**
 * Tic-Tac-Toe Nakama Match Handler (TypeScript)
 */

const OpCode = {
  MOVE: 1,
  UPDATE: 2,
  REJECTED: 3,
};

export function matchInit(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: { [key: string]: string },
): { state: logic.GameState; tickRate: number; label: string } {
  logger.info("Tic-Tac-Toe match initialized");
  return {
    state: logic.createInitialState(),
    tickRate: 10,
    label: "tic-tac-toe",
  };
}

export function matchJoinAttempt(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  presence: nkruntime.Presence,
  metadata: { [key: string]: any },
): { state: logic.GameState; accept: boolean; rejectMessage?: string } {
  const playerCount = Object.keys(state.players).length;
  if (playerCount >= 2) {
    return {
      state,
      accept: false,
      rejectMessage: "Match already full",
    };
  }
  return {
    state,
    accept: true,
  };
}

export function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  presences: nkruntime.Presence[],
): { state: logic.GameState } {
  presences.forEach((presence) => {
    const playerCount = Object.keys(state.players).length;
    const symbol = playerCount === 0 ? "X" : "O";

    state.players[presence.userId] = symbol;
    state.presences[presence.userId] = presence;

    logger.info("Player %s joined as %s", presence.userId, symbol);

    if (Object.keys(state.players).length === 2) {
      state.gameStarted = true;
      (nk as any).matchLabelUpdate(
        ctx.matchId,
        JSON.stringify({ status: "in_progress", turn: state.currentPlayer }),
      );
      logger.info("Match started: Player X vs Player O");
    } else {
      (nk as any).matchLabelUpdate(ctx.matchId, JSON.stringify({ status: "waiting" }));
    }
  });

  dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(state));

  return { state };
}

export function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  messages: nkruntime.MatchMessage[],
): { state: logic.GameState } | null {
  messages.forEach((message) => {
    if (message.opCode === OpCode.MOVE) {
      let data: { index: number };
      try {
        data = JSON.parse(nk.binaryToString(message.data));
      } catch (e: any) {
        logger.error("Failed to parse message data: %s", e.message);
        return;
      }

      const moveIndex = data.index;
      const userId = message.sender.userId;

      logger.debug("Received move from user %s: index %d", userId, moveIndex);

      const validationResult = validation.isValidMove(state, moveIndex, userId);

      if (validationResult.valid) {
        const newState = logic.makeMove(state, moveIndex);
        Object.assign(state, newState);

        logger.info(
          "Move accepted from %s at %d. Winner: %s",
          userId,
          moveIndex,
          state.winner,
        );

        if (state.winner) {
          state.endTicks = 100; // Wait 100 ticks (~10 seconds at 10 tickRate) before terminating
          (nk as any).matchLabelUpdate(
            ctx.matchId,
            JSON.stringify({ status: "finished", winner: state.winner }),
          );
        } else {
          (nk as any).matchLabelUpdate(
            ctx.matchId,
            JSON.stringify({
              status: "in_progress",
              turn: state.currentPlayer,
            }),
          );
        }

        dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(state));
      } else {
        logger.warn(
          "Invalid move from user %s: %s",
          userId,
          validationResult.reason,
        );
        dispatcher.broadcastMessage(
          OpCode.REJECTED,
          JSON.stringify({ reason: validationResult.reason }),
          [message.sender],
        );
      }
    }
  });

  if (state.winner) {
    if (state.endTicks > 0) {
      state.endTicks--;
      return { state };
    }
    return null; // Terminate match after grace period
  }

  return { state };
}

export function matchLeave(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  presences: nkruntime.Presence[],
): { state: logic.GameState } {
  presences.forEach((presence) => {
    logger.info("Player %s left the match", presence.userId);

    if (!state.winner) {
      const leavingSymbol = state.players[presence.userId];
      const remainingSymbol = leavingSymbol === "X" ? "O" : "X";

      state.winner = remainingSymbol;
      logger.info(
        "Player %s left. Remaining player %s wins.",
        presence.userId,
        remainingSymbol,
      );

      dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(state));
    }

    delete state.players[presence.userId];
    delete state.presences[presence.userId];
  });

  return { state };
}

export function matchTerminate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  graceSeconds: number,
): { state: logic.GameState } {
  logger.info("Match terminating");
  return { state };
}

export function matchSignal(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: logic.GameState,
  data: string,
): { state: logic.GameState; result: string } {
  return { state, result: data };
}
