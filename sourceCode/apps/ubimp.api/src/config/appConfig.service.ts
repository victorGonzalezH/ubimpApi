import { Injectable } from '@nestjs/common';


@Injectable()
export class AppConfigService {

    private environment: string;

    constructor() {
        this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'development' ;

    }

    /**
     * Obtiene el ambiente de ejecucion
     */
    public getEnvironment() {
        return this.environment;
    }

}
