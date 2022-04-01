import { BrandModel } from "./brand-model.model";
import { UbimpCatalog } from "./ubimp-catalog.model";

export class Brand extends UbimpCatalog {

    public models: BrandModel[];

    public constructor() {
        super();
    }
}