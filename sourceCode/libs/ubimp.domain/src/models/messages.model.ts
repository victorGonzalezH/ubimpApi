import { Message } from './message.model';
import { Langs } from 'utils/dist/application/Enums/langs.enum';

export class Messages {

    /**
     * lenguaje / language
     */
    public lang: Langs;

    /**
     * Mensajes / Messages
     */
    public messages: Message[];
}
