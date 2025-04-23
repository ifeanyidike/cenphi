import { CanvasCoordinator } from "./services/CanvasCoordinator";

declare module "react-beautiful-dnd";

declare module "lamejs";

declare global {
  interface Window {
    canvasCoordinator: CanvasCoordinator;
    lamejs: any;
    oggEncoder: any;
  }
}

export {};
