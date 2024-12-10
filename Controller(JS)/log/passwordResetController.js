const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./user_model');

class PasswordResetController {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    generateResetToken(email) {
        return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }

    showResetRequestPage(req, res) {
        res.sendFile(path.join(__dirname, 'views', 'passwdResetReq.html'));
    }

    async handleResetRequest(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.sendFile(path.join(__dirname, 'views', 'emailNotification.html'));
            }

            const resetToken = this.generateResetToken(email);

            const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Restablecimiento de Contraseña - Scriba✒',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">Scriba✒</h1>
                        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
                        <p>Este enlace expirará en 1 hora.</p>
                        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);

            res.sendFile(path.join(__dirname, 'views', 'emailNotification.html'));

        } catch (error) {
            console.error('Error en handleResetRequest:', error);
            res.status(500).send('Error al procesar la solicitud');
        }
    }

    async showResetPasswordPage(req, res) {
        const { token } = req.query;

        try {
            jwt.verify(token, process.env.JWT_SECRET);
            res.sendFile(path.join(__dirname, 'views', 'ResetPassword.html'));
        } catch (error) {
            res.status(401).send('El enlace ha expirado o no es válido');
        }
    }

    async handlePasswordReset(req, res) {
        try {
            const { token, password, repeatPassword } = req.body;

            if (password !== repeatPassword) {
                return res.status(400).send('Las contraseñas no coinciden');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const { email } = decoded;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).send('Usuario no encontrado');
            }

            await user.updatePassword(password);

            res.sendFile(path.join(__dirname, 'views', 'password_update_success.html'));

        } catch (error) {
            console.error('Error en handlePasswordReset:', error);
            res.status(500).send('Error al restablecer la contraseña');
        }
    }
}

const express = require('express');
const router = express.Router();
const passwordResetController = new PasswordResetController();

router.get('/forgot-password', passwordResetController.showResetRequestPage);
router.post('/forgot-password', (req, res) => passwordResetController.handleResetRequest(req, res));
router.get('/reset-password', (req, res) => passwordResetController.showResetPasswordPage(req, res));
router.post('/reset-password', (req, res) => passwordResetController.handlePasswordReset(req, res));

module.exports = router;