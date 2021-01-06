import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { error } from 'winston';

@Injectable()
export class StartupService {

// private readonly logger = new Logger(StartupService.name);

constructor(private ubimpApplication: UbimpApplicationService, private appConfigService: AppConfigService, private logger: Logger) {

}

// Inicia el servicio 10 segundos despues de que inicia la aplicacion
@Cron(new Date(Date.now() + 10 * 1000))
  async handleCron() {
    this.logger.log('Starting tcp server');
    try 
    {
        const result = (await this.ubimpApplication.RunTcpServer(49371, 8000, 7).toPromise());
        console.log(result);

    } catch (exception) {
        this.logger.error(exception);
    }
}

}
