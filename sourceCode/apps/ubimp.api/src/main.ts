import { NestFactory } from '@nestjs/core';
// import { WsAdapter } from '@nestjs/platform-ws';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { UbimpApiModule } from './ubimp.api.module';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';

import { join } from 'path';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const httpsOptions = {
    key: fs.readFileSync('./certs/localhost.key'),
    cert: fs.readFileSync('./certs/localhost.pem'),
  };

  const app = await NestFactory.create(UbimpApiModule, {
    httpsOptions
  });

  
  // app.useWebSocketAdapter(new IoAdapter(app));
  const appConfigService = app.get<AppConfigService>(AppConfigService);
  
  //Enabling cookie parser
  app.use(cookieParser());

  app.enableCors({
    origin: 'https://localhost:4200',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Set-Cookie, Access-Control-Allow-Credentials, Allow-Origin-With-Credentials',
    
  });

   
  // app.use((req, res, next) => {
  //     res.header('Access-Control-Allow-Origin', '*');
  //     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  //     next();
  //   });

  

  app.useGlobalPipes(new ValidationPipe( {  disableErrorMessages : appConfigService.getDisableErrorMessages() } ));
  app.connectMicroservice({ transport: appConfigService.getMicroserviceProtocol(), options: {  port: appConfigService.getMicroservicePort() } } );

  //Starting the micorservice
  await app.startAllMicroservicesAsync();
  await app.listen(appConfigService.getApiPort());
}


/**
 * Bootstraping the application
 */
bootstrap();
