export enum Roles {

    /**
     * root
     */
    root,

    /**
     * admin
     */
    admin,
    
    /**
     * owner. A user who is paying an ubimp plan
     */
    owner,
    
    /**
     * A user who was added by an owner
     */
    added,
    
    /**
     * Guest, a user who has invitated, this user is added by an admin or a root and its
     * access expire in a certain time
     */
    guest

}