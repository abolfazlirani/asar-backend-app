import {validatorMapper} from '../../utils/functions.js'
import {validationResult} from 'express-validator'

export function validateRequest(req,res,next){
    console.log(req.body);
    const result=validationResult(req)
    console.log(result)
    if(result.isEmpty()){
        return next();
    }else{
        const errors=validatorMapper(result.errors)
        console.log(errors)
        return res.status(400).json({
            statusCode:res.statusCode,
            errors,
        });
    }
}