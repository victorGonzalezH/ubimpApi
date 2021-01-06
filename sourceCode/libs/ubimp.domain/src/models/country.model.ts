export class Country {

    /**
     * Nombre del pais
     */
    name: string;

    /**
     * Codigo de telefono
     */
    phoneCode: string;

    /**
     * Identificador aparte del que asigna la base de datos. Este identificador se usa para no mostrar el id que 
     * asigna el manejador de base datos
     */
    countryId: number;
}
