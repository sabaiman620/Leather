import { asyncHandler } from "../../core/utils/async-handler.js";  

const isProduction = process.env.NODE_ENV === "production";
const storeLoginCookies = (res, accessToken, refreshToken, role) => {
    
     console.log(role);
    const normalizedRole = role?.toLowerCase();
    const accessTokenName = `${normalizedRole}AccessToken`;        
    const refreshTokenName = `${normalizedRole}RefreshToken`;       
    
    res.cookie(accessTokenName, accessToken, {
        httpOnly: true,
        secure: isProduction, 
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 15 * 60 * 1000,   // 15 minutes
    });

    res.cookie(refreshTokenName, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
    });
}
const storeAccessToken =(res, accessToken,role = "user") => {

     const normalizedRole = role?.toLowerCase() || "user";
    const accessTokenName = `${normalizedRole}AccessToken`;

    res.cookie(accessTokenName, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
}

export { storeLoginCookies, storeAccessToken};