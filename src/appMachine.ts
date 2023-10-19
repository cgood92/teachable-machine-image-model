import { assign, createMachine } from "xstate";

import { CamModel } from "./CamModel";

interface AppMachinContext {
  round: number;
  randomArray: string[];
  camModel: CamModel | null;
}

export const appMachine = createMachine(
  {
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
            actions: assign({ camModel: (context, event) => event.data }),
          },
        },
      },
      active: {
        entry: ["playModel"],
        on: { PAUSE: "paused", SCORE: "active", WIN: "win" },
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
  },
);
