
import * as fs from 'fs';
import * as path from 'path';
import { TemplatesTypes } from './templatesTypes.enum';
import { Langs } from 'utils/dist/application/Enums/langs.enum';
import { Template } from './template.model';
export class TemplatesManager {


    private _workDirectory: string;

    get workDirectory(): string {
        return this._workDirectory;
    }

    private templatesDirectory: string;

    private files: Map<string, string>;

    constructor(templatesDirectory: string) {

        this._workDirectory = path.join(__dirname, templatesDirectory);
        this.templatesDirectory = templatesDirectory;

    }

    /**
     * Obtiene una plantilla del directorio indicado / gets a template
     * @param templatedCode Codigo de la plantilla
     * @param lang Lenguaje
     * @param templateType Tipo de la plantila
     */
    public  async getTemplate(templatedCode: string, lang: Langs, templateType: TemplatesTypes): Promise<Template> {

        const files = fs.readdirSync(this.templatesDirectory, 'utf8');
        let keepSearchingTemplate = true;
        let fileIndex = 0;
        while (keepSearchingTemplate && files != null && files != undefined && files.length > 0 && fileIndex < files.length) {
            const file = files[fileIndex];
            const fileNameSplited = file.split('.');
            if (fileNameSplited != null && fileNameSplited != undefined && fileNameSplited.length === 3) {
                const fileName  =  fileNameSplited[0];
                const lowerFileName = fileName.toLocaleLowerCase();
                const fileLang  = fileNameSplited[1];
                const extension = fileNameSplited[2];
                if ( templatedCode.toLowerCase() === lowerFileName && fileLang === lang as string && extension === templateType as string) {
                    keepSearchingTemplate = false;
                    const content = await fs.readFileSync(this.templatesDirectory + '/' + file, 'ascii');
                    return new Template(templatedCode, content, templateType);
                }
            }

            fileIndex++;
        }

        return null;
    }


    // tslint:disable-next-line: max-line-length
    public async replaceContent(sourceTemplatedCode: string, lang: Langs, templateType: TemplatesTypes, keysValues: Map<string, string>): Promise<Template>  {
        try {

            // Se obtiene la plantilla que contiene el contenido que se desea reemplazar
            const template = await this.getTemplate(sourceTemplatedCode, lang, templateType);

            if (template != null) {

                // Se obtiene el nuevo contenido
                const newContent = template.replaceContent(keysValues);
                const codeTemp = Date.now().toString();
                return new Template(codeTemp, newContent, templateType);

                // Se guarda la plantilla con el nuevo contenido
                // return SaveTemplate(newContent, template.DirectoryName, templateType);
            }

            return null;

        } catch (ex) {
            throw ex;
        }
    }
}
