import { Injectable } from '@nestjs/common';
import { MongooseOptionsFactory, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class DatabaseConfigService implements MongooseOptionsFactory {
    private host: string;
    private port: string;
    private authdatabaseName: string;
    private databaseName: string;
    private user: string;
    private password: string;
    private environment: string;
    constructor(private configService: ConfigService) {

        this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'development' ;
        switch (this.environment) {

              default:
              case 'development':
              this.host = configService.get<string>('dev.database.host');
              this.authdatabaseName = configService.get<string>('dev.database.authDatabase');
              this.databaseName = configService.get<string>('dev.database.name');
              this.port = configService.get<string>('dev.database.port');
              this.user = configService.get<string>('dev.database.user');
              this.password = configService.get<string>('dev.database.password');
              break;

              case 'production':
              this.host = configService.get<string>('prod.database.host');
              this.authdatabaseName = configService.get<string>('dev.database.authDatabase');
              this.databaseName = configService.get<string>('prod.database.name');
              this.port = configService.get<string>('prod.database.port');
              this.user = configService.get<string>('prod.database.user');
              this.password = configService.get<string>('prod.database.password');
              break;

        }
    }


    /**
     * Genera la cadena de conexion hacia la base de datos / create de database connection string
     * @param host 
     * @param port 
     * @param databaseName 
     * @param user 
     * @param password 
     * @param authDatabase 
     */
    private createConnectionString(host: string, port: string, databaseName: string, user: string, password: string, authDatabase: string): string {

        return 'mongodb://' + user + ':' + password + '@' + host + ':' + port + '/' + databaseName + '?authSource=' + authDatabase;
    }

    createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.createConnectionString(this.host, this.port, this.databaseName, this.user, this.password, this.authdatabaseName),
    };
  }
}


// imports: [ConfigModule],
// useFactory: async (configService: ConfigService) => {
  
//   Logger.log(configService.get<string>('dev.database.host'));
//   Logger.log(configService.get<string>('DATABASE_USER'));
//   return { uri: configService.get<string>('MONGODB_URI') };
// },
// inject: [ConfigService],