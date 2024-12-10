const jwt = require('jsonwebtoken');

class TokenService {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
   
    generateToken(userData) {
        return jwt.sign(
            {
                user_id: userData.user_id,
                email: userData.email
            },
            this.secretKey,
            { expiresIn: '24h' }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = TokenService;