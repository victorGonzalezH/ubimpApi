export enum VerifyTokenAndAccountResult {

    TokenOKAndAccountInVerification = 0,

    TokenOKAndAccountNotInActivationStatus = 1,

    TokenOKAndUndefinedUser = 2,

    TokenExpired = 3,

}
