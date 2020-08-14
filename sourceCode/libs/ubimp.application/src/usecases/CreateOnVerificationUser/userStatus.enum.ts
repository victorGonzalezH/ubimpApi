
export enum UserStatus {
    /**
     * En verificacion es el primer estado, en este estado el usuario se encuentra en verificacion, si el usuario se verifica correctamente
     * //se pasa a estado operacional
     */
    OnVerification,

    /**
     * Activado, una vez verificado, se pasa a este estado para que funcione y haga uso de la plataforma
     */
    Activated,

    /**
     * En lista negra. aquellos usuarios que repetieron varias veces el proceso de verificacion y no lo completaron, entonces
     * se considera como un usuario de riesgo, por lo que se pone en lista negra
     */
    Blacklisted,

    /**
     * Usuario que estaba en estado operacional, pero fue suspendido por:
     *  El tiempo de su contrato ha concluido
     *  EL usuario explicitamente ha concluido el contrato
     *  Por que un usuario administrador o el administrador del sistema explcitamente ha deshabilitado el usuario
     */
    Suspended,

    /**
     * Usuario eliminado de manera logica
     */
    Deleted,
}
