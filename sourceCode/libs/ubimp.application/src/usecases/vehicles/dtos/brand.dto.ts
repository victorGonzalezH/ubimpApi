import { BrandModelDto } from "./brand-model.dto";

export interface BrandDto {
    
    id: string;
    
    name: string;

    order: number;

    models: BrandModelDto[]
}