import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subject, Observable } from 'rxjs';
import { UbimpApplicationService } from 'uba/ubimp.application';

@WebSocketGateway({
   
  handlePreflightRequest: (request, response) => {
  response.writeHead(200, 
    {
      "Access-Control-Allow-Origin": 'http://localhost:4200', //<-- NO se debe de dejar abierto cualquier origen
      "Access-Control-Allow-Methods": "GET,POST",
      'Access-Control-Allow-Headers': 'x-clientid',
      "Access-Control-Allow-Credentials": true
  });
    response.end();
}, cors: { credentials: false } })
export class SocketioGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  /**
   * Servidor socket io.
   */
  @WebSocketServer() // Con este decorador, nestjs asigna el servidor a esta variable una vez que esta listo
  private server: Server;

  private localClients: Socket[];

  get clients(): Socket[] {
    return this.localClients;
  }


  private localIsInitialized: boolean;


  /**
   * Indica si el servidor socket.io esta inicializado
   */
  get isInitialized(): boolean {
    return this.localIsInitialized;
  }

  private localEmitAcknowledgements: Subject<any>;

  /**
   * Observable para los "agradecimiento" o respuestas de vuelta que se generan cuando se envia
   * un mensaje
   * */

  get emitAcknowledgements(): Observable <any> {
    return this.localEmitAcknowledgements.asObservable();
  }

  private noInitializedMessage: string;

  /**
   * 
   * @param ubimpApp Aplicacion Ubimp
   */
  constructor(private ubimpApp: UbimpApplicationService) {
    // Se inicializa el arreglo de clientes
    this.localClients = [];
    
    this.noInitializedMessage = 'Server not initialized';

    // Se suscribe al observable para escuchar las ubicaciones 
    this.ubimpApp.locations
    .subscribe({ next: newLocation => {

      this.server.emit('newLocation', newLocation);

    }, error: error => {}, complete: () => {} })

  }


  /**
   * Evento que se dispara cuando se conecta un client socketio
   * @param client Cliente socketio
   * @param args 
   */
  handleConnection(client: Socket, ...args: any[]) {
    this.localClients.push(client);
    console.log(client.handshake.headers['x-clientid']);
    
  }

  /**
   * Evento que se dispara cuando se desconecta un client socketio
   * @param client Cliente que se desconecta
   */
  handleDisconnect(client: Socket) {

  }


 /**
  * Evento que se dispara cuando el servidor esta lista y escuchando a las conexiones de los clientes
  * @param server 
  */
  afterInit(server: any) {
    this.localIsInitialized = true;

    server.use((socket, next) => {

      return next();

    });
    // Aqui no es necesario asignar el parametro server a la variable global server ya que se usa el decorador
  }


  /**
   * 
   * @param event Nombre del evento
   */
  public addEvent(event: string): Observable<any> {
    return new Observable(observer => {
      // Si el servidor esta inicializdo, entonces, agrega el evento
      if (this.localIsInitialized === true) {
        this.server.on(event,
          data => {
                      observer.next(data);
                  }
       );
      }  else {
        observer.error(this.noInitializedMessage);
      }
   });
  }


  /**
   *
   * @param nameSpace
   * @param data
   */
  public sendBroadCast(nameSpace: string, data: any) {

   // Si el servidor esta inicializado, entonces, agrega el evento
    if (this.localIsInitialized === true) {
      this.server.emit(nameSpace, data, acknowledgement => {

          this.localEmitAcknowledgements.next(acknowledgement);
      });
    }  else {
      this.localEmitAcknowledgements.error(this.noInitializedMessage);
    }
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
}
