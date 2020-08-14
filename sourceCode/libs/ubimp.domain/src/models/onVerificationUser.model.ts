
export class OnVerificationUser {

    username: string;

    password: string;

    name: string;

    lastName: string;


    secondLastName: string;

    /**
     * Indica si el usuario ya esta activado, es decir paso por el proceso de activacion
     * exitosamente
     */
    isActivated: boolean;

    /**
     * Indica cuantas veces este mismo usuario con este correo se ha intentado
     * registrar
     */
    activationAttempts: number;

    // Faltan mas propiedades para agregar
}
