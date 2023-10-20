import { assign, createMachine, send } from "xstate";

import { CamModel } from "./CamModel";

interface AppMachinContext {
  round: number;
  randomArray: string[];
  camModel: CamModel | null;
}

export const appMachine = createMachine(
  {
    predictableActionArguments: true,
    id: "app",
    initial: "uninitialized",
    schema: {
      context: {} as AppMachinContext,
    },
    context: {
      round: 0,
      randomArray: [],
      camModel: null,
    },
    states: {
      uninitialized: {
        on: { INIT: "initializaing" },
      },
      initializaing: {
        invoke: {
          id: "load-model",
          src: (context, event) =>
            CamModel.setup({ webcamContainer: event.webcamContainer }),
          onDone: {
            target: "active",
            actions: assign({
              camModel: (context, event) => event.data,
              randomArray: (context, event) => event.data.getClassLabels(),
            }),
          },
        },
      },
      active: {
        entry: ["playModel"],
        on: {
          PAUSE: "paused",
          SCORE: [
            {
              target: "win",
              cond: "gameWon",
            },
            {
              actions: assign({
                round: (context) => context.round + 1,
              }),
            },
          ],
          WIN: "win",
        },
        invoke: {
          id: "listen-for-identifiers",
          src: (context, event) => (callback, onReceive) => {
            let currentRound = context.round;

            context.camModel?.onIdentify((className) => {
              const target = context.randomArray[currentRound];
              if (className === target) {
                callback("SCORE");
                currentRound++;
              }
            });

            return () => context.camModel?.onIdentify(null);
          },
        },
      },
      paused: {
        entry: ["pauseModel"],
        on: {
          PLAY: "active",
        },
      },
      win: {},
    },
  },
  {
    actions: {
      playModel: (context, event) => {
        context.camModel!.play();
      },
      pauseModel: (context, event) => {
        context.camModel!.pause();
      },
    },
    guards: {
      gameWon: (context, event) =>
        context.round + 1 >= context.randomArray.length,
    },
  },
);
