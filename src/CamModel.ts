import * as tmImage from "@teachablemachine/image";

const SELECTED_CLASS_PROBABILITY_THRESHOLD = 0.7;

type InitModelAndCam = {
  webcamContainer: HTMLElement;
};

type Prediction = {
  className: string;
  probability: number;
};

export class CamModel {
  isPlaying: boolean = false;
  model: tmImage.CustomMobileNet;
  webcam: tmImage.Webcam;
  classLabels: string[];

  constructor({
    webcam,
    model,
    classLabels,
  }: {
    model: tmImage.CustomMobileNet;
    webcam: tmImage.Webcam;
    classLabels: string[];
  }) {
    this.model = model;
    this.webcam = webcam;
    this.classLabels = classLabels;

    return this;
  }

  static async setup({ webcamContainer }: { webcamContainer: HTMLElement }) {
    const modelURL = "/model.json";
    const metadataURL = "/metadata.json";

    const model = await tmImage.load(modelURL, metadataURL);
    const classLabels = model.getClassLabels();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    const webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();

    webcamContainer.appendChild(webcam.canvas);

    return new CamModel({ webcam, model, classLabels });
  }

  loop = async () => {
    if (this.isPlaying) {
      this.webcam.update();
      await this.predict();
      window.requestAnimationFrame(this.loop);
    }
  };

  play = () => {
    this.isPlaying = true;
    this.loop();
  };

  pause = () => {
    this.isPlaying = false;
  };

  predict = async () => {
    const predictions = await this.model.predict(this.webcam!.canvas);

    const recognized = predictions.some(({ className, probability }) => {
      if (probability >= SELECTED_CLASS_PROBABILITY_THRESHOLD) {
        //console.log("recognized");

        //   const isShowingCorrectAnswer = className === this.classLabels?.[round];
        //   if (isShowingCorrectAnswer) {
        //     console.log("showing correct answer");
        //   }

        return true;
      }
    });

    if (!recognized) {
      console.log("no longer recognized");
    }
  };
}
