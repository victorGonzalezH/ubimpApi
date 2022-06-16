import { Device } from "@ubd/ubimp.domain/models/devices/device.model";

export interface ISensingCurrentDevice {
    device: Device;
    lastSensingDate: number;
}