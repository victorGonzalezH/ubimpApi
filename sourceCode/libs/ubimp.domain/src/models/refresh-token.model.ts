import { UbimpBase } from "./ubimp-base.model";

export class RefreshToken extends UbimpBase {

    /**
     * Date when the refresh token is revoked
     */
    public revokedDate: Date;
    
    /**
     * IP who revokes the token
     */
    public revokedByIp: string;
    
    /**
     * Refresh token who revokes the token
     */
    public replacedByToken: string;

    
    public isValid: boolean;

    
    public isExpired: boolean;

    constructor(public userId: string, public token: string, public expires: Date, public createdByIp: string ) {
        super();
        this.revokedDate = null;
    }
}