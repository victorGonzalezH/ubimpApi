import { Socket } from "socket.io";
import { Device } from "./device.model";


export interface AuthenticatedUser {

    username: string;

    id: string;

    socketClient?: Socket;

    loginCount: number;

    devices: Device[];
}