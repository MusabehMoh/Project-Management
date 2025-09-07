import { config } from "../config/index.js";

export const mockDelayHandler = async (): Promise<void> => {
  if (!config.mock.enableDelays) {
    return;
  }

  const delay =
    Math.random() * (config.mock.delayMax - config.mock.delayMin) +
    config.mock.delayMin;

  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};
