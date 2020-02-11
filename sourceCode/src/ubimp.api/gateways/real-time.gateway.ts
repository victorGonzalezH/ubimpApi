import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import { Interval } from '@nestjs/schedule';


@WebSocketGateway({ origins: '*', path: '/subscribe', perMessageDeflate: false, transports: ['websocket']})
export class RealTimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
  @WebSocketServer()
  server: Server;
  client: any;
  handleDisconnect(client: any) {
    this.logger.log(client.id);
    this.logger.log('disconnected');
    
  }
  
  
  handleConnection(client: any, ...args: any[]) {
    this.logger.log('connected');
    this.client = client;
    client.send( JSON.stringify({
      filter: { },
      error: null,
    }));
  

}

@Interval(10000)
handleInterval() {
  if( this.client != null) {

    this.client.send(JSON.stringify(
      { geometry: { x: -13168039.561515618, y: 4036549.4042077297,
        spatialReference: { wkid: 102100, latestWkid: 3857}},
        attributes: {seconds_since_report: 121.0, run_id: '66_366_0',
        longitude: -118.290512, heading: 90.0, route_id: 66, predictable: true,
        latitude: 34.057678, id: 9486, received_time: 1581310362580}}));
    this.logger.debug('Emmited');
  }
  else
  {
    this.logger.debug('No emmited');
  }
  
}

  constructor(private logger: Logger)
  {
    
  }

  afterInit(server: any) {
    
    this.logger.log("web sockets server init");
    
  }

  @SubscribeMessage('')
  handleMessage(client: any, payload: any): string {
    this.logger.log('data');
    return 'Hello world!';
  }
}
