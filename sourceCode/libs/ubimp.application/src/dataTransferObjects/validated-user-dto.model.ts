export interface ValidatedUserDto {

    /**
     * User name of the user
     */
    username: string;

    /**
     * User identifier
     */
    id: string;

    /**
     * user id who is the owner of the user
     */
    ownerId: string,


    /**
     * Users roles
     */
    roles: string[];
}
