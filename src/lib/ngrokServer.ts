import * as ngrok from "@ngrok/ngrok";
import { Config } from "../models/config";
ngrok.consoleLog();

export function startNgrok(config: Config):Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      (async() => {
        const session = await ngrok.forward({addr: config.httpServerPort, authtoken: config.ngrokAuthToken, domain: config.ngrokDomain});
        console.log("Ngrok tunnel established at:", session.url());
        resolve();
      })();

      process.stdin.resume();
    } catch (error) {
      reject(error);
    }
  });
}

export function stopNgrok(): Promise<void> {
  return new Promise((resolve) => {
      ngrok.disconnect();
      resolve();
  });
} 
