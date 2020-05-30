import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subject, Observable } from 'rxjs';

@WebSocketGateway()
export class SocketioGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()  server: Server;

  private localSockets: Socket[];

  get sockets(): Socket[] {
    return this.localSockets;
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

  constructor() {
    this.localSockets = [];
    this.noInitializedMessage = 'Server not initialized';
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.localSockets.push(client);
    
  }

  handleDisconnect(client: Socket) {

  }

  afterInit(server: any) {
    this.localIsInitialized = true;
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
