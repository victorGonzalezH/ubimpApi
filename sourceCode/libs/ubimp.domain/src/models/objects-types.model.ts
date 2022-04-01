import { UbimpCatalog } from "./ubimp-catalog.model";

export class ObjectsTypes extends UbimpCatalog {

    constructor(){
        super();
    }

    /**
     * Name
     */
    public name: string;

    /**
     * This is used to match the id of the ui, for example, if a ui element has the id = 2, then
     * an objectType has to has uiId = 2 to match that ui 
     */
    public uiId: number;
}