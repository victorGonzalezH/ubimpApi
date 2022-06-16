import { Socket } from "socket.io";
import { ITrackingLocation } from "./itracking-location.model";

export interface ISocketLocation {
    location: ITrackingLocation;
    socket: Socket;
}