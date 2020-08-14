import { TemplatesTypes } from "./templatesTypes.enum";

export class Template {

    private codeLocal: string;

    get code(): string {
        return this.codeLocal;
    }

    private contentLocal: string;

    get content(): string {
        return this.contentLocal;
    }

    private typeLocal: TemplatesTypes;

    get type(): TemplatesTypes {
        return this.typeLocal;
    }

    constructor(code: string, content: string, type: TemplatesTypes) {
        this.codeLocal = code;
        this.contentLocal = content;
        this.typeLocal = type;
    }


    public replaceContent(keysValues: Map<string, string>): string {
        let contentTemp = this.content;

        let index = 0;
        // Cuando usamos foreach en un map, el primer parametro es el valor (value), el segundo es la llave (key)
        keysValues.forEach ((value: string, key: string) => {
            contentTemp = contentTemp.replace(key, value);
            index++;
        });

        return contentTemp;
    }

}
