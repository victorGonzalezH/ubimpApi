import { MessageDto } from './messageDto.model';

export interface LanguageDto {

    display: string;

    lang: string;

    messages: MessageDto[];
}
