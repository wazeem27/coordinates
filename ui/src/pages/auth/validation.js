

export const signInValidation = (username , password , callback) => {
    const errors = {}
    if (username == "" || username === undefined) {
        errors.username = "Please Enter your UserName !"
    }
    if (password == "" || password === undefined) {
        errors.password = "Please Enter your Password !"
    }
    if(Object.keys(errors).length == 0){
        return true
    }else{
        callback(errors);
        return false;
    }
}
