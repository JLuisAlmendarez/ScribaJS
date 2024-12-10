const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

class AuthenticationService {
    static async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(SALT_ROUNDS);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error('Error al hashear la contraseña');
        }
    }

    static async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            throw new Error('Error en la verificación de la contraseña');
        }
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Formato de email inválido');
        }
        return true;
    }

    static validatePassword(password) {
        if (password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error('La contraseña debe contener al menos una mayúscula');
        }
        if (!/[a-z]/.test(password)) {
            throw new Error('La contraseña debe contener al menos una minúscula');
        }
        if (!/[0-9]/.test(password)) {
            throw new Error('La contraseña debe contener al menos un número');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            throw new Error('La contraseña debe contener al menos un carácter especial');
        }
        return true;
    }
}

module.exports = AuthenticationService;