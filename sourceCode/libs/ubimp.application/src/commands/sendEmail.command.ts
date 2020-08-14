import { Langs } from "utils/dist/application/Enums/langs.enum";

export interface SendEmailCommand {

    tos: string[];
    ccs?: string[];
    bccs?: string[];
    subjectCode: string;
    body: string;
    isBodyHtml: boolean;
    lang: Langs;
    subject?: string;

}
