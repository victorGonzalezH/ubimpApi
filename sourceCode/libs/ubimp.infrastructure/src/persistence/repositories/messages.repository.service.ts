import { MongoBaseRepository } from 'utils/dist/persistence/mongodb/mongoBaseRepository.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { Message } from '@ubd/ubimp.domain/models/message.model';
import { Messages  } from '@ubd/ubimp.domain/models/messages.model';
import * as mongoose from 'mongoose';
import { Langs } from 'utils/dist/application/Enums/langs.enum';

@Injectable()
export class MessagesRepository extends MongoBaseRepository<Messages>  {

    constructor(@InjectModel('Messages') private readonly messagesModel: Model<Messages & Document>) {
        super(messagesModel);

    }

    /**
     * Obtiene un mensaje de acuerdo al lenguaje y su codigo
     * @param lang lenguaje
     * @param code codigo del mensaje
     */
    public async getMessageByLanguageAndCode(lang: string, code: string): Promise<Message> {

        const messages = await this.messagesModel.findOne({ lang: lang as Langs, messages: { $elemMatch: { code } } });
        if (messages != undefined && messages != null && messages.messages != undefined && messages.messages != null && messages.messages.length > 0) {
            const message = messages.messages.filter( localMessage =>  localMessage.code === code);
            if(message != undefined && message != null && message.length > 0)
            {
                return message[0]
            }
        }

        return null;
    }
}
