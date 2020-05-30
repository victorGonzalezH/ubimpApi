import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { ITrackingLocation } from './dataTransferObjects/socketio/itrackingLocation.model';

@Injectable()
export class UbimpApplicationService {

    /**
     * 
     */
    private socketioEmitterSubject: Subject<ITrackingLocation>;

    /**
     * 
     */
    get socketioEmitter(): Observable<ITrackingLocation> {
        return this.socketioEmitterSubject.asObservable();
    }

    constructor() {
        this.socketioEmitterSubject = new Subject<ITrackingLocation>();
    }

    /**
     * 
     * @param rawData 
     */
    public recieveTcpData(rawData: any) {
        
    }

}
